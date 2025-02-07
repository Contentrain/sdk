import type { ContentrainBaseType, ContentrainComponentType, ModelConfig, ModelField } from '../types/model';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ContentrainError, ErrorCode, ValidationError } from '../types/errors';

export class ModelAnalyzer {
  private readonly VALID_FIELD_TYPES = new Set<ContentrainBaseType>([
    'string',
    'number',
    'boolean',
    'array',
    'date',
    'media',
    'relation',
  ]);

  private readonly VALID_COMPONENT_TYPES = new Set<ContentrainComponentType>([
    'single-line-text',
    'multi-line-text',
    'rich-text-editor',
    'markdown-editor',
    'email',
    'url',
    'slug',
    'color',
    'json',
    'integer',
    'decimal',
    'rating',
    'percent',
    'phone-number',
    'checkbox',
    'switch',
    'select',
    'date',
    'date-time',
    'media',
    'one-to-one',
    'one-to-many',
  ]);

  private readonly REQUIRED_SYSTEM_FIELDS = [
    {
      name: 'ID',
      fieldId: 'ID',
      componentId: 'single-line-text',
      fieldType: 'string',
      system: true,
      validations: {
        'required-field': { value: true },
      },
    },
    {
      name: 'createdAt',
      fieldId: 'createdAt',
      componentId: 'date',
      fieldType: 'date',
      system: true,
      validations: {
        'required-field': { value: true },
      },
    },
    {
      name: 'updatedAt',
      fieldId: 'updatedAt',
      componentId: 'date',
      fieldType: 'date',
      system: true,
      validations: {
        'required-field': { value: true },
      },
    },
    {
      name: 'status',
      fieldId: 'status',
      componentId: 'single-line-text',
      fieldType: 'string',
      system: true,
      validations: {
        'required-field': { value: true },
      },
    },
  ] as const;

