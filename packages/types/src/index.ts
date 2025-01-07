export type ContentrainModelType = 'JSON' | 'MD' | 'MDX';
export type ContentrainContentStatusType = 'draft' | 'changed' | 'publish';

// Field Type Component Map
export const FieldTypeComponentMap = {
  string: ['single-line-text', 'multi-line-text', 'email', 'url', 'slug', 'color', 'json', 'md-editor', 'rich-text-editor'] as const,
  number: ['integer', 'decimal', 'rating', 'percent', 'phone-number'] as const,
  boolean: ['checkbox', 'switch'] as const,
  array: ['single-line-text', 'multi-line-text', 'email', 'url', 'slug', 'color', 'integer', 'decimal', 'rating', 'percent', 'phone-number'] as const,
  date: ['date', 'date-time'] as const,
  media: ['media'] as const,
  relation: ['one-to-one', 'one-to-many'] as const,
} as const;

// Field Types
export type FieldType = keyof typeof FieldTypeComponentMap;
export type ComponentType<T extends FieldType> = (typeof FieldTypeComponentMap)[T][number];

// Field Options
export interface ContentrainFieldOptions {
  titleField?: {
    value: boolean
    disabled: boolean
  }
  defaultValue?: {
    value: boolean
    form?: {
      defaultValue: {
        component: string
        value: string
      }
    }
  }
  numberOfStars?: {
    value: boolean
    form: {
      numberOfStars: {
        component: string
        value: string
        props: {
          min: number
          max: number
        }
      }
    }
  }
  reference?: {
    value: boolean
    form: {
      reference: {
        value: string
        props?: {
          options: any[]
        }
        component: string
      }
    }
  }
}

// Field Validations
export interface ContentrainValidation {
  value: boolean
  message?: string
}

export interface ContentrainValidations {
  'required-field'?: ContentrainValidation
  'unique-field'?: ContentrainValidation
  'min-length'?: ContentrainValidation & { minLength: number }
  'max-length'?: ContentrainValidation & { maxLength: number }
}

// Model Definition Types
export interface ModelField {
  name: string
  fieldId: string
  fieldType: FieldType
  componentId: string
  options: Record<string, any>
  validations: Record<string, any>
}

export interface ModelDefinition {
  name: string
  modelId: string
  fields: ModelField[]
}

// Base Types
export interface ContentrainField {
  name: string
  fieldId: string
  componentId: string
  fieldType: FieldType
  options: ContentrainFieldOptions
  validations: ContentrainValidations
  system?: boolean
  defaultField?: boolean
  modelId: string
}

export interface ContentrainModelMetadata {
  name: string
  modelId: string
  fields: ContentrainField[]
  localization: boolean
  type: ContentrainModelType
  createdBy: string
  isServerless: boolean
}

export interface ContentrainBaseModel {
  ID: string
  createdAt: string
  updatedAt: string
  status: ContentrainContentStatusType
  scheduled: boolean
  [key: string]: unknown
}

// Error Types
export enum ErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  MODEL_VALIDATION_ERROR = 'MODEL_VALIDATION_ERROR',
  TYPE_GENERATION_ERROR = 'TYPE_GENERATION_ERROR',
}

export type ContentrainErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export interface ContentrainErrorDetails {
  code: ContentrainErrorCode
  message: string
  path?: string
  details?: Record<string, unknown>
}

export interface ContentrainError extends Error {
  code: ContentrainErrorCode
  path?: string
  details?: Record<string, unknown>
}

// File System Types
export interface ContentrainFileSystem {
  readJSON: <T>(path: string) => Promise<T>
  exists: (path: string) => Promise<boolean>
  readdir: (path: string) => Promise<string[]>
}

// Relation Types
export interface ContentrainRelation {
  model: string
  multiple?: boolean
  type: 'one-to-one' | 'one-to-many'
}

export type SortDirection = 'asc' | 'desc';
export type RelationType = 'one-to-one' | 'one-to-many';

// Filter Types
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'nin'
  | 'exists'
  | 'notExists';

export interface FilterCondition<T> {
  field: keyof T
  operator: FilterOperator
  value: any
}

export interface SortCondition<T> {
  field: keyof T
  direction: SortDirection
}

export type WithRelation<T, K extends keyof T> = T & {
  [P in K as `${string & P}-data`]: T[P] extends Array<any> ? ContentrainBaseModel[] : ContentrainBaseModel
};

// Config Types
export interface ContentrainConfig {
  contentDir?: string
  modelsPath?: string
  assetsPath?: string
  locale?: string
  output?: string
}

export type RequiredConfig = Required<Omit<ContentrainConfig, 'locale'>> & Pick<ContentrainConfig, 'locale'>;

// Safe Types
export type SafeField = ContentrainField & {
  id: string
  type: string
};

export type SafeModelMetadata = Omit<ContentrainModelMetadata, 'fields'> & {
  fields: SafeField[]
};

// Core Types
export interface ContentrainCore {
  getModelMetadata: (collection: string) => Promise<ContentrainModelMetadata>
  getContent: <T>(collection: string) => Promise<T[]>
  getContentById: <T>(collection: string, id: string) => Promise<T>
  getAvailableCollections: () => Promise<string[]>
  getLocale: () => string | undefined
}

// Type Aliases
export type { ContentrainConfig as Config };
export type { ContentrainError as Error };
export type { ContentrainField as Field };
export type { ContentrainFileSystem as FileSystem };
export type { ContentrainModelMetadata as ModelMetadata };
export type { ContentrainRelation as Relation };
