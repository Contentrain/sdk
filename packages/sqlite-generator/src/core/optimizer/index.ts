import type { Database } from 'better-sqlite3';
import type { ModelField } from '../../types';
import { normalizeName, normalizeTableName } from '../../utils/sql';

export class IndexOptimizer {
  constructor(private readonly db: Database) {}

  createIndexes(modelId: string, fields: ModelField[]): void {
    const normalizedModelId = normalizeTableName(modelId);

    // Temel indeksler
    const basicIndexSQL = `CREATE INDEX IF NOT EXISTS idx_${normalizedModelId}_status ON ${normalizedModelId} (status);`;
    this.db.exec(basicIndexSQL);

    // Benzersiz indeksler
    for (const field of fields) {
      if (field.validations['unique-field']?.value) {
        const normalizedFieldId = normalizeName(field.fieldId);
        const uniqueIndexSQL = `CREATE UNIQUE INDEX IF NOT EXISTS idx_${normalizedModelId}_${normalizedFieldId} ON ${normalizedModelId} (${normalizedFieldId});`;
        this.db.exec(uniqueIndexSQL);
      }
    }

    // İlişki indeksleri
    for (const field of fields) {
      if (field.fieldType === 'relation') {
        const normalizedFieldId = normalizeName(field.fieldId);
        const relationTableName = `${normalizedModelId}_${normalizedFieldId}`;
        const relationIndexSQL = `CREATE INDEX IF NOT EXISTS idx_${relationTableName} ON ${relationTableName} (source_id, target_id);`;
        this.db.exec(relationIndexSQL);
      }
    }
  }

  createLocalizationIndexes(modelId: string): void {
    const normalizedModelId = normalizeTableName(modelId);
    const i18nIndexSQL = `CREATE INDEX IF NOT EXISTS idx_${normalizedModelId}_i18n_lang ON ${normalizedModelId}_i18n (lang);`;
    this.db.exec(i18nIndexSQL);
  }
}
