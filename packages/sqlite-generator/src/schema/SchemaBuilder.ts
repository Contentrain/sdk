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
          await this.createModelTable(model);
          await this.createModelIndexes(model);
        }

        // 2. İlişki tablosunu oluştur ve indekslerini ekle
        await this.createRelationTable();
        await this.createRelationIndexes();

        // 3. Çeviri tablolarını oluştur ve indekslerini ekle
        for (const model of models) {
          if (model.localization) {
            const localizedFields = model.fields.filter(field => field.localized);
            if (localizedFields.length > 0) {
              await this.createTranslationTable(model, localizedFields);
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

    // Diğer alanlar için UNIQUE olmayan indeksler
    const indexableFields = localizedFields
      .filter(field =>
        field.fieldType !== 'relation'
        && this.isLocalizableFieldType(field),
      );

    indexableFields.forEach((field) => {
      const fieldName = this.fieldNormalizer.normalize(field.fieldId);
      indexes.push({
        table: tableName,
        columns: [fieldName],
        unique: false, // UNIQUE constraint'i kaldır
      });
    });

    if (indexes.length > 0) {
      await this.databaseOptimizer.createIndexes(indexes);
    }
  }

  private isLocalizableFieldType(field: ModelField): boolean {
    // Sistem alanları lokalize edilemez
    if (field.system) {
      return false;
    }

    // İlişki alanları lokalize edilemez
    if (field.fieldType === 'relation') {
      return false;
    }

    // Diğer tüm alanlar lokalize edilebilir
    return true;
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

  private async createModelTable(model: ModelConfig): Promise<void> {
    try {
      console.log('\n=== Tablo Oluşturma Başlıyor ===');
      console.log(`Model: ${model.id}`);
      console.log('Model detayları:', {
        name: model.name,
        localization: model.localization,
        fieldCount: model.fields.length,
        fields: model.fields.map(f => ({
          id: f.fieldId,
          type: f.fieldType,
          localized: f.localized,
          system: f.system,
          componentId: f.componentId,
        })),
      });

      const tableName = this.fieldNormalizer.normalizeTableName(model.id);
      console.log('\nTablo adı:', tableName);

      // Tablo adını doğrula
      this.validateTableName(tableName);

      // 1. Sistem alanlarını hazırla
      const systemFields = this.generateSystemFieldDefinitions();
      console.log('\nSistem alanları:', systemFields);

      // 2. Model alanlarını filtrele ve normalize et
      console.log('\nModel alanları filtreleniyor...');
      const modelFields = model.fields.filter((field) => {
        console.log(`Alan kontrol ediliyor: ${field.fieldId}`, {
          system: field.system,
          fieldType: field.fieldType,
          localized: field.localized,
          componentId: field.componentId,
        });

        // Sistem alanlarını atla (zaten eklenmiş olacak)
        if (field.system) {
          console.log(`Sistem alanı atlanıyor: ${field.fieldId}`);
          return false;
        }

        // İlişki alanları her zaman ana tabloda
        if (field.fieldType === 'relation') {
          console.log(`İlişki alanı ana tabloya eklenecek: ${field.fieldId}`);
          return true;
        }

        // Lokalize edilmemiş alanlar ana tabloda
        if (!field.localized) {
          console.log(`Lokalize edilmemiş alan ana tabloya eklenecek: ${field.fieldId}`);
          return true;
        }

        console.log(`Alan çeviri tablosuna gidecek: ${field.fieldId}`);
        return false;
      });

      // 3. Model alanlarını SQL tanımlarına dönüştür
      console.log('\nFiltrelenen alanlar:', modelFields.map(f => f.fieldId));
      const modelDefinitions = modelFields.map((field) => {
        if (field.fieldType === 'relation') {
          const normalizedName = `${this.fieldNormalizer.normalize(field.fieldId)}_id`;
          console.log(`İlişki alanı için SQL tanımı: ${normalizedName} TEXT`);
          return `${normalizedName} TEXT`;
        }
        return this.generateFieldDefinition(field);
      });
      console.log('\nModel alanları SQL tanımları:', modelDefinitions);

      // 4. SQL oluştur ve çalıştır
      const sql = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          ${[...systemFields, ...modelDefinitions].join(',\n          ')}
        )
      `;

      console.log('\nOluşturulan CREATE TABLE SQL:', sql);
      this.db.exec(sql);

      // Tablo yapısını kontrol et
      const tableInfo = await this.db.all<{ name: string }>(
        `PRAGMA table_info(${tableName})`,
      );
      console.log('\nOluşturulan tablo yapısı:', JSON.stringify(tableInfo, null, 2));

      // Tablo yapısını doğrula
      const columnNames = tableInfo.map(col => col.name);
      const expectedColumns = [...systemFields, ...modelDefinitions].map(def => def.split(' ')[0]);
      const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));

      if (missingColumns.length > 0) {
        throw new SchemaError({
          code: ErrorCode.TABLE_CREATION_FAILED,
          message: `Missing columns in table: ${missingColumns.join(', ')}`,
          details: { modelId: model.id, tableName, missingColumns },
        });
      }

      console.log(`\n${tableName} tablosu başarıyla oluşturuldu.`);

      // 5. Eğer model lokalize edilebilirse, çeviri tablosunu oluştur
      if (model.localization) {
        const localizedFields = model.fields.filter(field => field.localized);
        if (localizedFields.length > 0) {
          await this.createTranslationTable(model, localizedFields);
        }
      }

      console.log('=== Tablo Oluşturma Tamamlandı ===\n');
    }
    catch (error) {
      console.error(`\n!!! ${model.id} modeli için tablo oluşturulurken hata oluştu !!!`);
      console.error('Hata:', error);
      throw new SchemaError({
        code: ErrorCode.TABLE_CREATION_FAILED,
        message: `Failed to create table for model ${model.id}`,
        details: { modelId: model.id },
        cause: error instanceof Error ? error : undefined,
      });
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

  private generateFieldDefinition(field: ModelField): string {
    const normalizedName = this.fieldNormalizer.normalize(field.fieldId);
    const sqlType = this.getSQLType(field.componentId);
    if (!sqlType) {
      throw new SchemaError({
        code: ErrorCode.INVALID_FIELD_TYPE,
        message: `Invalid field type: ${field.componentId}`,
        details: { fieldId: field.fieldId },
      });
    }

    const constraints: string[] = [];
    if (field.validations?.['required-field']?.value === true) {
      constraints.push('NOT NULL');
    }
    if (field.validations?.['unique-field']?.value === true && !field.localized) {
      constraints.push('UNIQUE');
    }

    return `${normalizedName} ${sqlType}${constraints.length ? ` ${constraints.join(' ')}` : ''}`;
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
      // Önce tablo adını doğrula
      this.validateTableName(tableName);

      const result = await this.db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM pragma_table_info('${tableName}') WHERE name = @column`,
        { column: columnName },
      );
      return (result?.count ?? 0) > 0;
    }
    catch (error) {
      console.error(`Error checking column existence: ${tableName}.${columnName}`, error);
      return false;
    }
  }

  private async createTranslationTable(model: ModelConfig, localizedFields: ModelField[]): Promise<void> {
    try {
      console.log('\n=== Çeviri Tablosu Oluşturuluyor ===');
      console.log('Model:', model.id);
      console.log('Lokalize edilmiş alanlar:', localizedFields.map(f => ({
        fieldId: f.fieldId,
        type: f.fieldType,
        localized: f.localized,
        system: f.system,
        componentId: f.componentId,
      })));

      const tableName = `${this.fieldNormalizer.normalizeTableName(model.id)}_translations`;
      console.log('\nTablo adı:', tableName);
      this.validateTableName(tableName);

      // Sadece lokalize edilebilir alanları filtrele
      const translatableFields = localizedFields.filter((field) => {
        const isTranslatable = field.fieldType !== 'relation' && !field.system;
        console.log(`Alan kontrol ediliyor: ${field.fieldId}`, {
          fieldType: field.fieldType,
          system: field.system,
          isTranslatable,
        });
        return isTranslatable;
      });

      if (translatableFields.length === 0) {
        console.log('Çevrilebilir alan bulunamadı, tablo oluşturulmayacak.');
        return;
      }

      // Alan tanımlarını oluştur
      console.log('\nÇeviri tablosu için alan tanımları oluşturuluyor...');
      console.log('Çevrilebilir alanlar:', translatableFields.map(f => f.fieldId));

      // Önce alanları normalize et
      const normalizedFields = translatableFields.map(field => ({
        ...field,
        normalizedName: this.fieldNormalizer.normalize(field.fieldId),
        // Çeviri tablosunda tüm validasyonları kaldır
        validations: {},
      }));

      // Alan tanımlarını oluştur
      const fieldDefinitions = this.generateFieldDefinitions(normalizedFields);
      console.log('Oluşturulan alan tanımları:', fieldDefinitions);

      // Tablo var mı kontrol et
      const tableExistsResult = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM sqlite_master WHERE type = @type AND name = @name',
        { type: 'table', name: tableName },
      );
      const tableExists = (tableExistsResult?.count ?? 0) > 0;

      // Eğer tablo varsa mevcut yapıyı kontrol et
      if (tableExists) {
        const currentColumns = await this.db.all<{ name: string }>(
          `PRAGMA table_info(${tableName})`,
        );
        console.log('\nMevcut tablo yapısı:', currentColumns);

        // Eksik kolonları bul
        const existingColumns = new Set(currentColumns.map(col => col.name));
        const missingColumns = normalizedFields
          .filter(field => !existingColumns.has(field.normalizedName))
          .map(field => field.normalizedName);

        if (missingColumns.length > 0) {
          console.log('Eksik kolonlar:', missingColumns);
          // Eksik kolonları ekle
          for (const columnName of missingColumns) {
            const field = normalizedFields.find(f => f.normalizedName === columnName);
            if (field) {
              const sqlType = this.getSQLType(field.componentId);
              if (sqlType) {
                const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sqlType}`;
                console.log('Kolon ekleniyor:', alterSql);
                this.db.exec(alterSql);
              }
            }
          }
        }
      }
      else {
        // Tablo yoksa oluştur
        const sql = `
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id TEXT NOT NULL,
            locale TEXT NOT NULL,
            ${fieldDefinitions.join(',\n            ')},
            FOREIGN KEY (id) REFERENCES ${this.fieldNormalizer.normalizeTableName(model.id)}(id) ON DELETE CASCADE,
            PRIMARY KEY (id, locale)
          )
        `;

        console.log('\nOluşturulan SQL:', sql);
        this.db.exec(sql);
      }

      // Tablo yapısını kontrol et
      const finalColumns = await this.db.all<{ name: string }>(
        `PRAGMA table_info(${tableName})`,
      );
      console.log('\nFinal tablo yapısı:', finalColumns);

      // Beklenen kolonları kontrol et
      const expectedColumns = ['id', 'locale', ...normalizedFields.map(f => f.normalizedName)];
      console.log('Beklenen kolonlar:', expectedColumns);

      // Son kontrol
      const finalColumnSet = new Set(finalColumns.map(col => col.name));
      const missingInFinal = expectedColumns.filter(col => !finalColumnSet.has(col));
      if (missingInFinal.length > 0) {
        throw new SchemaError({
          code: ErrorCode.TABLE_CREATION_FAILED,
          message: `Missing columns in translation table: ${missingInFinal.join(', ')}`,
          details: { modelId: model.id, tableName, missingColumns: missingInFinal },
        });
      }

      console.log(`\n${tableName} çeviri tablosu başarıyla oluşturuldu.`);
    }
    catch (error) {
      console.error('\n!!! Çeviri tablosu oluşturulurken hata oluştu !!!');
      console.error('Hata:', error);
      throw new SchemaError({
        code: ErrorCode.TABLE_CREATION_FAILED,
        message: `Failed to create translation table for model ${model.id}`,
        details: { modelId: model.id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private async createRelationTable(): Promise<void> {
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
    console.log('\n=== Alan Tanımları Oluşturuluyor ===');
    console.log('Toplam alan sayısı:', fields.length);
    console.log('Alanlar:', fields.map(f => ({
      id: f.fieldId,
      type: f.fieldType,
      localized: f.localized,
      system: f.system,
      componentId: f.componentId,
    })));

    const definitions = new Map<string, string>();

    // Her alan için SQL tanımı oluştur
    for (const field of fields) {
      console.log(`\n${field.fieldId} alanı için SQL tanımı oluşturuluyor...`);

      // 1. Alan adını normalize et
      let normalizedName = this.fieldNormalizer.normalize(field.fieldId);
      console.log('Normalize edilmiş alan adı:', normalizedName);

      // 2. SQL tipini belirle
      let sqlType: string | null = null;
      if (field.fieldType === 'relation') {
        sqlType = 'TEXT';
        normalizedName = `${normalizedName}_id`; // İlişki alanları için _id ekle
        console.log('İlişki alanı için yeni ad:', normalizedName);
      }
      else {
        sqlType = this.getSQLType(field.componentId);
      }

      if (!sqlType) {
        console.log(`${field.componentId} komponenti için SQL tipi bulunamadı`);
        continue;
      }

      // 3. Kısıtlamaları ekle
      const constraints: string[] = [];
      if (field.validations?.['required-field']?.value === true) {
        constraints.push('NOT NULL');
      }
      if (field.validations?.['unique-field']?.value === true && !field.localized) {
        constraints.push('UNIQUE');
      }

      // 4. SQL tanımını oluştur
      const sqlDefinition = `${normalizedName} ${sqlType}${constraints.length ? ` ${constraints.join(' ')}` : ''}`;

      // 5. Tanımı ekle
      if (definitions.has(normalizedName)) {
        console.log(`UYARI: ${normalizedName} alanı zaten tanımlı, atlanıyor`);
        continue;
      }
      definitions.set(normalizedName, sqlDefinition);
      console.log('SQL tanımı:', sqlDefinition);
    }

    const result = Array.from(definitions.values());
    console.log('\nOluşturulan alan tanımları:', result);
    return result;
  }
}