  /**
   * Analyzes all models
   */
  public async analyzeModels(modelsDir: string): Promise<ModelConfig[]> {
    try {
      const { metadata, modelFields } = await this.readModelFiles(modelsDir);

      // İlk aşama: Temel model yapılarını oluştur
      const models: ModelConfig[] = [];
      for (const meta of metadata) {
        const fields = modelFields[meta.modelId];
        if (!fields) {
          throw new ValidationError({
            code: ErrorCode.MODEL_FIELDS_NOT_FOUND,
            message: 'Model fields not found',
            details: { modelId: meta.modelId },
          });
        }

        // Temel model validasyonları
        this.validateModelMetadata(meta);

        // Alan validasyonları (ilişkiler hariç)
        const normalizedFields = this.validateAndNormalizeFields(fields, meta, false);

        models.push({
          id: meta.modelId,
          name: meta.name,
          type: 'JSON',
          localization: meta.localization || false,
          isServerless: meta.isServerless || false,
          createdBy: meta.createdBy,
          fields: normalizedFields,
        });
      }

      // İkinci aşama: İlişkileri doğrula
      for (const model of models) {
        const relationFields = model.fields.filter(f => f.fieldType === 'relation');
        for (const field of relationFields) {
          this.validateRelationField(field, model, models);
        }
      }

      // Model ilişkilerini doğrula
      this.validateModelRelationships(models);

      return models;
    }
    catch (error) {
      throw new ContentrainError({
        code: ErrorCode.MODEL_ANALYSIS_FAILED,
        message: 'Model analysis failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Reads model files
   */
  private async readModelFiles(modelsDir: string): Promise<{
    metadata: Array<{
      modelId: string
      name: string
      localization: boolean
      isServerless: boolean
      createdBy: string
    }>
    modelFields: Record<string, ModelField[]>
  }> {
    const metadataPath = join(modelsDir, 'metadata.json');

    try {
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);

      if (!Array.isArray(metadata)) {
        throw new ValidationError({
          code: ErrorCode.INVALID_METADATA_FORMAT,
          message: 'Invalid metadata format',
          details: { expected: 'array', received: typeof metadata },
        });
      }

      // Read field files for each model
      const modelFields: Record<string, ModelField[]> = {};
      for (const meta of metadata) {
        const fieldsPath = join(modelsDir, `${meta.modelId}.json`);

        try {
          const fieldsContent = await readFile(fieldsPath, 'utf-8');
          const fields = JSON.parse(fieldsContent);

          if (!Array.isArray(fields)) {
            throw new ValidationError({
              code: ErrorCode.INVALID_FIELDS_FORMAT,
              message: 'Invalid fields format',
              details: { modelId: meta.modelId, expected: 'array', received: typeof fields },
            });
          }

          modelFields[meta.modelId] = fields;
        }
        catch (error) {
          throw new ValidationError({
            code: ErrorCode.MODEL_FIELDS_READ_ERROR,
            message: 'Failed to read model fields',
            details: { modelId: meta.modelId, error: error instanceof Error ? error.message : String(error) },
          });
        }
      }

      return { metadata, modelFields };
    }
    catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError({
        code: ErrorCode.METADATA_READ_ERROR,
        message: 'Failed to read metadata',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  /**
   * Validates model metadata
   */
  private validateModelMetadata(meta: {
    modelId: string
    name: string
    localization: boolean
    isServerless: boolean
    createdBy: string
  }): void {
    if (!meta.modelId || typeof meta.modelId !== 'string') {
      throw new ValidationError({
        code: ErrorCode.INVALID_MODEL,
        message: 'Invalid model ID',
        details: { modelId: meta.modelId },
      });
    }

    if (!meta.name || typeof meta.name !== 'string') {
      throw new ValidationError({
        code: ErrorCode.INVALID_MODEL_ID_FORMAT,
        message: 'Invalid model name',
        details: { modelId: meta.modelId, name: meta.name },
      });
    }

    if (typeof meta.localization !== 'boolean') {
      throw new ValidationError({
        code: ErrorCode.INVALID_LOCALIZATION_FLAG,
        message: 'Invalid localization flag',
        details: { modelId: meta.modelId, localization: meta.localization },
      });
    }
  }

  /**
   * Validates and normalizes model fields
   */
  private validateAndNormalizeFields(
    fields: unknown[],
    meta: { modelId: string, localization: boolean },
    validateRelations = true,
  ): ModelField[] {
    if (!Array.isArray(fields)) {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELDS_TYPE,
        message: 'Invalid fields type',
        details: { modelId: meta.modelId, expected: 'array', received: typeof fields },
      });
    }

    const normalizedFields = new Map<string, ModelField>();

    // Sistem alanlarını ekle
    for (const systemField of this.REQUIRED_SYSTEM_FIELDS) {
      const field = {
        ...systemField,
        modelId: meta.modelId,
        localized: false, // Sistem alanları asla lokalize edilemez
      };
      normalizedFields.set(field.fieldId, field);
    }

    // Özel alanları doğrula ve normalize et
    for (const field of fields) {
      if (!this.isValidField(field)) {
        throw new ValidationError({
          code: ErrorCode.INVALID_FIELD_FORMAT,
          message: 'Invalid field format',
          details: { modelId: meta.modelId, field },
        });
      }

      if (field.fieldType === 'relation' && !validateRelations) {
        // İlişki alanları için özel işlem
        normalizedFields.set(field.fieldId, {
          ...field,
          localized: false, // İlişki alanları asla lokalize edilemez
        });
        continue;
      }

      this.validateFieldType(field);
      this.validateComponentType(field);

      // Lokalizasyon durumunu belirle
      const isLocalized = meta.localization && this.isLocalizableFieldType(field);

      normalizedFields.set(field.fieldId, {
        ...field,
        localized: isLocalized,
      });
    }

    return Array.from(normalizedFields.values());
  }

  private isLocalizableFieldType(field: ModelField): boolean {
    // Sistem alanları lokalize edilemez
    if (field.system) {
      return false;
    }

    // İlişki alanları lokalize edilemez
    if (field.fieldType === 'relation') {
      return false;
    }

    // Diğer tüm alanlar lokalize edilebilir
    return true;
  }

  /**
   * Validates field type
   */
  private validateFieldType(field: ModelField): void {
    if (!this.VALID_FIELD_TYPES.has(field.fieldType)) {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELD_TYPE,
        message: 'Invalid field type',
        details: { fieldId: field.fieldId, type: field.fieldType },
      });
    }
  }

  /**
   * Validates component type
   */
  private validateComponentType(field: ModelField): void {
    if (!this.VALID_COMPONENT_TYPES.has(field.componentId)) {
      throw new ValidationError({
        code: ErrorCode.INVALID_COMPONENT_TYPE,
        message: 'Invalid component type',
        details: { fieldId: field.fieldId, type: field.componentId },
      });
    }
  }

  /**
   * Type guard for ModelField
   */
  private isValidField(field: unknown): field is ModelField {
    if (!field || typeof field !== 'object') {
      return false;
    }

    const f = field as Record<string, unknown>;
    return (
      typeof f.fieldId === 'string'
      && typeof f.name === 'string'
      && typeof f.fieldType === 'string'
      && typeof f.componentId === 'string'
      && typeof f.modelId === 'string'
      && typeof f.options === 'object'
      && f.options !== null
    );
  }

  /**
   * Validates model relationships
   */
  private validateModelRelationships(models: ModelConfig[]): void {
    const relationMap = new Map<string, Set<string>>();

    // Build relation map
    for (const model of models) {
      const relations = new Set<string>();
      for (const field of model.fields) {
        if (field.fieldType === 'relation') {
          const targetModel = field.options?.reference?.form?.reference?.value;
          if (targetModel) {
            relations.add(targetModel);
          }
        }
      }
      relationMap.set(model.id, relations);
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (modelId: string): void => {
      if (visited.has(modelId)) {
        return;
      }

      if (visiting.has(modelId)) {
        throw new ValidationError({
          code: ErrorCode.CIRCULAR_DEPENDENCY,
          message: 'Circular dependency detected',
          details: { modelId },
        });
      }

      visiting.add(modelId);

      const relations = relationMap.get(modelId);
      if (relations) {
        for (const targetModel of relations) {
          visit(targetModel);
        }
      }

      visiting.delete(modelId);
      visited.add(modelId);
    };

    for (const model of models) {
      if (!visited.has(model.id)) {
        visit(model.id);
      }
    }
  }

  /**
   * Validates relation field
   */
  private validateRelationField(field: ModelField, model: ModelConfig, models: ModelConfig[]): void {
    const reference = field.options?.reference;
    if (!reference?.value || !reference.form.reference.value) {
      throw new ValidationError({
        code: ErrorCode.INVALID_RELATION_CONFIG,
        message: 'Invalid relation configuration',
        details: { modelId: model.id, fieldId: field.fieldId },
      });
    }

    const targetModelId = reference.form.reference.value;
    const targetModel = models.find(m => m.id === targetModelId);

    if (!targetModel) {
      throw new ValidationError({
        code: ErrorCode.TARGET_MODEL_NOT_FOUND,
        message: 'Target model not found',
        details: { sourceModel: model.id, targetModel: targetModelId },
      });
    }

    // İlişki alanları her zaman ana tabloda olmalı
    field.localized = false;

    if (reference.form.titleField?.value) {
      const titleField = targetModel.fields.find(
        f => f.fieldId === reference.form.titleField?.value,
      );
      if (!titleField) {
        throw new ValidationError({
          code: ErrorCode.TITLE_FIELD_NOT_FOUND,
          message: 'Title field not found in target model',
          details: {
            sourceModel: model.id,
            targetModel: targetModelId,
            titleField: reference.form.titleField.value,
          },
        });
      }
    }
  }
}
