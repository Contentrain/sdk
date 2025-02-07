import type { DBRecord, DBRelation } from '../types/database';
import { logger } from '../utils/logger';
import { BaseSQLiteLoader } from './base-sqlite';
import { TranslationLoader } from './translation-loader';

export class RelationLoader extends BaseSQLiteLoader {
  private translationLoader: TranslationLoader;

  constructor(databasePath: string) {
    super(databasePath);
    this.translationLoader = new TranslationLoader(databasePath);
  }

  async loadRelations(
    model: string,
    sourceIds: string[],
    fieldId: string,
  ): Promise<DBRelation[]> {
    try {
      if (!sourceIds.length)
        return [];

      // İlişkileri yükle
      const query = `
        SELECT * FROM tbl_contentrain_relations
        WHERE source_model = ?
        AND source_id IN (${sourceIds.map(() => '?').join(',')})
        AND field_id = ?
      `;

      return await this.connection.query<DBRelation>(
        query,
        [model, ...sourceIds, fieldId],
      );
    }
    catch (error) {
      logger.error('Load relations error:', { model, sourceIds, fieldId, error });
      throw error;
    }
  }

  async loadRelatedContent<T extends DBRecord>(
    relations: DBRelation[],
    locale?: string,
  ): Promise<T[]> {
    try {
      if (!relations.length)
        return [];

      const targetModel = relations[0].target_model;
      const targetIds = relations.map(r => r.target_id);

      // Ana içeriği yükle
      const query = `
        SELECT * FROM tbl_${targetModel}
        WHERE id IN (${targetIds.map(() => '?').join(',')})
      `;
      const data = await this.connection.query<T>(query, targetIds);

      // Çevirisi varsa yükle
      if (locale) {
        const hasTranslations = await this.translationLoader.hasTranslations(targetModel);
        if (hasTranslations) {
          const translations = await this.translationLoader.loadTranslations(
            targetModel,
            targetIds,
            locale,
          );

          // Çevirileri ana veriye ekle
          return data.map(item => ({
            ...item,
            ...translations[item.id],
          }));
        }
      }

      return data;
    }
    catch (error) {
      logger.error('Load related content error:', { relations, locale, error });
      throw error;
    }
  }

  async getRelationTypes(model: string): Promise<Record<string, 'one-to-one' | 'one-to-many'>> {
    try {
      const query = `
        SELECT DISTINCT field_id, type
        FROM tbl_contentrain_relations
        WHERE source_model = ?
      `;

      const results = await this.connection.query<{ field_id: string, type: 'one-to-one' | 'one-to-many' }>(
        query,
        [model],
      );

      return results.reduce((acc, { field_id, type }) => {
        acc[field_id] = type;
        return acc;
      }, {} as Record<string, 'one-to-one' | 'one-to-many'>);
    }
    catch (error) {
      logger.error('Get relation types error:', { model, error });
      return {};
    }
  }
}
