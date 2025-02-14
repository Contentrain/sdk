import type { ILogger } from '../../types/common';
import type { IDBRecord, IDBRelation } from '../../types/sqlite';
import { DatabaseError, RelationError } from '../../../errors';
import { normalizeTableName } from '../../../utils/normalizer';
import { SQLiteContentManager } from './content.manager';
import { SQLiteTranslationManager } from './translation.manager';

export class SQLiteRelationManager extends SQLiteContentManager {
  private readonly translationManager: SQLiteTranslationManager;

  constructor(
    databasePath: string,
    logger: ILogger,
  ) {
    super(databasePath, logger);
    this.logger.debug('Initializing SQLiteRelationManager', {
      databasePath,
      operation: 'initialize',
    });

    try {
      this.translationManager = new SQLiteTranslationManager(databasePath, logger);
      this.logger.info('Relation manager initialized successfully');
    }
    catch (error: any) {
      this.logger.error('Failed to initialize relation manager', {
        databasePath,
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to initialize relation manager',
        'initialize',
        {
          databasePath,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async loadRelations(
    model: string,
    sourceIds: string[],
    fieldId: string,
  ): Promise<IDBRelation[]> {
    if (!sourceIds.length)
      return [];

    this.logger.debug('Loading relations', {
      model,
      fieldId,
      sourceIdsCount: sourceIds.length,
      operation: 'read',
    });

    try {
      const hasSourceTranslations = await this.translationManager.hasTranslations(model);
      const query = `
        SELECT * FROM tbl_contentrain_relations
        WHERE source_model = ?
        AND source_id IN (${sourceIds.map(() => '?').join(',')})
        AND field_id = ?
      `;

      const relations = await this.connection.query<IDBRelation>(
        query,
        [model, ...sourceIds, fieldId],
      );

      if (relations.length === 0) {
        throw new RelationError(
          `No relations found for field: ${fieldId}`,
          'read',
          {
            model,
            fieldId,
            sourceIds,
          },
        );
      }

      if (relations.length > 0) {
        const targetModel = relations[0]?.target_model;
        const hasTargetTranslations = targetModel
          ? await this.translationManager.hasTranslations(targetModel)
          : false;

        this.logger.debug('Relations loaded', {
          count: relations.length,
          firstRelation: relations[0],
          model,
          fieldId,
          relationType: relations[0]?.type,
          targetModel,
          hasSourceTranslations,
          hasTargetTranslations,
          operation: 'read',
        });
      }

      return relations;
    }
    catch (error: any) {
      if (error instanceof RelationError) {
        throw error;
      }

      this.logger.error('Failed to load relations', {
        model,
        sourceIds,
        fieldId,
        error: error?.message,
        code: error?.code,
      });

      throw new RelationError(
        'Failed to load relations',
        'read',
        {
          model,
          sourceIds,
          fieldId,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async loadRelatedContent<T extends IDBRecord>(
    relations: IDBRelation[],
    locale?: string,
  ): Promise<T[]> {
    if (!relations.length)
      return [];

    this.logger.debug('Loading related content', {
      relationsCount: relations.length,
      locale,
      operation: 'read',
    });

    try {
      const targetModel = relations[0].target_model;
      const targetIds = relations.map(r => r.target_id);
      const targetTable = normalizeTableName(targetModel);
      const hasTargetTranslations = await this.translationManager.hasTranslations(targetModel);

      const query = `
        SELECT * FROM ${targetTable}
        WHERE id IN (${targetIds.map(() => '?').join(',')})
      `;

      const data = await this.connection.query<T>(query, targetIds);

      if (locale && hasTargetTranslations) {
        const translations = await this.translationManager.loadTranslations(
          targetModel,
          targetIds,
          locale,
        );

        const mergedData = data.map((item: T) => ({
          ...item,
          ...translations[item.id],
        }));

        this.logger.debug('Content merged with translations', {
          originalCount: data.length,
          mergedCount: mergedData.length,
          hasTranslations: Object.keys(translations).length > 0,
          operation: 'read',
        });

        return mergedData;
      }

      return data;
    }
    catch (error: any) {
      this.logger.error('Failed to load related content', {
        relations,
        locale,
        error: error?.message,
        code: error?.code,
      });

      throw new RelationError(
        'Failed to load related content',
        'read',
        {
          relations,
          locale,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async getRelationTypes(model: string): Promise<Record<string, 'one-to-one' | 'one-to-many'>> {
    try {
      const query = `
        SELECT DISTINCT field_id, type
        FROM tbl_contentrain_relations
        WHERE source_model = ?
      `;

      const hasTranslations = await this.translationManager.hasTranslations(model);

      this.logger.debug('Getting relation types', {
        model,
        query,
        hasTranslations,
        operation: 'read',
      });

      const results = await this.connection.query<{
        field_id: string
        type: 'one-to-one' | 'one-to-many'
      }>(query, [model]);

      const relationDetails = await Promise.all(results.map(async ({ field_id, type }) => {
        const targetModelQuery = `
          SELECT DISTINCT target_model
          FROM tbl_contentrain_relations
          WHERE source_model = ?
          AND field_id = ?
        `;
        const targetResults = await this.connection.query<{ target_model: string }>(
          targetModelQuery,
          [model, field_id],
        );
        const targetResult = targetResults[0];

        const targetModel = targetResult?.target_model;
        const hasTargetTranslations = targetModel
          ? await this.translationManager.hasTranslations(targetModel)
          : false;

        return {
          field_id,
          type,
          targetModel,
          hasTargetTranslations,
        };
      }));

      this.logger.debug('Relation types loaded', {
        model,
        hasTranslations,
        relations: relationDetails,
        operation: 'read',
      });

      return results.reduce((acc: Record<string, 'one-to-one' | 'one-to-many'>, { field_id, type }) => {
        acc[field_id] = type;
        return acc;
      }, {});
    }
    catch (error: any) {
      this.logger.error('Failed to get relation types', {
        model,
        error: error?.message,
        code: error?.code,
      });

      throw new RelationError(
        'Failed to get relation types',
        'read',
        {
          model,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async getRelationFields(model: string): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT field_id
        FROM tbl_contentrain_relations
        WHERE source_model = ?
      `;

      const results = await this.connection.query<{ field_id: string }>(query, [model]);
      return results.map(r => r.field_id);
    }
    catch (error: any) {
      this.logger.error('Failed to get relation fields', {
        model,
        error: error?.message,
        code: error?.code,
      });

      throw new RelationError(
        'Failed to get relation fields',
        'read',
        {
          model,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }
}
