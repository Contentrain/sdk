export type ContentrainModelType = 'JSON' | 'MD' | 'MDX';
export type ContentrainContentStatusType = 'draft' | 'changed' | 'publish';
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
export interface ContentrainFieldValidations {
  'required-field'?: {
    value: boolean
    disabled: boolean
  }
  'unique-field'?: {
    value: boolean
    disabled: boolean
  }
  'input-range-field'?: {
    value: boolean
    disabled: boolean
    form?: {
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
}

export interface FieldTypeComponentMap {
  string: 'single-line-text' | 'multi-line-text' | 'email' | 'url' | 'slug' | 'color' | 'json' | 'md-editor' | 'rich-text-editor'
  number: 'integer' | 'decimal' | 'rating' | 'percent' | 'phone-number'
  boolean: 'checkbox' | 'switch'
  array: 'single-line-text' | 'multi-line-text' | 'email' | 'url' | 'slug' | 'color' | 'integer' | 'decimal' | 'rating' | 'percent' | 'phone-number'
  date: 'date' | 'date-time'
  media: 'media'
  relation: 'one-to-one' | 'one-to-many'
}

export interface ContentrainField {
  name: string
  fieldId: string
  modelId: string
  fieldType: keyof FieldTypeComponentMap
  componentId: FieldTypeComponentMap[keyof FieldTypeComponentMap]
  options: ContentrainFieldOptions
  validations: ContentrainFieldValidations
  required: boolean
  relation?: ContentrainRelation
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

export interface ContentrainError extends Error {
  code: string
  path?: string
}

export interface ContentrainFileSystem {
  readJSON: <T>(path: string) => Promise<T>
  exists: (path: string) => Promise<boolean>
  readdir: (path: string) => Promise<string[]>
}

export interface ContentrainRelation {
  model: string
  multiple?: boolean
  type: 'one-to-one' | 'one-to-many'
}

export type SortDirection = 'asc' | 'desc';
export type RelationType = 'one-to-one' | 'one-to-many';

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

export interface ContentrainConfig {
  contentPath?: string
  modelsPath?: string
  assetsPath?: string
  locale?: string
  output?: string
}

export type RequiredConfig = Required<Omit<ContentrainConfig, 'locale'>> & Pick<ContentrainConfig, 'locale'>;

export type SafeField = ContentrainField & {
  id: string
  type: string
};

export type SafeModelMetadata = Omit<ContentrainModelMetadata, 'fields'> & {
  fields: SafeField[]
};

export interface ContentrainCore {
  getModelMetadata: (collection: string) => Promise<ContentrainModelMetadata>
  getContent: <T>(collection: string) => Promise<T[]>
  getContentById: <T>(collection: string, id: string) => Promise<T>
  getAvailableCollections: () => Promise<string[]>
  getLocale: () => string | undefined
}

export type { ContentrainConfig as Config };
export type { ContentrainError as Error };
export type { ContentrainField as Field };
export type { ContentrainFileSystem as FileSystem };
export type { ContentrainModelMetadata as ModelMetadata };
export type { ContentrainRelation as Relation };
