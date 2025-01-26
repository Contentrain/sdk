import type { Database } from 'better-sqlite3';
import type { ContentItem, ModelField, ModelMetadata } from '../../types';
import { normalizeName, normalizeTableName } from '../../utils/sql';

export class TableManager {
  private readonly SYSTEM_FIELDS = ['ID', 'status', 'created_at', 'updated_at', 'scheduled'];
  private readonly LOCALIZATION_SYSTEM_FIELDS = ['ID', 'lang'];

  constructor(
    private db: Database,
    private modelMetadata: Record<string, ModelMetadata>,
    private modelFields: Record<string, ModelField[]>,
  ) {
    console.log('TableManager başlatıldı');
  }

  private normalizeRelationForDB(relation: { sourceId: string, targetId: string }): Record<string, any> {
    const normalized = {
      source_id: relation.sourceId,
      target_id: relation.targetId,
    };
    console.log('İlişki normalize edildi:', { original: relation, normalized });
    return normalized;
  }

  private normalizeContentForDB(content: ContentItem | Record<string, any>): Record<string, any> {
    console.log('İçerik normalizasyonu başladı:', content);
    const normalized: Record<string, any> = {};

    // Her property'i normalize et
    for (const [key, value] of Object.entries(content)) {
      const normalizedKey = key === 'ID' ? key : normalizeName(key);
      console.log('Alan normalizasyonu:', {
        originalKey: key,
        normalizedKey,
        originalValue: value,
      });

      // Boolean değerleri 0/1'e çevir
      if (typeof value === 'boolean') {
        normalized[normalizedKey] = value ? 1 : 0;
      }
      // Array değerleri JSON string'e çevir
      else if (Array.isArray(value)) {
        normalized[normalizedKey] = JSON.stringify(value);
      }
      // Diğer değerleri olduğu gibi kullan
      else {
        normalized[normalizedKey] = value;
      }
    }

    console.log('İçerik normalizasyonu tamamlandı:', {
      original: content,
      normalized,
    });

    return normalized;
  }

  private getTableName(modelId: string, suffix?: string): string {
    let tableName: string;
    if (suffix) {
      // i18n özel durumu
      if (suffix === 'i18n') {
        tableName = `${normalizeTableName(modelId)}_${suffix}`;
      }
      else {
        tableName = `${normalizeTableName(modelId)}_${normalizeName(suffix)}`;
      }
    }
    else {
      tableName = normalizeTableName(modelId);
    }
    console.log('Tablo adı oluşturuldu:', { modelId, suffix, tableName });
    return tableName;
  }

  private getLocalizableFields(modelId: string): string[] {
    const fields = this.modelFields[modelId];
    if (!fields) {
      console.warn('Model fields bulunamadı:', modelId);
      return [];
    }

    return fields
      .filter((field) => {
        // İlişki alanları lokalize edilemez
        if (field.fieldType === 'relation')
          return false;
        // Sistem alanları lokalize edilemez
        if (this.SYSTEM_FIELDS.includes(field.fieldId))
          return false;
        return true;
      })
      .map(field => normalizeName(field.fieldId));
  }

