export interface BaseContentrainType {
  ID: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'changed' | 'publish'
  scheduled: boolean
  _relations?: {
    [key: string]: BaseContentrainType | BaseContentrainType[]
  }
}

export type ContentrainStatus = 'draft' | 'changed' | 'publish';

export interface ModelMetadata {
  name: string
  modelId: string
  localization: boolean
  type: 'JSON'
  createdBy: string
  isServerless: boolean
}

export interface FieldMetadata {
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

export interface AssetMetadata {
  path: string
  size: number
  type: string
  createdAt: string
  updatedAt: string
}

export type ContentrainLocales = string;

export interface QueryConfig<
  TFields extends BaseContentrainType,
  TLocales extends ContentrainLocales,
  TRelations extends Record<string, BaseContentrainType>,
> {
  fields: TFields
  locales: TLocales
  relations: TRelations
}
