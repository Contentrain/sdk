import type {
  BaseContentrainType,
  ContentrainTypes,
  ModelSchema,
  ModelSchemaField,
  ValidationOptions,
  ValidationResult,
} from '../types/query';
import { ContentrainValidationError } from '../core/errors';
import { QueryDebugger } from './debug';

export class QueryValidator {
  private static instance: QueryValidator;
  private debugger: QueryDebugger;
  private schemas: Map<string, ModelSchema> = new Map();

  private constructor() {
    this.debugger = QueryDebugger.getInstance();
  }

  static getInstance(): QueryValidator {
    if (!QueryValidator.instance) {
      QueryValidator.instance = new QueryValidator();
    }
    return QueryValidator.instance;
  }

  // Schema kayıt metodu
  registerSchema(modelId: string, schema: ModelSchema): void {
    this.schemas.set(modelId, schema);
  }

  // Format validasyonu
  private validateFormat(value: any, format: string): boolean {
    const formats: { [key: string]: RegExp } = {
      email: /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/,
      url: /^https?:\/\/.*$/,
      date: /^\d{4}-\d{2}-\d{2}$/,
      datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    };

    return format in formats ? formats[format].test(value) : true;
  }

  // Tip validasyonu
  private validateType(value: any, type: ModelSchemaField['type']): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !Number.isNaN(Date.parse(value)));
      default:
        return false;
    }
  }

  // Model validasyonu
  validateModel<
    T extends BaseContentrainType,
    Types extends ContentrainTypes,
    K extends keyof Types['models'],
  >(
    modelId: K,
    data: T[],
    options: ValidationOptions = {},
  ): ValidationResult {
    this.debugger.debug('Validating model', { modelId, dataLength: data.length, options });

    const result: ValidationResult = {
      valid: true,
      errors: [],
    };

    if (!data || !Array.isArray(data)) {
      result.valid = false;
      result.errors.push({
        field: 'data',
        message: 'Data must be an array',
      });
      return result;
    }

    const schema = this.schemas.get(String(modelId));

    data.forEach((item, index) => {
      // Base type validation
      if (!this.isValidContentrainType(item)) {
        result.valid = false;
        result.errors.push({
          field: `[${index}]`,
          message: 'Item does not match BaseContentrainType',
        });
        return;
      }

      // Schema validation
      if (schema && options.validateSchema) {
        Object.entries(schema.fields).forEach(([field, rules]) => {
          const value = item[field as keyof T];

          // Required check
          if (rules.required && (value === undefined || value === null)) {
            result.valid = false;
            result.errors.push({
              field: `[${index}].${field}`,
              message: rules.message || `Field "${field}" is required`,
            });
            return;
          }

          if (value !== undefined && value !== null) {
            // Type check
            if (!this.validateType(value, rules.type)) {
              result.valid = false;
              result.errors.push({
                field: `[${index}].${field}`,
                message: rules.message || `Invalid type for field "${field}"`,
              });
              return;
            }

            // Format check
            if (rules.format && !this.validateFormat(value, rules.format)) {
              result.valid = false;
              result.errors.push({
                field: `[${index}].${field}`,
                message: rules.message || `Invalid format for field "${field}"`,
              });
              return;
            }

            // Custom validation
            if (rules.validate && !rules.validate(value)) {
              result.valid = false;
              result.errors.push({
                field: `[${index}].${field}`,
                message: rules.message || `Validation failed for field "${field}"`,
              });
            }
          }
        });
      }
    });

    if (!result.valid && options.strict) {
      throw new ContentrainValidationError(
        'model',
        `Validation failed: ${result.errors.map(e => e.message).join(', ')}`,
      );
    }

    return result;
  }

  // İlişki validasyonu
  validateRelation<
    Types extends ContentrainTypes,
    R extends keyof Types['relations'],
  >(
    relation: R,
    sourceModel: keyof Types['models'],
    targetModel: keyof Types['models'],
    options: ValidationOptions = {},
  ): ValidationResult {
    this.debugger.debug('Validating relation', {
      relation,
      sourceModel,
      targetModel,
      options,
    });

    const result: ValidationResult = {
      valid: true,
      errors: [],
    };

    if (options.validateRelations) {
      const sourceSchema = this.schemas.get(String(sourceModel));
      const targetSchema = this.schemas.get(String(targetModel));

      if (!sourceSchema || !targetSchema) {
        result.valid = false;
        result.errors.push({
          field: 'schema',
          message: 'Schema not found for one or both models',
        });
        return result;
      }

      const relationConfig = sourceSchema.relations?.[String(relation)];

      if (!relationConfig) {
        result.valid = false;
        result.errors.push({
          field: String(relation),
          message: `Relation "${String(relation)}" is not defined in source model`,
        });
        return result;
      }

      if (relationConfig.model !== String(targetModel)) {
        result.valid = false;
        result.errors.push({
          field: String(relation),
          message: `Invalid target model for relation "${String(relation)}"`,
        });
      }

      // Foreign key kontrolü
      const foreignKey = relationConfig.foreignKey;
      if (!sourceSchema.fields[foreignKey]) {
        result.valid = false;
        result.errors.push({
          field: foreignKey,
          message: `Foreign key "${foreignKey}" not found in source model`,
        });
      }
    }

    if (!result.valid && options.strict) {
      throw new ContentrainValidationError(
        'relation',
        `Relation validation failed: ${result.errors.map(e => e.message).join(', ')}`,
      );
    }

    return result;
  }

  validateFields<T extends BaseContentrainType>(
    model: T,
    fields: string[],
    options: ValidationOptions = {},
  ): void {
    this.debugger.debug('Validating fields', { fields, options });

    if (options.strict) {
      fields.forEach((field) => {
        if (!(field in model)) {
          throw new ContentrainValidationError('fields', `Field "${field}" does not exist in model`);
        }
      });
    }
  }

  private isValidContentrainType(item: any): item is BaseContentrainType {
    return (
      item
      && typeof item === 'object'
      && typeof item.ID === 'string'
      && typeof item.createdAt === 'string'
      && typeof item.updatedAt === 'string'
      && ['draft', 'changed', 'publish'].includes(item.status)
      && typeof item.scheduled === 'boolean'
    );
  }
}
