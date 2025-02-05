import type { ContentrainBaseType, ContentrainComponentType, ModelConfig, ModelField } from '../types/model';
import { existsSync } from 'node:fs';
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

        // Validate model metadata
        this.validateModelMetadata(meta);

        // Validate and normalize fields
        const normalizedFields = this.validateAndNormalizeFields(fields, meta);

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

      // Validate model relationships
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
  private validateAndNormalizeFields(fields: unknown[], meta: {
    modelId: string
    localization: boolean
  }): ModelField[] {
    if (!Array.isArray(fields)) {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELDS_TYPE,
        message: 'Invalid fields type',
        details: { modelId: meta.modelId, expected: 'array', received: typeof fields },
      });
    }

    // Check system fields
    const systemFields = fields.filter(f => (f as ModelField).system);
    for (const requiredField of this.REQUIRED_SYSTEM_FIELDS) {
      const field = systemFields.find(f => (f as ModelField).fieldId === requiredField.fieldId);
      if (!field) {
        throw new ValidationError({
          code: ErrorCode.MISSING_SYSTEM_FIELD,
          message: 'Missing system field',
          details: { modelId: meta.modelId, fieldId: requiredField.fieldId },
        });
      }

      if (!this.isValidSystemField(field as ModelField, requiredField)) {
        throw new ValidationError({
          code: ErrorCode.INVALID_SYSTEM_FIELD,
          message: 'Invalid system field',
          details: { modelId: meta.modelId, fieldId: requiredField.fieldId },
        });
      }
    }

    // Validate and normalize custom fields
    const customFields = fields.filter(f => !(f as ModelField).system);
    const normalizedFields = customFields.map(field => this.validateAndNormalizeField(field as ModelField, meta));

    return [...systemFields, ...normalizedFields] as ModelField[];
  }

  /**
   * Validates system field configuration
   */
  private isValidSystemField(field: ModelField, required: typeof this.REQUIRED_SYSTEM_FIELDS[number]): boolean {
    return (
      field.fieldId === required.fieldId
      && field.fieldType === required.fieldType
      && field.componentId === required.componentId
      && field.system === true
      && field.validations?.['required-field']?.value === true
    );
  }

  /**
   * Validates and normalizes field configuration
   */
  private validateAndNormalizeField(field: ModelField, meta: {
    modelId: string
    localization: boolean
  }): ModelField {
    // Zorunlu alan kontrolleri
    if (!field.name || typeof field.name !== 'string') {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELD_NAME_FORMAT,
        message: 'Invalid field name',
        details: { modelId: meta.modelId, fieldId: field.fieldId },
      });
    }

    if (!field.fieldId || typeof field.fieldId !== 'string') {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELD,
        message: 'Invalid field ID',
        details: { modelId: meta.modelId, fieldId: field.fieldId },
      });
    }

    // Alan tipi kontrolü
    if (!this.VALID_FIELD_TYPES.has(field.fieldType)) {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELD_TYPE,
        message: 'Invalid field type',
        details: { modelId: meta.modelId, fieldId: field.fieldId, type: field.fieldType },
      });
    }

    // Komponent tipi kontrolü
    if (!this.VALID_COMPONENT_TYPES.has(field.componentId)) {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELDS_TYPE,
        message: 'Invalid component type',
        details: { modelId: meta.modelId, fieldId: field.fieldId, type: field.componentId },
      });
    }

    // Alan tipi ve komponent tipi uyumluluğu kontrolü
    if (!this.isValidTypeComponentCombination(field.fieldType, field.componentId)) {
      throw new ValidationError({
        code: ErrorCode.INVALID_FIELDS_FORMAT,
        message: 'Invalid type component combination',
        details: { modelId: meta.modelId, fieldId: field.fieldId, fieldType: field.fieldType, componentId: field.componentId },
      });
    }

    // İlişki alanları için validasyon
    if (field.fieldType === 'relation') {
      this.validateRelationField(field, meta);
    }

    // Sistem alanları lokalize edilemez
    const isSystemField = field.system || this.isSystemFieldId(field.fieldId);

    // İlişki alanları lokalize edilemez
    const isRelationField = field.fieldType === 'relation';

    // Lokalizasyon kontrolü
    const shouldBeLocalized = meta.localization
      && !isSystemField
      && !isRelationField
      && this.isLocalizableFieldType(field.fieldType, field.componentId);

    // Normalize edilmiş alanı döndür
    return {
      ...field,
      system: field.system || isSystemField,
      localized: shouldBeLocalized,
      defaultField: field.defaultField || false,
    };
  }

  private isSystemFieldId(fieldId: string): boolean {
    return ['ID', 'createdAt', 'updatedAt', 'status', 'order'].includes(fieldId);
  }

  private isLocalizableFieldType(fieldType: ContentrainBaseType, componentId: ContentrainComponentType): boolean {
    // Lokalize edilebilecek alan tipleri
    const localizableTypes = new Set<ContentrainBaseType>([
      'string',
      'array',
      'media',
    ]);

    // Lokalize edilebilecek komponentler
    const localizableComponents = new Set<ContentrainComponentType>([
      'single-line-text',
      'multi-line-text',
      'rich-text-editor',
      'markdown-editor',
      'select',
      'media',
    ]);

    return localizableTypes.has(fieldType) && localizableComponents.has(componentId);
  }

  /**
   * Validates field type and component type compatibility
   */
  private isValidTypeComponentCombination(fieldType: ContentrainBaseType, componentId: ContentrainComponentType): boolean {
    switch (fieldType) {
      case 'string':
        return [
          'single-line-text',
          'multi-line-text',
          'rich-text-editor',
          'markdown-editor',
          'email',
          'url',
          'slug',
          'color',
          'json',
          'phone-number',
        ].includes(componentId);
      case 'number':
        return [
          'integer',
          'decimal',
          'rating',
          'percent',
        ].includes(componentId);
      case 'boolean':
        return [
          'checkbox',
          'switch',
        ].includes(componentId);
      case 'array':
        return [
          'select',
          'json',
        ].includes(componentId);
      case 'date':
        return [
          'date',
          'date-time',
        ].includes(componentId);
      case 'media':
        return componentId === 'media';
      case 'relation':
        return [
          'one-to-one',
          'one-to-many',
        ].includes(componentId);
      default:
        return false;
    }
  }

  /**
   * Validates relation field configuration
   */
  private validateRelationField(field: ModelField, meta: {
    modelId: string
    localization: boolean
  }): void {
    const reference = field.options?.reference;
    if (!reference?.value || !reference.form.reference.value) {
      throw new ValidationError({
        code: ErrorCode.INVALID_RELATION_CONFIG,
        message: 'Invalid relation config',
        details: { modelId: meta.modelId, fieldId: field.fieldId },
      });
    }

    if (reference.form.titleField?.value) {
      if (typeof reference.form.titleField.value !== 'string') {
        throw new ValidationError({
          code: ErrorCode.INVALID_FIELD,
          message: 'Invalid title field',
          details: { modelId: meta.modelId, fieldId: field.fieldId },
        });
      }
    }
  }

  /**
   * Validates relationships between models
   */
  private validateModelRelationships(models: ModelConfig[]): void {
    const relationFields = new Map<string, Set<string>>();

    // Build relation map
    for (const model of models) {
      const relations = new Set<string>();
      for (const field of model.fields) {
        if (field.fieldType === 'relation') {
          const targetModel = field.options?.reference?.form.reference.value;
          if (targetModel) {
            relations.add(targetModel);
          }
        }
      }
      if (relations.size > 0) {
        relationFields.set(model.id, relations);
      }
    }

    // Validate relations
    for (const [modelId, relations] of relationFields) {
      for (const targetModel of relations) {
        // Check target model exists
        if (!models.find(m => m.id === targetModel)) {
          throw new ValidationError({
            code: ErrorCode.TARGET_MODEL_NOT_FOUND,
            message: 'Relation target not found',
            details: { sourceModel: modelId, targetModel },
          });
        }

        // Check for circular dependencies
        if (this.hasCircularDependency(modelId, targetModel, relationFields, new Set())) {
          throw new ValidationError({
            code: ErrorCode.CIRCULAR_DEPENDENCY,
            message: 'Circular relation detected',
            details: { sourceModel: modelId, targetModel },
          });
        }
      }
    }
  }

  /**
   * Checks for circular dependencies in model relationships
   */
  private hasCircularDependency(
    sourceModel: string,
    targetModel: string,
    relationMap: Map<string, Set<string>>,
    visited: Set<string>,
  ): boolean {
    if (visited.has(targetModel)) {
      return targetModel === sourceModel;
    }

    visited.add(targetModel);
    const targetRelations = relationMap.get(targetModel);
    if (!targetRelations) {
      return false;
    }

    for (const nextTarget of targetRelations) {
      if (this.hasCircularDependency(sourceModel, nextTarget, relationMap, new Set(visited))) {
        return true;
      }
    }

    return false;
  }
}
