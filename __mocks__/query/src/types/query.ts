// Base Types
export interface BaseContentrainType {
  ID: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'changed' | 'publish'
  scheduled: boolean
}

export interface ContentrainModelMetadata {
  name: string
  modelId: string
  localization: boolean
  type: string
  createdBy: string
  isServerless: boolean
  relations?: Record<string, {
    model: string
    type: 'one-to-one' | 'one-to-many'
  }>
}

export interface ContentrainTypes {
  models: Record<string, BaseContentrainType>
  relations: Record<string, {
    model: keyof ContentrainTypes['models']
    type: 'one-to-one' | 'one-to-many'
  }>
  locales: string
}

// Query Types
export type QueryOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'in'
  | 'nin'
  | 'exists'
  | 'startsWith'
  | 'endsWith'
  | 'contains';

export type SortDirection = 'asc' | 'desc';

export type WhereCondition = [string, QueryOperator, any] | [string, any];

// Generic Type Parameters
export interface RelationOptions {
  fields?: string[]
  where?: WhereCondition[]
  orderBy?: { field: string, direction?: SortDirection }
  limit?: number
  loading?: LoadingStrategy
  validation?: ValidationOptions
}

export interface RelationConfig {
  [key: string]: RelationOptions | string[] | string
}

export interface QueryConfig {
  baseUrl?: string
  contentDir?: string
  modelsDir?: string
  assetsDir?: string
  defaultLocale?: string
  strategy?: 'fetch' | 'import'
  defaultCacheTime?: number
}

// Loading stratejileri
export type LoadingStrategy = 'eager' | 'lazy';

// Debug seviyeleri
export type DebugLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

// Field selection tipleri
export interface FieldSelection {
  select?: string[]
  exclude?: string[]
}

// Validation için tipler
export interface ValidationOptions {
  validateSchema?: boolean
  validateRelations?: boolean
  strict?: boolean
}

// Debug için tipler
export interface DebugOptions {
  level: DebugLevel
  logger?: (level: DebugLevel, message: string, data?: any) => void
}

// Query Options güncelleme
export interface QueryOptions {
  cache?: boolean
  cacheTime?: number
  loading?: LoadingStrategy
  fields?: FieldSelection
  validation?: ValidationOptions
  debug?: DebugOptions
}

// Field validasyonu için yardımcı tipler
export type ValidFields<T> = keyof T;

export type FieldType<T, F extends ValidFields<T>> = T[F];

// Cache için tipler
export interface CacheOptions {
  version?: string
  strategy?: 'memory' | 'storage' | 'both'
  invalidateOnUpdate?: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  version?: string
}

// Query Builder Interface
export interface QueryBuilder<
  T extends BaseContentrainType,
  Types extends ContentrainTypes = ContentrainTypes,
  K extends keyof Types['models'] = keyof Types['models'],
> {
  from: <M extends K>(modelId: M) => QueryBuilder<Types['models'][M], Types, M>

  locale: (locale: Types['locales']) => QueryBuilder<T, Types, K>

  where: (<F extends ValidFields<T>>(
    field: F,
    operator: QueryOperator,
    value: FieldType<T, F>
  ) => QueryBuilder<T, Types, K>) & (<F extends ValidFields<T>>(
    field: F,
    value: FieldType<T, F>
  ) => QueryBuilder<T, Types, K>) & ((conditions: WhereCondition[]) => QueryBuilder<T, Types, K>)

  include: <R extends keyof Types['relations']>(
    relationOrConfig: R | R[] | RelationConfig
  ) => QueryBuilder<T, Types, K>

  orderBy: <F extends ValidFields<T>>(
    field: F,
    direction?: SortDirection
  ) => QueryBuilder<T, Types, K>

  limit: (count: number) => QueryBuilder<T, Types, K>

  skip: (count: number) => QueryBuilder<T, Types, K>

  get: () => Promise<T[]>

  first: () => Promise<T | null>
}

export interface ModelSchemaField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date'
  required?: boolean
  format?: string
  validate?: (value: any) => boolean
  message?: string
}

export interface ModelSchema {
  fields: {
    [key: string]: ModelSchemaField
  }
  relations?: {
    [key: string]: {
      type: 'one-to-one' | 'one-to-many'
      model: string
      foreignKey: string
    }
  }
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}
