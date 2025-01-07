import type { RuntimeAdapter } from '../runtime/types';

export interface QueryOptions {
  runtime: RuntimeAdapter
  locale?: string
  namespace?: string
  fallbackLocale?: string
  fallbackStrategy?: 'strict' | 'loose'
}

export interface PaginationOptions {
  skip?: number
  take?: number
}

export interface OrderByCondition {
  field: string
  direction: 'asc' | 'desc'
}

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'exists';

export interface WhereCondition {
  field: string
  operator: FilterOperator
  value: unknown
}

export interface QueryResult<T> {
  data: T[]
  total: number
  page?: number
  pageSize?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}
