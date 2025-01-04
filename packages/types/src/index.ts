export interface ContentrainField {
  id: string
  type: string
  required?: boolean
  relation?: ContentrainRelation
}

export interface ContentrainModelMetadata {
  modelId: string
  fields: ContentrainField[]
  localization?: boolean
  relations?: Record<string, ContentrainRelation>
}

export interface ContentrainConfig {
  contentPath?: string
  modelsPath?: string
  assetsPath?: string
  locale?: string
}

export type RequiredConfig = Required<Omit<ContentrainConfig, 'locale'>> & Pick<ContentrainConfig, 'locale'>;

export type SafeField = ContentrainField & {
  id: string
  type: string
};

export type SafeModelMetadata = Omit<ContentrainModelMetadata, 'fields'> & {
  fields: SafeField[]
};

export interface ContentrainBaseModel {
  ID: string
  [key: string]: unknown
}

export interface ContentrainRelation {
  model: string
  multiple?: boolean
  type: 'one-to-one' | 'one-to-many'
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
  value: T[keyof T]
}

export type SortDirection = 'asc' | 'desc';

export interface SortCondition<T> {
  field: keyof T
  direction: SortDirection
}

export type WithRelation<T, K extends keyof T> = T & {
  [P in K as `${string & P}-data`]: T[P] extends Array<string>
    ? Array<ContentrainBaseModel>
    : ContentrainBaseModel | null
};

export type { ContentrainConfig as Config };
export type { ContentrainError as Error };
export type { ContentrainField as Field };
export type { ContentrainFileSystem as FileSystem };
export type { ContentrainModelMetadata as ModelMetadata };
export type { ContentrainRelation as Relation };
