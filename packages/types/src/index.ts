export interface ContentrainField {
  id: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'media' | 'relation'
  required: boolean
  componentId: 'single-line-text' | 'multi-line-text' | 'email' | 'url' | 'slug' | 'color' | 'json' | 'md-editor' | 'rich-text-editor' | 'integer' | 'decimal' | 'rating' | 'percent' | 'phone-number' | 'checkbox' | 'switch' | 'date' | 'date-time' | 'media' | 'one-to-one' | 'one-to-many'
  relation?: {
    model: string
    multiple?: boolean
    type: 'one-to-one' | 'one-to-many'
  }
}

export interface ContentrainModelMetadata {
  modelId: string
  fields: ContentrainField[]
  localization: boolean
}

export interface ContentrainBaseModel {
  ID: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'changed' | 'publish'
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

export type Status = 'draft' | 'changed' | 'publish';
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
