// Model Metadata Types
export interface ModelMetadata {
    name: string // PascalCase
    modelId: string // kebab-case
    localization: boolean
    type: 'JSON'
    createdBy: string
    isServerless: boolean
}

// Field Types
export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'date' | 'media' | 'relation';

// Component Types for String
export type StringComponent =
  | 'single-line-text'
  | 'multi-line-text'
  | 'email'
  | 'url'
  | 'slug'
  | 'color'
  | 'json'
  | 'md-editor'
  | 'rich-text-editor';

// Component Types for Number
export type NumberComponent =
  | 'integer'
  | 'decimal'
  | 'rating'
  | 'percent'
  | 'phone-number';

// Component Types for Boolean
export type BooleanComponent =
  | 'checkbox'
  | 'switch';

// Component Types for Date
export type DateComponent =
  | 'date'
  | 'date-time';

// Component Types for Media
export type MediaComponent = 'media';

// Component Types for Relation
export type RelationComponent =
  | 'one-to-one'
  | 'one-to-many';

// All Component Types
export type ComponentId =
  | StringComponent
  | NumberComponent
  | BooleanComponent
  | DateComponent
  | MediaComponent
  | RelationComponent;

// Validation Types
export interface ValidationBase {
    value: boolean
    description?: string
}

export type RequiredFieldValidation = ValidationBase;

export type UniqueFieldValidation = ValidationBase;

export interface InputRangeValidation extends ValidationBase {
    form: {
        'number-of-stars': {
            component: 'integer'
            props: {
                min: number
                max: number
            }
        }
    }
}

export interface Validations {
    'required-field'?: RequiredFieldValidation
    'unique-field'?: UniqueFieldValidation
    'input-range-field'?: InputRangeValidation
}

// Option Types
export interface TitleFieldOption {
    value: boolean
    description?: string
    disabled?: boolean
}

export interface DefaultValueOption {
    value: boolean
    description?: string
    form: {
        'default-value': {
            component: string
            value: unknown
        }
    }
}

export interface NumberOfStarsOption {
    value: boolean
    description?: string
    form: {
        'number-of-stars': {
            component: 'integer'
            props: {
                min: number
                max: number
            }
        }
    }
}

export interface RelationOption {
    value: boolean
    form: {
        reference: {
            value: string // Referenced model ID
        }
    }
}

export interface Options {
    'title-field'?: TitleFieldOption
    'default-value'?: DefaultValueOption
    'number-of-stars'?: NumberOfStarsOption
    'reference'?: RelationOption
}

// Field Metadata
export interface FieldMetadata {
    name: string
    fieldId: string
    modelId: string
    componentId: ComponentId
    fieldType: FieldType
    validations?: Validations
    options?: Options
    system?: boolean
}

// Content Types
export interface BaseContent {
    ID: string
    createdAt: string
    updatedAt: string
    status: 'publish' | 'draft' | 'changed'
}

export interface LocalizedContent extends BaseContent {
    _lang: string
    _relations?: Record<string, LocalizedContent | LocalizedContent[]>
    [key: string]: unknown
}

export interface Content extends BaseContent {
    _relations?: Record<string, Content | Content[]>
    [key: string]: unknown
}

// Asset Types
export interface AssetMetadata {
    user: {
        name: string
        email: string
        avatar: string
    }
    createdAt: string
}

export interface Asset {
    path: string
    mimetype: string
    size: number
    alt: string
    meta: AssetMetadata
}

// Query Types
export type Operator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith';

export interface QueryFilter<T = any> {
    field: keyof T & string
    operator: Operator
    value: unknown
}

export interface QuerySort<T = any> {
    field: keyof T & string
    direction: 'asc' | 'desc'
}

export interface QueryParams<T = any> {
    locale?: string
    filters?: QueryFilter<T>[]
    sort?: QuerySort<T>[]
    limit?: number
    offset?: number
    include?: string[]
}

// Çoklu sonuçlar için QueryResult
export interface QueryResult<T> {
    data: T[]
    total: number
    pagination: {
        limit: number
        offset: number
        total: number
    }
}

// Tekli sonuçlar için SingleQueryResult
export interface SingleQueryResult<T> {
    data: T
    total: number
    pagination: {
        limit: number
        offset: number
        total: number
    }
}

// Model sonuçları için standart dönüş tipi
export interface ModelResult<T> {
    data: T
    metadata: {
        modelId: string
        timestamp: number
    }
}

// Model Data Type
export interface ModelData {
    metadata: ModelMetadata
    fields: FieldMetadata[]
    content: (Content | LocalizedContent)[]
}

// Özel hata sınıfı için tip
export interface ContentrainErrorDetails {
    code: string
    message: string
    details?: unknown
}
