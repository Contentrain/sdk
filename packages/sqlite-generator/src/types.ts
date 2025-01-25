export type ContentrainStatus = 'publish' | 'draft' | 'changed';

export interface ModelMetadata {
  name: string
  modelId: string
  localization: boolean
  type: 'JSON'
  createdBy: string
  isServerless: boolean
}

export interface ModelField {
  name: string
  fieldId: string
  modelId: string
  componentId: ContentrainComponentId
  fieldType: ContentrainFieldType
  options: FieldOptions
  validations: FieldValidations
  system?: boolean
  defaultField?: boolean
}

export interface ValidationRule {
  title: string
  id: string
  property: string
  description: string
  form?: Record<string, any>
}

export interface FieldOption {
  title: string
  id: string
  property: string
  description: string
  form?: Record<string, any>
}

export interface ContentItem {
  ID: string
  [key: string]: any
  status: ContentrainStatus
  scheduled?: boolean
  createdAt: string
  updatedAt: string
}

export interface DatabaseConfig {
  memory?: boolean
  readonly?: boolean
  fileMustExist?: boolean
  timeout?: number
  verbose?: boolean
}

export type ContentrainFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'date'
  | 'media'
  | 'relation';

export type ContentrainComponentId =
  | 'single-line-text'
  | 'multi-line-text'
  | 'email'
  | 'url'
  | 'slug'
  | 'color'
  | 'json'
  | 'md-editor'
  | 'rich-text-editor'
  | 'integer'
  | 'decimal'
  | 'rating'
  | 'percent'
  | 'phone-number'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'date-time'
  | 'media'
  | 'one-to-one'
  | 'one-to-many';

export interface FieldOptions {
  'title-field'?: {
    value: boolean
  }
  'default-value'?: {
    value: boolean
    form: {
      [key: string]: {
        value: any
      }
    }
  }
  'reference'?: {
    value: boolean
    form: {
      reference: {
        value: string
      }
    }
  }
}

export interface FieldValidations {
  'required-field'?: {
    value: boolean
  }
  'unique-field'?: {
    value: boolean
  }
  'input-range-field'?: {
    value: {
      min: number
      max: number
    }
  }
}
