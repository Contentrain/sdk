import type { ContentItem } from './content';
import type { RelationType } from './model';

/**
 * Base translation fields that every translation must have
 */
export interface BaseTranslation {
  id: string
  locale: string
}

/**
 * Basic operator types
 */
export type Operator =
  | 'eq' | 'ne' // Basic operators
  | 'gt' | 'gte' | 'lt' | 'lte' // Numeric operators
  | 'contains' | 'startsWith' | 'endsWith' // String operators
  | 'in' | 'nin'; // Array operators

/**
 * Type-safe operator mapping
 */
export type OperatorForType<T> = T extends string
  ? 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'nin'
  : T extends number
    ? 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin'
    : T extends boolean
      ? 'eq' | 'ne'
      : T extends Date
        ? 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
        : T extends Array<any>
          ? 'in' | 'nin'
          : 'eq' | 'ne' | 'in' | 'nin';

/**
 * Type-safe value for operator
 */
export type ValueForOperator<T, O extends Operator> = O extends 'in' | 'nin'
  ? T[]
  : T;

/**
 * Where clause with type safety
 */
export interface WhereClause<T, K extends keyof T = keyof T> {
  field: K
  operator: OperatorForType<T[K]>
  value: ValueForOperator<T[K], OperatorForType<T[K]>>
}

/**
 * Order by clause
 */
export interface OrderByClause<T> {
  field: keyof T
  direction: 'asc' | 'desc'
}

/**
 * Relation configuration with type safety
 */
export interface RelationConfig<T> {
  type: RelationType
  model: T
  select?: Array<keyof T>
  include?: Record<string, RelationConfig<any>>
}

/**
 * Translation configuration
 */
export interface TranslationConfig<T, L extends string = string> {
  locales: L[]
  fields: Array<keyof T>
}

/**
 * Query options
 */
export interface QueryOptions {
  locale?: string
  cache?: boolean
  ttl?: number
  bypassCache?: boolean
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number
  offset?: number
}

/**
 * Query result
 */
export interface QueryResult<T> {
  data: T[]
  total: number
  pagination?: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * Query configuration with type safety
 */
export interface QueryConfig<
  T extends ContentItem,
  TTranslation extends BaseTranslation = BaseTranslation,
  TRelations extends Record<string, RelationConfig<ContentItem>> = Record<string, never>,
> {
  select?: Array<keyof (T & TTranslation)>
  where?: WhereClause<T & TTranslation>[]
  orderBy?: OrderByClause<T & TTranslation>[]
  include?: {
    [K in keyof TRelations]?: RelationConfig<TRelations[K]['model']>
  }
  pagination?: PaginationOptions
  options?: QueryOptions
}

/**
 * Query builder interface with enhanced type safety
 */
export interface QueryBuilder<
  T extends ContentItem,
  TTranslation extends BaseTranslation = BaseTranslation,
  TRelations extends Record<string, RelationConfig<ContentItem>> = Record<string, never>,
> {
  where: <K extends keyof (T & TTranslation), O extends Operator>(
    field: K,
    operator: O,
    value: ValueForOperator<(T & TTranslation)[K], O>
  ) => this

  include: <K extends keyof TRelations>(
    relation: K,
    options: RelationConfig<TRelations[K]['model']>
  ) => this

  select: (fields: Array<keyof (T & TTranslation)>) => this
  orderBy: (field: keyof (T & TTranslation), direction?: 'asc' | 'desc') => this
  limit: (count: number) => this
  offset: (count: number) => this
  locale: (code: string) => this
  cache: (ttl?: number) => this
  noCache: () => this
  bypassCache: () => this
  get: () => Promise<QueryResult<T & Partial<TRelations>>>
  first: () => Promise<(T & Partial<TRelations>) | null>
  count: () => Promise<number>
}
