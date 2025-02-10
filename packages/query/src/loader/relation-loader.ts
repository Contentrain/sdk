import type { DBRecord, DBRelation } from '../types/database';
import { loggers } from '../utils/logger';
import { normalizeTableName } from '../utils/normalizer';
import { BaseSQLiteLoader } from './base-sqlite';
import { TranslationLoader } from './translation-loader';

const logger = loggers.relation;

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

      // Model çeviri durumunu kontrol et
      const hasSourceTranslations = await this.translationLoader.hasTranslations(model);
      logger.debug('Source model translation check:', {
        model,
        hasTranslations: hasSourceTranslations,
      });

      logger.debug('Loading relations with params:', {
        model,
        fieldId,
        sourceIdsCount: sourceIds.length,
        hasSourceTranslations,
      });

      // İlişkileri yükle
      const query = `
        SELECT * FROM tbl_contentrain_relations
        WHERE source_model = ?
        AND source_id IN (${sourceIds.map(() => '?').join(',')})
        AND field_id = ?
      `;

      logger.debug('Loading relations query:', { query, model, fieldId });
      const relations = await this.connection.query<DBRelation>(
        query,
        [model, ...sourceIds, fieldId],
      );

      // Hedef modelin çeviri durumunu kontrol et
      const targetModel = relations[0]?.target_model;
      const hasTargetTranslations = targetModel
        ? await this.translationLoader.hasTranslations(targetModel)
        : false;

      logger.debug('Relations loaded:', {
        count: relations.length,
        firstRelation: relations[0],
        model,
        fieldId,
        relationType: relations[0]?.type,
        targetModel,
        hasTargetTranslations,
      });

      return relations;
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
      const targetTable = normalizeTableName(targetModel);
      const relationType = relations[0].type;

      // Kaynak ve hedef modellerin çeviri durumunu kontrol et
      const sourceModel = relations[0].source_model;
      const hasSourceTranslations = await this.translationLoader.hasTranslations(sourceModel);
      const hasTargetTranslations = await this.translationLoader.hasTranslations(targetModel);

      logger.debug('Loading related content:', {
        sourceModel,
        targetModel,
        targetTable,
        targetIdsCount: targetIds.length,
        locale,
        relationType,
        hasSourceTranslations,
        hasTargetTranslations,
        firstRelation: relations[0],
      });

      // Ana içeriği yükle
      const query = `
        SELECT * FROM ${targetTable}
        WHERE id IN (${targetIds.map(() => '?').join(',')})
      `;

      logger.debug('Related content query:', { query, targetIds });
      const data = await this.connection.query<T>(query, targetIds);
      logger.debug('Base content loaded:', {
        count: data.length,
        firstItem: data[0],
        targetModel,
        targetTable,
      });

      // Çeviri durumuna göre işlem yap
      if (locale && hasTargetTranslations) {
        logger.debug('Loading translations for target model:', {
          targetModel,
          locale,
          hasTargetTranslations,
        });

        const translations = await this.translationLoader.loadTranslations(
          targetModel,
          targetIds,
          locale,
        );

        logger.debug('Translations loaded:', {
          count: Object.keys(translations).length,
          firstTranslation: Object.values(translations)[0],
          targetModel,
          locale,
        });

        // Çevirileri ana veriye ekle
        const mergedData = data.map(item => ({
          ...item,
          ...translations[item.id],
        }));

        logger.debug('Content merged with translations:', {
          originalCount: data.length,
          mergedCount: mergedData.length,
          hasTranslations: Object.keys(translations).length > 0,
        });

        return mergedData;
      }

      return data;
    }
    catch (error) {
      logger.error('Load related content error:', {
        relations,
        locale,
        error,
        sourceModel: relations[0]?.source_model,
        targetModel: relations[0]?.target_model,
      });
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

      // Model çeviri durumunu kontrol et
      const hasTranslations = await this.translationLoader.hasTranslations(model);

      logger.debug('Getting relation types:', {
        model,
        query,
        hasTranslations,
      });

      const results = await this.connection.query<{
        field_id: string
        type: 'one-to-one' | 'one-to-many'
      }>(query, [model]);

      // Her ilişki için hedef modelin çeviri durumunu kontrol et
      const relationDetails = await Promise.all(
        results.map(async ({ field_id, type }) => {
          const targetModelQuery = `
            SELECT DISTINCT target_model
            FROM tbl_contentrain_relations
            WHERE source_model = ?
            AND field_id = ?
          `;
          const [targetResult] = await this.connection.query<{ target_model: string }>(
            targetModelQuery,
            [model, field_id],
          );

          const targetModel = targetResult?.target_model;
          const hasTargetTranslations = targetModel
            ? await this.translationLoader.hasTranslations(targetModel)
            : false;

          return {
            field_id,
            type,
            targetModel,
            hasTargetTranslations,
          };
        }),
      );

      logger.debug('Relation types loaded:', {
        model,
        hasTranslations,
        relations: relationDetails,
      });

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
