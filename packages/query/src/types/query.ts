import type { BaseContentrainType, ContentrainLocales } from './model';

export type StringOperator = 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith';
export type NumericOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
export type ArrayOperator = 'in' | 'nin';

export type Operator = StringOperator | NumericOperator | ArrayOperator;

export interface Filter<T = any> {
  field: string
  operator: Operator
  value: T extends Array<infer U> ? (ArrayOperator extends 'in' | 'nin' ? U[] : U) : T
}

export interface Sort {
  field: string
  direction: 'asc' | 'desc'
}

export interface Pagination {
  limit?: number
  offset?: number
}

export interface Include {
  [relation: string]: {
    fields?: string[]
    include?: Include
  }
}

export interface QueryOptions {
  locale?: string
  cache?: boolean
  ttl?: number
}

export interface QueryResult<T> {
  data: T[]
  total: number
  pagination?: {
    limit: number
    offset: number
    hasMore: boolean
  }
}
export interface QueryConfig<
  TFields extends BaseContentrainType,
  TLocales extends ContentrainLocales = 'en' | 'tr',
  TRelations extends Record<string, BaseContentrainType> = Record<string, never>,
> {
  fields: TFields
  locales: TLocales
  relations: TRelations
}
