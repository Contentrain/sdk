import type { DataLoader } from '../loader/types';

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn';

export interface WhereCondition {
  field: string
  operator: FilterOperator
  value: unknown
}

export interface OrderByCondition {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  skip?: number
  take?: number
}

export interface QueryOptions {
  loader: DataLoader
  locale?: string
}
