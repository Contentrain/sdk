import type { ContentItem, RawContentItem, RelationItem, TranslationItem } from '../types/content';
import type { ModelConfig, ModelField } from '../types/model';
import { Buffer } from 'node:buffer';
import { ErrorCode, ValidationError } from '../types/errors';

export class ValidationManager {
  private relationMap: Map<string, Set<string>> = new Map();

  /**
   * Model validasyonlarını gerçekleştirir
   */
  validateModel(model: ModelConfig, allModels?: ModelConfig[]): void {
    if (!model.id?.trim()) {
      throw new ValidationError({
        code: ErrorCode.EMPTY_MODEL_ID,
        message: 'Model ID cannot be empty',
      });
    }

    if (!model.name?.trim()) {
      throw new ValidationError({
        code: ErrorCode.EMPTY_MODEL_NAME,
        message: 'Model name cannot be empty',
      });
    }

    if (!model.fields?.length) {
      throw new ValidationError({
        code: ErrorCode.NO_FIELDS_DEFINED,
        message: 'No fields defined for model',
        details: { modelId: model.id },
      });
    }

    for (const field of model.fields) {
      this.validateField(field, model, allModels);
    }
  }

  /**
   * Alan validasyonlarını gerçekleştirir
   */
  private validateField(field: ModelField, model: ModelConfig, allModels?: ModelConfig[]): void {
    if (!field.fieldId?.trim()) {
      throw new ValidationError({
        code: ErrorCode.EMPTY_FIELD_ID,
        message: 'Field ID cannot be empty',
        details: { modelId: model.id },
      });
    }

    if (!field.name?.trim()) {
      throw new ValidationError({
        code: ErrorCode.EMPTY_FIELD_NAME,
        message: 'Field name cannot be empty',
        details: { modelId: model.id, fieldId: field.fieldId },
      });
    }

    if (!field.fieldType) {
      throw new ValidationError({
        code: ErrorCode.EMPTY_FIELD_TYPE,
        message: 'Field type cannot be empty',
        details: { modelId: model.id, fieldId: field.fieldId },
      });
    }

    if (field.fieldType === 'relation') {
      this.validateRelationField(field, { modelId: model.id, localization: model.localization }, allModels);
    }
  }

  /**
   * İlişki alanı validasyonlarını gerçekleştirir
   */
  public validateRelationField(
    field: ModelField,
    meta: { modelId: string, localization?: boolean },
    models?: ModelConfig[],
  ): void {
    const reference = field.options?.reference;
    if (!reference?.value || !reference.form.reference.value) {
      throw new ValidationError({
        code: ErrorCode.INVALID_RELATION_CONFIG,
        message: 'Invalid relation configuration',
        details: { modelId: meta.modelId, fieldId: field.fieldId },
      });
    }

    if (!['one-to-one', 'one-to-many'].includes(field.componentId)) {
      throw new ValidationError({
        code: ErrorCode.INVALID_RELATION_TYPE,
        message: 'Invalid relation type',
        details: { modelId: meta.modelId, fieldId: field.fieldId, type: field.componentId },
      });
    }

    if (models?.length) {
      const targetModelId = reference.form.reference.value;
      const targetModel = models.find(m => m.id === targetModelId);
      if (!targetModel) {
        throw new ValidationError({
          code: ErrorCode.TARGET_MODEL_NOT_FOUND,
          message: 'Target model not found',
          details: {
            sourceModel: meta.modelId,
            targetModel: targetModelId,
            fieldId: field.fieldId,
          },
        });
      }

      if (reference.form.titleField?.value) {
        const titleField = targetModel.fields.find(
          f => f.fieldId === reference.form.titleField?.value,
        );
        if (!titleField) {
          throw new ValidationError({
            code: ErrorCode.TITLE_FIELD_NOT_FOUND,
            message: 'Title field not found in target model',
            details: {
              sourceModel: meta.modelId,
              targetModel: targetModelId,
              titleField: reference.form.titleField.value,
            },
          });
        }
      }
    }
  }

  /**
   * İçerik validasyonlarını gerçekleştirir
   */
  validateContent(content: RawContentItem, fields: ModelField[]): void {
    this.validateRequiredFields(content);
    this.validateFieldTypes(content, fields);
    this.validateUniqueFields(content, fields);
  }

