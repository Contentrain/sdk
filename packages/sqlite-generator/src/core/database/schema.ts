import type BetterSQLite3 from 'better-sqlite3';
import type { ContentrainComponentId, ContentrainFieldType } from 'packages/query/dist';
import type { ModelField } from '../../types';
import { normalizeName, normalizeTableName } from '../../utils/sql';

export class SchemaManager {
  private readonly SYSTEM_FIELDS = ['ID', 'status', 'created_at', 'updated_at', 'scheduled', 'scheduled_at'];
  private readonly LOCALIZATION_SYSTEM_FIELDS = ['ID', 'lang'];

  constructor(private db: BetterSQLite3.Database) {
    console.log('SchemaManager başlatıldı');
  }

  getSQLiteType(fieldType: ContentrainFieldType, componentId: ContentrainComponentId): string {
    let sqlType: string;
    // Önce component ID'ye göre özel durumları kontrol et
    switch (componentId) {
      case 'decimal':
      case 'percent':
        sqlType = 'REAL';
        break;
      case 'integer':
      case 'rating':
        sqlType = 'INTEGER';
        break;
      case 'single-line-text':
      case 'multi-line-text':
      case 'email':
      case 'url':
      case 'slug':
      case 'color':
      case 'json':
      case 'md-editor':
      case 'rich-text-editor':
      case 'phone-number':
        sqlType = 'TEXT';
        break;
      case 'checkbox':
      case 'switch':
        sqlType = 'INTEGER'; // 0/1 olarak saklanır
        break;
      case 'date':
      case 'date-time':
        sqlType = 'DATETIME';
        break;
      case 'media':
        sqlType = 'TEXT'; // Dosya yolları
        break;
      case 'one-to-one':
      case 'one-to-many':
        sqlType = 'TEXT'; // İlişki ID'leri
        break;
      default:
        sqlType = 'TEXT';
    }
    console.log('Alan tipi belirlendi:', { fieldType, componentId, sqlType });
    return sqlType;
  }

  createMainTableSQL(modelId: string, fields: ModelField[]): string {
    console.log('Ana tablo SQL oluşturma başladı:', { modelId, fieldCount: fields.length });
    // Model ID'yi normalize et
    const normalizedModelId = normalizeTableName(modelId);

    // Sistem alanlarını hariç tut - normalize edilmiş isimleri de kontrol et
    const userFields = fields.filter((field) => {
      const normalizedFieldId = normalizeName(field.fieldId);
      return !this.SYSTEM_FIELDS.includes(field.fieldId) && !this.SYSTEM_FIELDS.includes(normalizedFieldId);
    });

    console.log('Filtrelenmiş kullanıcı alanları:', {
      original: fields.map(f => f.fieldId),
      filtered: userFields.map(f => f.fieldId),
      systemFields: this.SYSTEM_FIELDS,
    });

    const columns = userFields.map((field) => {
      const sqlType = this.getSQLiteType(field.fieldType, field.componentId);
      const constraints = [];

      if (field.validations?.['required-field']?.value) {
        constraints.push('NOT NULL');
      }
      if (field.validations?.['unique-field']?.value) {
        constraints.push('UNIQUE');
      }

      // Alan ID'yi normalize et
      const normalizedFieldId = normalizeName(field.fieldId);
      const columnDef = `${normalizedFieldId} ${sqlType} ${constraints.join(' ')}`;
      console.log('Kolon tanımı oluşturuldu:', {
        fieldId: field.fieldId,
        normalizedFieldId,
        sqlType,
        constraints,
        columnDef,
      });
      return columnDef;
    });

    // Sistem alanlarını ekle
    columns.unshift('ID TEXT PRIMARY KEY');
    columns.push('status INTEGER NOT NULL');
    columns.push('created_at DATETIME NOT NULL');
    columns.push('updated_at DATETIME NOT NULL');
    columns.push('scheduled INTEGER NOT NULL DEFAULT 0');
    columns.push('scheduled_at DATETIME');

    const sql = `CREATE TABLE IF NOT EXISTS ${normalizedModelId} (${columns.join(', ')})`;
    console.log('Ana tablo SQL oluşturuldu:', { modelId, normalizedModelId, sql });
    return sql;
  }

  createMainTable(modelId: string, fields: ModelField[]): void {
    console.log('Ana tablo oluşturma başladı:', { modelId });
    const sql = this.createMainTableSQL(modelId, fields);
    this.db.exec(sql);
    console.log('Ana tablo oluşturuldu:', { modelId });
  }