  async importContent(modelId: string, content: ContentItem[]): Promise<void> {
    const metadata = this.modelMetadata[modelId];
    if (!metadata) {
      throw new Error(`Model metadata bulunamadı: ${modelId}`);
    }

    // Lokalize olsa bile ana tabloya veri gir
    console.log('Ana tabloya içerik aktarımı başladı:', { modelId, contentCount: content.length });

    const tableName = this.getTableName(modelId);
    console.log('Tablo adı:', { modelId, tableName });

    const normalizedContent = content.map(item => this.normalizeContentForDB(item));

    // Tüm kayıtlardaki alanları birleştir
    const allColumns = new Set<string>();
    normalizedContent.forEach((item) => {
      Object.keys(item).forEach(key => allColumns.add(key));
    });

    // Sistem alanlarını ekle
    this.SYSTEM_FIELDS.forEach(field => allColumns.add(field));

    // Filtrelenmiş kolonları oluştur
    const columns = Array.from(allColumns);

    console.log('Import edilecek kolonlar:', {
      tableName,
      allColumns: columns,
      systemFields: this.SYSTEM_FIELDS,
    });

    // SQL sorgusunu hazırla
    const placeholders = columns.map(col => `@${col}`);

    const sql = `
      INSERT OR REPLACE INTO ${tableName} (
        ${columns.join(', ')}
      ) VALUES (
        ${placeholders.join(', ')}
      )
    `;

    console.log('SQL sorgusu:', { sql });

    const stmt = this.db.prepare(sql);

    try {
      const insertMany = this.db.transaction((items: any[]) => {
        for (const item of items) {
          console.log('Ana tabloya veri eklenecek:', { tableName, normalizedItem: item });

          // Her alan için NULL kontrolü yap
          const params = columns.reduce((acc: any, col: string) => {
            acc[col] = item[col] ?? null;
            return acc;
          }, {});

          stmt.run(params);
        }
      });

      insertMany(normalizedContent);
      console.log('Ana tabloya içerik aktarımı tamamlandı');
    }
    catch (error) {
      console.error('İçerik aktarım hatası:', {
        model: modelId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async importLocalizedContent(modelId: string, lang: string, content: ContentItem[]): Promise<void> {
    const metadata = this.modelMetadata[modelId];
    if (!metadata) {
      throw new Error(`Model metadata bulunamadı: ${modelId}`);
    }

    if (!metadata.localization) {
      throw new Error(`Model lokalize değil: ${modelId}`);
    }

    // Gelen içeriği logla
    console.log(`${modelId} modeli için gelen içerik:`, {
      lang,
      contentCount: content.length,
      ids: content.map(item => item.ID),
      firstItem: content[0],
    });

    // Ana tablodaki ID'leri kontrol et
    const mainTableName = this.getTableName(modelId);
    const mainTableIds = this.db
      .prepare(`SELECT ID FROM ${mainTableName}`)
      .all() as Array<{ ID: string }>;

    console.log(`${modelId} ana tablo ID'leri:`, {
      tableName: mainTableName,
      ids: mainTableIds.map(row => row.ID),
      count: mainTableIds.length,
    });

    const existingIds = new Set(mainTableIds.map(row => row.ID));

    // ID eşleşmelerini detaylı logla
    content.forEach((item) => {
      console.log(`ID Kontrolü - ${item.ID}:`, {
        exists: existingIds.has(item.ID),
        itemContent: item,
      });
    });

    // Sadece ana tabloda var olan ID'leri içeren kayıtları filtrele
    const validContent = content.filter((item) => {
      const isValid = existingIds.has(item.ID);
      if (!isValid) {
        console.log(`UYARI: ${modelId} modeli için ${item.ID} ID'li kayıt ana tabloda bulunamadı`, {
          itemContent: item,
        });
      }
      return isValid;
    });

    if (validContent.length === 0) {
      console.log(`${modelId} modeli için geçerli lokalize içerik bulunamadı`);
      return;
    }

    const localizableFields = this.getLocalizableFields(modelId);
    console.log('Lokalize edilebilir alanlar:', { modelId, fields: localizableFields });

    console.log('Lokalize içerik aktarımı başladı:', {
      modelId,
      lang,
      contentCount: validContent.length,
      filteredCount: content.length - validContent.length,
    });

    const tableName = this.getTableName(modelId, 'i18n');
    const normalizedContent = validContent.map(item => this.normalizeContentForDB(item));

    // Tüm kayıtlardaki alanları birleştir
    const allColumns = new Set<string>();
    normalizedContent.forEach((item) => {
      Object.keys(item).forEach(key => allColumns.add(key));
    });

    // Gerekli sistem alanlarını ekle
    const requiredSystemFields = ['created_at', 'updated_at'];
    requiredSystemFields.forEach(field => allColumns.add(field));

    // Lokalize edilebilir alanları ve gerekli sistem alanlarını filtrele
    const columns = Array.from(allColumns).filter(col =>
      requiredSystemFields.includes(col)
      || (!this.LOCALIZATION_SYSTEM_FIELDS.includes(col)
        && localizableFields.includes(col)),
    );

    console.log('Lokalize edilecek kolonlar:', {
      tableName,
      allColumns: Array.from(allColumns),
      filteredColumns: columns,
      systemFields: this.SYSTEM_FIELDS,
      localizationFields: this.LOCALIZATION_SYSTEM_FIELDS,
      requiredSystemFields,
    });

    const sql = `
      INSERT OR REPLACE INTO ${tableName} (
        ID, lang,
        ${columns.join(', ')}
      ) VALUES (
        @ID, @lang,
        ${columns.map(k => `@${k}`).join(', ')}
      )
    `;
    console.log('Lokalizasyon SQL sorgusu:', { sql });

    const stmt = this.db.prepare(sql);

    try {
      const insertMany = this.db.transaction((items: ContentItem[]) => {
        for (const item of items) {
          const normalizedItem = this.normalizeContentForDB(item);
          console.log('Lokalize veri eklenecek:', {
            tableName,
            id: normalizedItem.ID,
            originalId: item.ID,
            normalizedItem,
            originalItem: item,
            lang,
          });

          // Sadece gerekli alanları al
          const params = {
            ID: normalizedItem.ID,
            lang,
            ...columns.reduce((acc: any, col: string) => {
              acc[col] = normalizedItem[col] ?? null;
              return acc;
            }, {}),
          };

          console.log('SQL parametreleri:', {
            tableName,
            id: params.ID,
            params,
          });

          stmt.run(params);
        }
      });

      insertMany(validContent);
      console.log('Lokalize içerik aktarımı tamamlandı:', {
        modelId,
        lang,
        tableName,
        aktarılanIds: validContent.map(item => item.ID),
      });
    }
    catch (error) {
      console.error('Lokalize içerik aktarım hatası:', {
        model: modelId,
        lang,
        error: error instanceof Error ? error.message : 'Unknown error',
        sonİşlenenId: validContent[validContent.length - 1]?.ID,
      });
      throw error;
    }
  }

  async importRelations(modelId: string, fieldId: string, relations: { sourceId: string, targetId: string }[]): Promise<void> {
    console.log('İlişki aktarımı başladı:', { modelId, fieldId, relationCount: relations.length });
    const tableName = this.getTableName(modelId, fieldId);

    // Önce tabloyu temizle
    const clearSQL = `DELETE FROM ${tableName} WHERE 1=1`;
    this.db.prepare(clearSQL).run();
    console.log('İlişki tablosu temizlendi:', { tableName });

    // Yeni ilişkileri ekle
    const sql = `
      INSERT OR REPLACE INTO ${tableName} (source_id, target_id)
      VALUES (@source_id, @target_id)
    `;
    console.log('İlişki SQL sorgusu:', { sql });

    const stmt = this.db.prepare(sql);

    try {
      const transaction = this.db.transaction((items: { sourceId: string, targetId: string }[]) => {
        for (const item of items) {
          const normalizedItem = this.normalizeRelationForDB(item);
          console.log('İlişki verisi eklenecek:', {
            tableName,
            normalizedItem,
          });
          stmt.run(normalizedItem);
        }
      });

      transaction(relations);
      console.log('İlişki aktarımı tamamlandı:', { modelId, fieldId, tableName });
    }
    catch (error) {
      console.error('İlişki aktarım hatası:', {
        model: modelId,
        fieldId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