  /**
   * İçerik öğesinin geçerliliğini kontrol eder
   */
  public isValidContentItem(item: unknown): item is RawContentItem {
    if (!item || typeof item !== 'object') {
      throw new ValidationError({
        code: ErrorCode.INVALID_CONTENT,
        message: 'Content item must be an object',
        details: { item: JSON.stringify(item) },
      });
    }

    const normalizedItem = {
      ID: (item as any).ID || (item as any).id,
      createdAt: (item as any).createdAt || (item as any).created_at,
      updatedAt: (item as any).updatedAt || (item as any).updated_at,
      status: (item as any).status,
    };

    if (!normalizedItem.ID || !normalizedItem.createdAt || !normalizedItem.updatedAt || !normalizedItem.status) {
      throw new ValidationError({
        code: ErrorCode.MISSING_REQUIRED_FIELD,
        message: 'Missing required fields',
        details: { item: normalizedItem },
      });
    }

    if (
      typeof normalizedItem.ID !== 'string'
      || typeof normalizedItem.createdAt !== 'string'
      || typeof normalizedItem.updatedAt !== 'string'
      || !['draft', 'changed', 'publish'].includes(normalizedItem.status)
    ) {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELD_TYPE,
        message: 'Invalid field types',
        details: { item: normalizedItem },
      });
    }

    return true;
  }

  /**
   * JSON içeriğinin geçerliliğini kontrol eder
   */
  public validateJSONContent(content: unknown): void {
    if (!content || typeof content !== 'object') {
      throw new ValidationError({
        code: ErrorCode.INVALID_CONTENT,
        message: 'Invalid content format',
        details: { content: JSON.stringify(content) },
      });
    }

    const contentSize = Buffer.byteLength(JSON.stringify(content));
    if (contentSize > 10485760) { // 10MB
      throw new ValidationError({
        code: ErrorCode.CONTENT_TOO_LARGE,
        message: 'Content too large',
        details: { size: contentSize, maxSize: 10485760 },
      });
    }

    try {
      const seen = new WeakSet();
      const detectCircular = (obj: unknown): void => {
        if (obj && typeof obj === 'object') {
          if (seen.has(obj)) {
            throw new ValidationError({
              code: ErrorCode.CIRCULAR_DEPENDENCY,
              message: 'Circular reference detected',
            });
          }
          seen.add(obj);
          for (const value of Object.values(obj)) {
            detectCircular(value);
          }
        }
      };
      detectCircular(content);
    }
    catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Circular reference check failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Zorunlu alan kontrollerini gerçekleştirir
   */
  public validateRequiredFields(item: RawContentItem): void {
    const requiredFields = ['ID', 'createdAt', 'updatedAt', 'status'];

    for (const field of requiredFields) {
      if (!item[field]) {
        throw new ValidationError({
          code: ErrorCode.MISSING_REQUIRED_FIELD,
          message: `Missing required field: ${field}`,
          details: { field },
        });
      }
    }
  }

  /**
   * Alan tiplerinin kontrolünü gerçekleştirir
   */
  public validateFieldTypes(item: RawContentItem, fields: ModelField[]): void {
    for (const field of fields) {
      const value = item[field.fieldId];
      if (value === undefined)
        continue;

      try {
        switch (field.fieldType) {
          case 'string':
            if (value !== null && typeof value !== 'string') {
              throw new ValidationError({
                code: ErrorCode.INVALID_FIELD_TYPE,
                message: `Invalid field type for ${field.fieldId}`,
                details: { field: field.fieldId, expected: 'string', received: typeof value },
              });
            }
            break;
          case 'number':
            if (value !== null && typeof value !== 'number') {
              throw new ValidationError({
                code: ErrorCode.INVALID_FIELD_TYPE,
                message: `Invalid field type for ${field.fieldId}`,
                details: { field: field.fieldId, expected: 'number', received: typeof value },
              });
            }
            break;
          case 'boolean':
            if (value !== null && typeof value !== 'boolean') {
              throw new ValidationError({
                code: ErrorCode.INVALID_FIELD_TYPE,
                message: `Invalid field type for ${field.fieldId}`,
                details: { field: field.fieldId, expected: 'boolean', received: typeof value },
              });
            }
            break;
          case 'array':
            if (value !== null && !Array.isArray(value)) {
              throw new ValidationError({
                code: ErrorCode.INVALID_FIELD_TYPE,
                message: `Invalid field type for ${field.fieldId}`,
                details: { field: field.fieldId, expected: 'array', received: typeof value },
              });
            }
            break;
          case 'date':
            if (value !== null && !this.isValidDate(value)) {
              throw new ValidationError({
                code: ErrorCode.INVALID_FIELD_TYPE,
                message: `Invalid field type for ${field.fieldId}`,
                details: { field: field.fieldId, expected: 'date', received: typeof value },
              });
            }
            break;
          case 'media':
            if (value !== null && typeof value !== 'string') {
              throw new ValidationError({
                code: ErrorCode.INVALID_FIELD_TYPE,
                message: `Invalid field type for ${field.fieldId}`,
                details: { field: field.fieldId, expected: 'string', received: typeof value },
              });
            }
            break;
          case 'relation':
            if (value !== null && typeof value !== 'string' && !Array.isArray(value)) {
              throw new ValidationError({
                code: ErrorCode.INVALID_FIELD_TYPE,
                message: `Invalid field type for ${field.fieldId}`,
                details: { field: field.fieldId, expected: 'string | string[]', received: typeof value },
              });
            }
            break;
        }
      }
      catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError({
          code: ErrorCode.VALIDATION_FAILED,
          message: `Field validation failed for ${field.fieldId}`,
          details: { field: field.fieldId },
          cause: error instanceof Error ? error : undefined,
        });
      }
    }
  }

  /**
   * Benzersiz alan kontrollerini gerçekleştirir
   */
  private validateUniqueFields(item: RawContentItem, fields: ModelField[]): void {
    const uniqueFields = fields.filter(f => f.validations?.['unique-field']?.value);
    for (const field of uniqueFields) {
      const value = item[field.fieldId];
      if (value === undefined || value === null)
        continue;

      // Benzersizlik kontrolü burada yapılacak
      // Bu kısım veritabanı kontrolü gerektirdiği için şimdilik boş bırakıyoruz
    }
  }

  /**
   * Tarih değerinin geçerliliğini kontrol eder
   */
  private isValidDate(value: unknown): boolean {
    if (typeof value !== 'string')
      return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  /**
   * Çeviri öğesinin geçerliliğini kontrol eder
   */
  public isValidTranslationItem(item: unknown): item is TranslationItem {
    if (!this.isValidContentItem(item)) {
      return false;
    }

    const locale = (item as any).locale;
    if (typeof locale !== 'string' || !locale) {
      return false;
    }

    return true;
  }

  /**
   * İlişki öğesinin geçerliliğini kontrol eder
   */
  public isValidRelationItem(item: unknown): item is RelationItem {
    return (
      typeof item === 'object'
      && item !== null
      && typeof (item as RelationItem).id === 'string'
      && typeof (item as RelationItem).sourceModel === 'string'
      && typeof (item as RelationItem).sourceId === 'string'
      && typeof (item as RelationItem).targetModel === 'string'
      && typeof (item as RelationItem).targetId === 'string'
      && typeof (item as RelationItem).fieldId === 'string'
      && ['one-to-one', 'one-to-many'].includes((item as RelationItem).type)
    );
  }

  /**
   * İlişki haritasını oluşturur
   */
  public buildRelationMap(models: ModelConfig[]): void {
    for (const model of models) {
      const relations = new Set<string>();
      for (const field of model.fields) {
        if (field.fieldType === 'relation' && field.options?.reference?.form.reference.value) {
          relations.add(field.options.reference.form.reference.value);
        }
      }
      if (relations.size > 0) {
        this.relationMap.set(model.id, relations);
      }
    }
  }

  /**
   * İlişki validasyonlarını gerçekleştirir
   */
  validateRelations(relations: RelationItem[], models: ModelConfig[]): void {
    for (const relation of relations) {
      const sourceModel = models.find(m => m.id === relation.sourceModel);
      if (!sourceModel) {
        throw new ValidationError({
          code: ErrorCode.SOURCE_MODEL_NOT_FOUND,
          message: 'Source model not found',
          details: { modelId: relation.sourceModel },
        });
      }

      const targetModel = models.find(m => m.id === relation.targetModel);
      if (!targetModel) {
        throw new ValidationError({
          code: ErrorCode.TARGET_MODEL_NOT_FOUND,
          message: 'Target model not found',
          details: { modelId: relation.targetModel },
        });
      }

      const relationField = sourceModel.fields.find(f => f.fieldId === relation.fieldId);
      if (!relationField || relationField.fieldType !== 'relation') {
        throw new ValidationError({
          code: ErrorCode.INVALID_RELATION_FIELD,
          message: 'Invalid relation field',
          details: { modelId: relation.sourceModel, fieldId: relation.fieldId },
        });
      }

      if (relationField.componentId !== relation.type) {
        throw new ValidationError({
          code: ErrorCode.RELATION_TYPE_MISMATCH,
          message: 'Relation type mismatch',
          details: {
            modelId: relation.sourceModel,
            fieldId: relation.fieldId,
            expected: relationField.componentId,
            received: relation.type,
          },
        });
      }
    }
  }

  /**
   * Çeviri validasyonlarını gerçekleştirir
   */
  validateTranslations(
    items: ContentItem[],
    translations: Record<string, TranslationItem[]>,
  ): void {
    const itemIds = new Set(items.map(item => item.id));
    const requiredFields = ['id', 'locale', 'created_at', 'updated_at', 'status'];

    for (const [locale, translatedItems] of Object.entries(translations)) {
      for (const item of translatedItems) {
        if (!itemIds.has(item.id)) {
          throw new ValidationError({
            code: ErrorCode.TRANSLATION_ID_MISMATCH,
            message: 'Translation ID mismatch',
            details: { locale, id: item.id },
          });
        }

        for (const field of requiredFields) {
          if (!item[field]) {
            throw new ValidationError({
              code: ErrorCode.MISSING_REQUIRED_FIELD_IN_TRANSLATION,
              message: 'Missing required field in translation',
              details: { locale, id: item.id, field },
            });
          }
        }
      }
    }
  }

  /**
   * Dairesel bağımlılık kontrolü yapar
   */
  public validateCircularDependency(
    sourceModel: string,
    targetModel: string,
    visited: Set<string> = new Set(),
  ): boolean {
    if (visited.has(targetModel)) {
      return targetModel === sourceModel;
    }

    visited.add(targetModel);
    const targetRelations = this.relationMap?.get(targetModel);
    if (!targetRelations) {
      return false;
    }

    for (const nextTarget of targetRelations) {
      if (this.validateCircularDependency(sourceModel, nextTarget, new Set(visited))) {
        return true;
      }
    }

    return false;
  }
}
