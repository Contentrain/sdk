import type { ILogger } from '../../types/common';
import type { IBaseJSONRecord, IJSONRelationConfig } from '../../types/json';
import { RelationError } from '../../../errors';
import { JSONContentManager } from './content.manager';

export class JSONRelationManager extends JSONContentManager {
  private readonly relationCache = new Map<string, IJSONRelationConfig[]>();

  constructor(
    contentDir: string,
    logger: ILogger,
    defaultLocale?: string,
  ) {
    super(contentDir, logger, defaultLocale);
    this.logger.debug('Initializing JSONRelationManager', {
      contentDir,
      defaultLocale,
    });
  }

  async loadRelations(modelId: string): Promise<IJSONRelationConfig[]> {
    try {
      // Cache kontrolü
      const cached = this.relationCache.get(modelId);
      if (cached) {
        this.logger.debug('Relations loaded from cache', {
          modelId,
          count: cached.length,
        });
        return cached;
      }

      // Model config yükleme
      const modelConfig = await this.loadModelConfig(modelId);
      const relationFields = modelConfig.fields.filter(field =>
        field.fieldType === 'relation',
      );

      this.logger.debug('Loading relations', {
        modelId,
        relationFieldsCount: relationFields.length,
      });

      // İlişki konfigürasyonlarını oluştur
      const relations = relationFields.map((field) => {
        const options = field.options;
        const reference = options?.reference?.form?.reference?.value;

        if (!reference) {
          this.logger.error('Reference not found for relation field', {
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

        this.logger.debug('Relation config created', {
          modelId,
          fieldName: field.name,
          config,
        });

        return config;
      });

      // Cache'e kaydet
      this.relationCache.set(modelId, relations);

      return relations;
    }
    catch (error: any) {
      this.logger.error('Failed to load relations', {
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
      this.logger.debug('Starting relation resolution', {
        modelId,
        relationField: String(relationField),
        dataLength: data.length,
        locale,
      });

      // İlişkileri yükle
      const relations = await this.loadRelations(modelId);
      this.logger.debug('Relations loaded', { relations });

      // İlgili ilişkiyi bul
      const relation = relations.find(r => r.foreignKey === relationField);
      this.logger.debug('Found relation', { relation });

      if (!relation) {
        this.logger.error('Relation not found', {
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
      this.logger.debug('Loading related model', {
        model: relation.model,
        locale: effectiveLocale,
      });

      const relatedContent = await this.loadModelContent<R>(
        relation.model,
        effectiveLocale,
      );

      this.logger.debug('Related model loaded', {
        model: relation.model,
        contentLength: relatedContent.data.length,
        locale: effectiveLocale,
      });

      // İlişkileri çöz
      if (relation.type === 'one-to-one') {
        this.logger.debug('Processing one-to-one relation');
        const itemsWithRelation = data.filter(item =>
          item[relationField] !== undefined && item[relationField] !== null,
        );
        this.logger.debug('Items with relations', {
          count: itemsWithRelation.length,
        });

        const result = itemsWithRelation.map((item) => {
          const relatedItem = relatedContent.data.find(r =>
            r.ID === item[relationField],
          );
          if (!relatedItem) {
            this.logger.error('Related item not found', {
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
        this.logger.debug('Processing one-to-many relation');
        const uniqueIds = new Set(
          data.flatMap(item =>
            item[relationField] !== undefined && item[relationField] !== null
              ? (Array.isArray(item[relationField])
                  ? item[relationField]
                  : [item[relationField]])
              : [],
          ),
        );

        this.logger.debug('Total unique IDs', {
          total: uniqueIds.size,
          ids: Array.from(uniqueIds),
        });

        const items = Array.from(uniqueIds)
          .map(id => relatedContent.data.find(r => r.ID === id))
          .filter((item): item is R => item !== undefined);

        this.logger.debug('Matching items', {
          count: items.length,
          expectedCount: uniqueIds.size,
        });

        if (items.length !== uniqueIds.size) {
          const foundIds = items.map(item => item.ID);
          const missingIds = Array.from(uniqueIds).filter(id =>
            !foundIds.includes(id),
          );

          this.logger.error('Some related items not found', {
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
      this.logger.error('Failed to resolve relation', {
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
      this.logger.debug('Relation cache cleared');
    }
    catch (error: any) {
      this.logger.error('Failed to clear relation cache', {
        error: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  }
}
