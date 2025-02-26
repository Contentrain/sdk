/**
 * Model locales type
 */
export type ModelLocales<T extends string> = T;

/**
 * System fields that are always present in models
 */
export const SYSTEM_FIELDS = [
    'id',
    'created_at',
    'updated_at',
    'status',
    'locale',
] as const;

export type SystemField = typeof SYSTEM_FIELDS[number];
export type RAW_SYSTEM_FIELDS = [
    'ID',
    'createdAt',
    'updatedAt',
    'status',
];

/**
 * Base types supported by Contentrain
 */
export type ContentrainBaseType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'date'
  | 'media'
  | 'relation';

/**
 * Component types for field rendering
 */
export type ContentrainComponentType =
  | 'single-line-text'
  | 'multi-line-text'
  | 'rich-text-editor'
  | 'markdown-editor'
  | 'email'
  | 'url'
  | 'slug'
  | 'color'
  | 'json'
  | 'integer'
  | 'decimal'
  | 'rating'
  | 'percent'
  | 'phone-number'
  | 'checkbox'
  | 'switch'
  | 'select'
  | 'date'
  | 'date-time'
  | 'media'
  | 'one-to-one'
  | 'one-to-many';

/**
 * Types of relations between models
 */
export type RelationType = 'one-to-one' | 'one-to-many';

/**
 * Field validation options
 */
export interface ValidationOptions {
    'required-field'?: {
        value: boolean
    }
    'unique-field'?: {
        value: boolean
    }
    'input-range-field'?: {
        value: boolean
        form: {
            'number-of-stars': {
                min: number
                max: number
            }
        }
    }
}

/**
 * Field configuration options
 */
export interface FieldOptions {
    'title-field'?: {
        value: boolean
    }
    'default-value'?: {
        value: boolean
        form: {
            'default-value': {
                value: string | number | boolean
            }
        }
    }
    'number-of-stars'?: {
        value: boolean
        form: {
            'number-of-stars': {
                min: number
                max: number
            }
        }
    }
    'reference'?: {
        value: boolean
        form: {
            reference: {
                value: string
            }
            titleField?: {
                value: string
            }
        }
    }
}

/**
 * Raw field configuration from JSON
 */
export interface RawModelField {
    name: string
    fieldId: string
    fieldType: ContentrainBaseType
    componentId: ContentrainComponentType
    validations?: ValidationOptions
    options?: FieldOptions
    system?: boolean
    defaultField?: boolean
    modelId?: string
}

/**
 * Normalized field configuration
 */
export interface ModelField {
    name: string
    fieldId: string
    fieldType: ContentrainBaseType
    componentId: ContentrainComponentType
    validations?: ValidationOptions
    options?: FieldOptions
    localized?: boolean
    system?: boolean
    defaultField?: boolean
    modelId?: string
}

/**
 * Model configuration
 */
export interface ModelConfig {
    id: string
    name: string
    type: 'JSON'
    localization: boolean
    isServerless?: boolean
    createdBy?: string
    fields: ModelField[]
}

/**
 * Base translation interface
 */
export interface IBaseTranslation<T extends string> {
    id: string
    locale: ModelLocales<T>
}

/**
 * Type mappings between SQLite, TypeScript and Contentrain types
 */
export const TYPE_MAPPING = {
    // SQLite to TypeScript type mappings
    'TEXT': 'string',
    'INTEGER': 'number',
    'REAL': 'number',
    'BOOLEAN': 'boolean',
    'DATE': 'string',
    'DATETIME': 'string',
    'JSON': 'Record<string, unknown>',
    'BLOB': 'Buffer',

    // Contentrain specific types
    'single-line-text': 'string',
    'multi-line-text': 'string',
    'rich-text-editor': 'string',
    'markdown-editor': 'string',
    'email': 'string',
    'url': 'string',
    'slug': 'string',
    'color': 'string',
    'phone-number': 'string',
    'integer': 'number',
    'decimal': 'number',
    'rating': 'number',
    'percent': 'number',
    'checkbox': 'boolean',
    'switch': 'boolean',
    'date': 'string',
    'date-time': 'string',
    'media': 'string',
    'json': 'Record<string, unknown>',
    'select': 'string',

    // Relation types
    'relation': 'Record<string, unknown>',
    'one-to-one': 'Record<string, unknown>',
    'one-to-many': 'Record<string, unknown>[]',
} as const;

export type ContentrainFieldType = keyof typeof TYPE_MAPPING;
export type TypeScriptType = typeof TYPE_MAPPING[ContentrainFieldType];
