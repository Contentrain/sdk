import type { IBaseJSONRecord, IJSONRelationConfig } from '../../types/json';
import { RelationError } from '../../../errors';
import { loggers } from '../../../utils/logger';
import { JSONContentManager } from './content.manager';

const logger = loggers.loader;

export class JSONRelationManager extends JSONContentManager {
  private readonly relationCache = new Map<string, IJSONRelationConfig[]>();

  constructor(
    contentDir: string,
    defaultLocale?: string,
  ) {
    super(contentDir, defaultLocale);
  }

  async loadRelations(modelId: string): Promise<IJSONRelationConfig[]> {
    try {
      // Cache kontrolü
      const cached = this.relationCache.get(modelId);
      if (cached) {
        return cached;
      }

      // Model config yükleme
      const modelConfig = await this.loadModelConfig(modelId);
      const relationFields = modelConfig.fields.filter(field =>
        field.fieldType === 'relation',
      );
      // İlişki konfigürasyonlarını oluştur
      const relations = relationFields.map((field) => {
        const options = field.options;
        const reference = options?.reference?.form?.reference?.value;

        if (!reference) {
          logger.error('Reference not found for relation field', {
            modelId,
            fieldName: field.name,
            fieldId: field.fieldId,
            options,
          });
          throw new RelationError(
            `Reference not found for relation field: ${field.name}`,
            'load',
            {
              modelId,
              fieldName: field.name,
              fieldId: field.fieldId,
            },
          );
        }

        const config: IJSONRelationConfig = {
          model: reference,
          type: field.componentId === 'one-to-one' ? 'one-to-one' : 'one-to-many',
          foreignKey: field.fieldId,
        };
        return config;
      });

      // Cache'e kaydet
      this.relationCache.set(modelId, relations);

      return relations;
    }
    catch (error: any) {
      logger.error('Failed to load relations', {
        modelId,
        error: error?.message,
        stack: error?.stack,
      });

      throw new RelationError(
        'Failed to load relations',
        'load',
        {
          modelId,
          originalError: error?.message,
        },
      );
    }
  }

  async resolveRelation<T extends IBaseJSONRecord, R extends IBaseJSONRecord>(
    modelId: string,
    relationField: keyof T,
    data: T[],
    locale?: string,
  ): Promise<R[]> {
    try {
      // İlişkileri yükle
      const relations = await this.loadRelations(modelId);
      // İlgili ilişkiyi bul
      const relation = relations.find(r => r.foreignKey === relationField);
      if (!relation) {
        logger.error('Relation not found', {
          modelId,
          relationField: String(relationField),
          availableFields: relations.map(r => r.foreignKey),
        });
        throw new RelationError(
          `No relation found for field: ${String(relationField)}`,
          'resolve',
          {
            modelId,
            relationField: String(relationField),
          },
        );
      }

      // İlişkili içeriği yükle
      const effectiveLocale = locale || this.defaultLocale || 'default';
      const relatedContent = await this.loadModelContent<R>(
        relation.model,
        effectiveLocale,
      );
      // İlişkileri çöz
      if (relation.type === 'one-to-one') {
        const itemsWithRelation = data.filter(item =>
          item[relationField] !== undefined && item[relationField] !== null,
        );
        const result = itemsWithRelation.map((item) => {
          const relatedItem = relatedContent.data.find(r =>
            r.ID === item[relationField],
          );
          if (!relatedItem) {
            logger.error('Related item not found', {
              modelId,
              relationField: String(relationField),
              sourceId: item.ID,
              targetId: item[relationField],
            });
            throw new RelationError(
              `Failed to resolve relation: No matching item found for ID ${String(item[relationField])}`,
              'resolve',
              {
                modelId,
                relationField: String(relationField),
                sourceId: item.ID,
                targetId: item[relationField],
              },
            );
          }
          return relatedItem;
        });

        return result;
      }
      else {
        const uniqueIds = new Set(
          data.flatMap(item =>
            item[relationField] !== undefined && item[relationField] !== null
              ? (Array.isArray(item[relationField])
                  ? item[relationField]
                  : [item[relationField]])
              : [],
          ),
        );
        const items = Array.from(uniqueIds)
          .map(id => relatedContent.data.find(r => r.ID === id))
          .filter((item): item is R => item !== undefined);
        if (items.length !== uniqueIds.size) {
          const foundIds = items.map(item => item.ID);
          const missingIds = Array.from(uniqueIds).filter(id =>
            !foundIds.includes(id),
          );

          logger.error('Some related items not found', {
            modelId,
            relationField: String(relationField),
            missingIds,
            totalExpected: uniqueIds.size,
            totalFound: items.length,
          });
          throw new RelationError(
            'Failed to resolve relation: Some related items not found',
            'resolve',
            {
              modelId,
              relationField: String(relationField),
              missingIds,
            },
          );
        }

        return items;
      }
    }
    catch (error: any) {
      logger.error('Failed to resolve relation', {
        modelId,
        relationField: String(relationField),
        error: error?.message,
        stack: error?.stack,
      });

      throw new RelationError(
        'Failed to resolve relation',
        'resolve',
        {
          modelId,
          relationField: String(relationField),
          originalError: error?.message,
        },
      );
    }
  }

  async clearCache(): Promise<void> {
    try {
      this.relationCache.clear();
      await super.clearCache();
    }
    catch (error: any) {
      logger.error('Failed to clear relation cache', {
        error: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  }
}
