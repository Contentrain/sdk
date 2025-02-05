import type { Database } from '../types/database';
import type { ContentrainBaseType, ContentrainComponentType, ModelConfig, ModelField } from '../types/model';
import type { IndexConfig } from '../utils/DatabaseOptimizer';
import { FieldNormalizer } from '../normalizer/FieldNormalizer';
import { ErrorCode, SchemaError } from '../types/errors';
import { DatabaseOptimizer } from '../utils/DatabaseOptimizer';
import { SecurityManager } from '../utils/SecurityManager';

export class SchemaBuilder {
  private fieldNormalizer: FieldNormalizer;
  private securityManager: SecurityManager;
  private databaseOptimizer: DatabaseOptimizer;

  constructor(
    private db: Database,
    securityManager?: SecurityManager,
  ) {
    this.fieldNormalizer = new FieldNormalizer();
    this.securityManager = securityManager ?? new SecurityManager();
    this.databaseOptimizer = new DatabaseOptimizer(db);
  }

  public async buildSchema(models: ModelConfig[]): Promise<void> {
    await this.db.transaction(async () => {
      try {
        // 1. Ana tabloları oluştur ve indekslerini ekle
        for (const model of models) {
          this.createModelTable(model);
          await this.createModelIndexes(model);
        }

        // 2. İlişki tablosunu oluştur ve indekslerini ekle
        this.createRelationTable();
        await this.createRelationIndexes();

        // 3. Çeviri tablolarını oluştur ve indekslerini ekle
        for (const model of models) {
          if (model.localization) {
            const localizedFields = model.fields.filter(field => field.localized);
            if (localizedFields.length > 0) {
              this.createTranslationTable(model, localizedFields);
              await this.createTranslationIndexes(model, localizedFields);
            }
          }
        }
      }
      catch (error) {
        throw new SchemaError({
          code: ErrorCode.SCHEMA_CREATION_FAILED,
          message: 'Failed to create database schema',
          cause: error instanceof Error ? error : undefined,
        });
      }
    });
  }

  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM sqlite_master WHERE type = :type AND name = :name',
        { type: 'table', name: tableName },
      );
      return (result?.count ?? 0) > 0;
    }
    catch (error) {
      console.error(`Error checking table existence: ${tableName}`, error);
      return false;
    }
  }

  private async createModelIndexes(model: ModelConfig): Promise<void> {
    const tableName = this.fieldNormalizer.normalizeTableName(model.id);
    const indexes: IndexConfig[] = [];

    // Status indeksi
    indexes.push({
      table: tableName,
      columns: ['status'],
      where: 'status != \'draft\'',
    });

    // Benzersiz alan indeksleri
    for (const field of model.fields) {
      if (!field.validations?.['unique-field']?.value) {
        continue;
      }

      // İlişki alanları için _id ekle
      let fieldName = this.fieldNormalizer.normalize(field.fieldId);
      if (field.options?.reference?.value) {
        fieldName = `${fieldName}_id`;
      }

      // Kolon varlığını kontrol et
      const columnExists = await this.columnExists(tableName, fieldName);
      if (!columnExists) {
        continue;
      }

      indexes.push({
        table: tableName,
        columns: [fieldName],
        unique: true,
      });
    }

    if (indexes.length > 0) {
      await this.databaseOptimizer.createIndexes(indexes);
    }
  }

  private async createTranslationIndexes(model: ModelConfig, localizedFields: ModelField[]): Promise<void> {
    const tableName = `${this.fieldNormalizer.normalizeTableName(model.id)}_translations`;

    // Temel indeksler
    const indexes: IndexConfig[] = [
      {
        table: tableName,
        columns: ['id', 'locale'],
        unique: true,
      },
      {
        table: tableName,
        columns: ['locale'],
      },
    ];

    // Sadece lokalize edilebilir ve ilişki olmayan alanlar için unique indeks oluştur
    const uniqueFields = localizedFields
      .filter(field =>
        field.validations?.['unique-field']?.value
        && field.fieldType !== 'relation'
        && this.isLocalizableFieldType(field.fieldType, field.componentId),
      );

    uniqueFields.forEach((field) => {
      const fieldName = this.fieldNormalizer.normalize(field.fieldId);
      indexes.push({
        table: tableName,
        columns: [fieldName],
        unique: true,
      });
    });

    if (indexes.length > 0) {
      await this.databaseOptimizer.createIndexes(indexes);
    }
  }

  private isLocalizableFieldType(fieldType: ContentrainBaseType, componentId: ContentrainComponentType): boolean {
    // Lokalize edilebilecek alan tipleri
    const localizableTypes = new Set<ContentrainBaseType>([
      'string',
      'array',
      'media',
    ]);

    // Lokalize edilebilecek komponentler
    const localizableComponents = new Set<ContentrainComponentType>([
      'single-line-text',
      'multi-line-text',
      'rich-text-editor',
      'markdown-editor',
      'select',
      'media',
    ]);

    return localizableTypes.has(fieldType) && localizableComponents.has(componentId);
  }

  private async createRelationIndexes(): Promise<void> {
    const tableName = this.fieldNormalizer.normalizeRelationTableName('contentrain', 'relations');
    const indexes: IndexConfig[] = [
      {
        table: tableName,
        columns: ['source_model', 'source_id'],
      },
      {
        table: tableName,
        columns: ['target_model', 'target_id'],
      },
      {
        table: tableName,
        columns: ['type'],
      },
    ];

    await this.databaseOptimizer.createIndexes(indexes);
  }

  private createModelTable(model: ModelConfig): void {
    try {
      const tableName = this.fieldNormalizer.normalizeTableName(model.id);
      this.validateTableName(tableName);

      // Sistem alanlarını hazırla
      const systemFields = this.generateSystemFieldDefinitions();

      // Model alanlarını hazırla
      const modelFields = this.generateFieldDefinitions(
        model.fields.filter((field) => {
          // Sistem alanlarını ve çeviri alanlarını filtrele
          if (field.system)
            return false;
          // Lokalizasyon aktif ve alan lokalize edilebilir ise ana tabloya ekleme
          if (model.localization && field.localized && this.isLocalizableFieldType(field.fieldType, field.componentId)) {
            return false;
          }
          return true;
        }),
      );

      // SQL oluştur ve çalıştır
      const sql = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          ${[...systemFields, ...modelFields].join(',\n          ')}
        )
      `;

      this.db.exec(sql);
    }
    catch (error) {
      throw new SchemaError({
        code: ErrorCode.TABLE_CREATION_FAILED,
        message: `Failed to create table for model ${model.id}`,
        details: { modelId: model.id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private createTranslationTable(model: ModelConfig, localizedFields: ModelField[]): void {
    try {
      const tableName = `${this.fieldNormalizer.normalizeTableName(model.id)}_translations`;
      this.validateTableName(tableName);

      // Sadece lokalize edilebilir alanları filtrele
      const translatableFields = this.generateFieldDefinitions(
        localizedFields.filter((field) => {
          // İlişki alanlarını hariç tut
          if (field.fieldType === 'relation')
            return false;
          // Sadece lokalize edilebilir alanları al
          return this.isLocalizableFieldType(field.fieldType, field.componentId);
        }),
      );

      if (translatableFields.length === 0) {
        return;
      }

      // SQL oluştur ve çalıştır
      const sql = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id TEXT NOT NULL,
          locale TEXT NOT NULL,
          ${translatableFields.join(',\n          ')},
          FOREIGN KEY (id) REFERENCES ${this.fieldNormalizer.normalizeTableName(model.id)}(id) ON DELETE CASCADE,
          PRIMARY KEY (id, locale)
        )
      `;

      this.db.exec(sql);
    }
    catch (error) {
      throw new SchemaError({
        code: ErrorCode.TABLE_CREATION_FAILED,
        message: `Failed to create translation table for model ${model.id}`,
        details: { modelId: model.id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private createRelationTable(): void {
    try {
      const relationTableName = this.fieldNormalizer.normalizeRelationTableName('contentrain', 'relations');
      this.validateTableName(relationTableName);

      const sql = `
        CREATE TABLE IF NOT EXISTS ${relationTableName} (
          id TEXT PRIMARY KEY,
          source_model TEXT NOT NULL,
          source_id TEXT NOT NULL,
          target_model TEXT NOT NULL,
          target_id TEXT NOT NULL,
          field_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('one-to-one', 'one-to-many')),
          UNIQUE(source_model, source_id, target_model, field_id)
        )
      `;

      this.db.exec(sql);
    }
    catch (error) {
      throw new SchemaError({
        code: ErrorCode.TABLE_CREATION_FAILED,
        message: 'Failed to create relation table',
        details: { table: 'contentrain_relations' },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private generateFieldDefinitions(fields: ModelField[]): string[] {
    return fields
      .filter(field => !field.system)
      .map(field => this.generateFieldDefinition(field))
      .filter((def): def is string => def !== null);
  }

  private generateFieldDefinition(field: ModelField): string | null {
    try {
      // İlişki alanları için
      if (field.options?.reference?.value) {
        const normalizedName = this.fieldNormalizer.normalize(field.fieldId);
        const columnName = `${normalizedName}_id`;
        this.validateColumnName(columnName);
        return `${columnName} TEXT`;
      }

      // Normal alanlar için
      const sqlType = this.getSQLType(field.componentId);
      if (!sqlType) {
        console.log(`No SQL type mapping for component type: ${field.componentId}`);
        return null;
      }

      const normalizedName = this.fieldNormalizer.normalize(field.fieldId);
      this.validateColumnName(normalizedName);

      // Zorunlu alan kontrolü
      const isRequired = field.validations?.['required-field']?.value === true;
      return `${normalizedName} ${sqlType}${isRequired ? ' NOT NULL' : ''}`;
    }
    catch (error) {
      console.error(`Error generating field definition for ${field.fieldId}:`, error);
      return null;
    }
  }

  private generateSystemFieldDefinitions(): string[] {
    return [
      'id TEXT PRIMARY KEY',
      'created_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL',
      'status TEXT NOT NULL CHECK(status IN (\'draft\', \'changed\', \'publish\'))',
    ];
  }

  private getSQLType(componentType: ContentrainComponentType): string | null {
    const typeMap: Record<ContentrainComponentType, string | null> = {
      'single-line-text': 'TEXT',
      'multi-line-text': 'TEXT',
      'rich-text-editor': 'TEXT',
      'markdown-editor': 'TEXT',
      'email': 'TEXT',
      'url': 'TEXT',
      'slug': 'TEXT',
      'color': 'TEXT',
      'phone-number': 'TEXT',
      'integer': 'INTEGER',
      'decimal': 'REAL',
      'rating': 'INTEGER',
      'percent': 'REAL',
      'checkbox': 'INTEGER',
      'switch': 'INTEGER',
      'date': 'TEXT',
      'date-time': 'TEXT',
      'media': 'TEXT',
      'json': 'TEXT',
      'select': 'TEXT',
      'one-to-one': null,
      'one-to-many': null,
    };

    return typeMap[componentType] || null;
  }

  private validateTableName(tableName: string): void {
    try {
      this.securityManager.validateSQLInput(tableName);
    }
    catch (error) {
      throw new SchemaError({
        code: ErrorCode.INVALID_INPUT,
        message: `Invalid table name: ${tableName}`,
        details: { tableName },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private async columnExists(tableName: string, columnName: string): Promise<boolean> {
    try {
      const result = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM pragma_table_info(?1) WHERE name = ?2',
        { 1: tableName, 2: columnName },
      );
      return (result?.count ?? 0) > 0;
    }
    catch (error) {
      console.error(`Error checking column existence: ${tableName}.${columnName}`, error);
      return false;
    }
  }

  private validateColumnName(columnName: string): void {
    try {
      this.securityManager.validateSQLInput(columnName);
    }
    catch (error) {
      throw new SchemaError({
        code: ErrorCode.INVALID_INPUT,
        message: `Invalid column name: ${columnName}`,
        details: { columnName },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}