  createLocalizationTableSQL(modelId: string, fields: ModelField[]): string {
    console.log('Lokalizasyon tablosu SQL oluşturma başladı:', { modelId, fieldCount: fields.length });
    // Model ID'yi normalize et
    const normalizedModelId = normalizeTableName(modelId);

    // Sistem alanlarını hariç tut
    const userFields = fields.filter(field =>
      !this.SYSTEM_FIELDS.includes(field.fieldId)
      && !this.LOCALIZATION_SYSTEM_FIELDS.includes(field.fieldId),
    );

    const columns = userFields.map((field) => {
      const sqlType = this.getSQLiteType(field.fieldType, field.componentId);
      const constraints = [];

      if (field.validations?.['required-field']?.value) {
        constraints.push('NOT NULL');
      }

      // Alan ID'yi normalize et
      const normalizedFieldId = normalizeName(field.fieldId);
      const columnDef = `${normalizedFieldId} ${sqlType} ${constraints.join(' ')}`;
      console.log('Lokalizasyon kolonu tanımı:', {
        fieldId: field.fieldId,
        normalizedFieldId,
        sqlType,
        constraints,
        columnDef,
      });
      return columnDef;
    });

    // Sistem alanlarını ekle
    columns.unshift('ID TEXT NOT NULL');
    columns.unshift('lang TEXT NOT NULL');
    columns.push('created_at DATETIME NOT NULL');
    columns.push('updated_at DATETIME NOT NULL');
    columns.push('PRIMARY KEY (ID, lang)');
    columns.push(`FOREIGN KEY (ID) REFERENCES ${normalizedModelId}(ID) ON DELETE CASCADE`);

    const sql = `CREATE TABLE IF NOT EXISTS ${normalizedModelId}_i18n (
      ${columns.join(',\n      ')}
    ) WITHOUT ROWID;`;
    console.log('Lokalizasyon tablosu SQL oluşturuldu:', { modelId, normalizedModelId, sql });
    return sql;
  }

  createLocalizationTable(modelId: string, fields: ModelField[]): void {
    console.log('Lokalizasyon tablosu oluşturma başladı:', { modelId });
    const sql = this.createLocalizationTableSQL(modelId, fields);
    this.db.exec(sql);
    console.log('Lokalizasyon tablosu oluşturuldu:', { modelId });
  }

  createRelationTableSQL(modelId: string, field: ModelField, targetModelId: string): string {
    const tableName = normalizeTableName(modelId, field.fieldId);
    const sourceTable = normalizeTableName(modelId);
    const targetTable = normalizeTableName(targetModelId);

    console.log('İlişki tablosu oluşturuluyor:', {
      tableName,
      sourceTable,
      targetTable,
      fieldType: field.fieldType,
    });

    const sql = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_id, target_id),
        FOREIGN KEY (source_id) REFERENCES ${sourceTable}(ID) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES ${targetTable}(ID) ON DELETE CASCADE
      )
    `;

    console.log('İlişki tablosu SQL sorgusu:', { sql });
    return sql;
  }

  createRelationTable(modelId: string, relationField: ModelField, targetModelId: string): void {
    console.log('İlişki tablosu oluşturma başladı:', { modelId, fieldId: relationField.fieldId, targetModelId });
    const sql = this.createRelationTableSQL(modelId, relationField, targetModelId);
    this.db.exec(sql);
    console.log('İlişki tablosu oluşturuldu:', { modelId, fieldId: relationField.fieldId, targetModelId });
  }

  async createIndexes(modelId: string, fields: ModelField[]): Promise<void> {
    console.log('İndeks oluşturma başladı:', { modelId, fieldCount: fields.length });
    // Model ID'yi normalize et
    const normalizedModelId = normalizeTableName(modelId);

    // Temel indeksler
    const statusIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_${normalizedModelId}_status ON ${normalizedModelId}(status);
    `;
    console.log('Status indeksi oluşturuluyor:', { sql: statusIndexSQL });
    this.db.exec(statusIndexSQL);

    // Alan indeksleri
    for (const field of fields) {
      if (field.validations?.['unique-field']?.value) {
        // Alan ID'yi normalize et
        const normalizedFieldId = normalizeName(field.fieldId);
        const uniqueIndexSQL = `
          CREATE UNIQUE INDEX IF NOT EXISTS idx_${normalizedModelId}_${normalizedFieldId}
          ON ${normalizedModelId}(${normalizedFieldId});
        `;
        console.log('Unique indeks oluşturuluyor:', {
          fieldId: field.fieldId,
          normalizedFieldId,
          sql: uniqueIndexSQL,
        });
        this.db.exec(uniqueIndexSQL);
      }
    }
    console.log('İndeks oluşturma tamamlandı:', { modelId });
  }
}
