import type { Database } from 'better-sqlite3';
import type { ContentItem } from '../../types';
import { normalizeName, normalizeTableName } from '../../utils/sql';

export class TableManager {
  private readonly SYSTEM_FIELDS = ['ID', 'status', 'created_at', 'updated_at', 'scheduled'];
  private readonly LOCALIZATION_SYSTEM_FIELDS = ['ID', 'lang'];

  constructor(private db: Database) {
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

  async importContent(modelId: string, content: ContentItem[]): Promise<void> {
    console.log('İçerik aktarımı başladı:', { modelId, contentCount: content.length });

    const tableName = this.getTableName(modelId);
    console.log('Tablo adı oluşturuldu:', { modelId, suffix: undefined, tableName });

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
      INSERT INTO ${tableName} (
        ${columns.join(', ')}
      ) VALUES (
        ${placeholders.join(', ')}
      )
    `;

    console.log('SQL sorgusu hazırlandı:', { sql });

    const stmt = this.db.prepare(sql);

    try {
      const insertMany = this.db.transaction((items: any[]) => {
        for (const item of items) {
          console.log('Veri eklenecek:', { tableName, normalizedItem: item });

          // Her alan için NULL kontrolü yap
          const params = columns.reduce((acc: any, col: string) => {
            acc[col] = item[col] ?? null; // Eğer değer yoksa NULL kullan
            return acc;
          }, {});

          stmt.run(params);
        }
      });

      insertMany(normalizedContent);
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
    console.log('Lokalize içerik aktarımı başladı:', { modelId, lang, contentCount: content.length });
    const tableName = this.getTableName(modelId, 'i18n');

    // İlk içeriğin alanlarını al ve normalize et
    const firstItem = this.normalizeContentForDB(content[0] || {});
    const columns = Object.keys(firstItem).filter(k =>
      !this.SYSTEM_FIELDS.includes(k)
      && !this.LOCALIZATION_SYSTEM_FIELDS.includes(k),
    );

    console.log('Lokalize edilecek kolonlar:', {
      tableName,
      allColumns: Object.keys(firstItem),
      filteredColumns: columns,
      systemFields: this.SYSTEM_FIELDS,
      localizationFields: this.LOCALIZATION_SYSTEM_FIELDS,
    });

    const sql = `
      INSERT INTO ${tableName} (
        ID, lang,
        ${columns.join(', ')}
      ) VALUES (
        @ID, @lang,
        ${columns.map(k => `@${k}`).join(', ')}
      )
    `;
    console.log('Lokalizasyon SQL sorgusu:', { sql });

    const stmt = this.db.prepare(sql);

    const transaction = this.db.transaction((items: ContentItem[]) => {
      for (const item of items) {
        const normalizedItem = this.normalizeContentForDB(item);
        console.log('Lokalize veri eklenecek:', {
          tableName,
          normalizedItem,
          lang,
        });
        stmt.run({
          ...normalizedItem,
          lang,
        });
      }
    });

    transaction(content);
    console.log('Lokalize içerik aktarımı tamamlandı:', { modelId, lang, tableName });
  }

  async importRelations(modelId: string, fieldId: string, relations: { sourceId: string, targetId: string }[]): Promise<void> {
    console.log('İlişki aktarımı başladı:', { modelId, fieldId, relationCount: relations.length });
    const tableName = this.getTableName(modelId, fieldId);

    const sql = `
      INSERT INTO ${tableName} (source_id, target_id)
      VALUES (@source_id, @target_id)
    `;
    console.log('İlişki SQL sorgusu:', { sql });

    const stmt = this.db.prepare(sql);

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
}
