import type { ContentItem } from './content';

export type ContentrainLocales = string;
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
  TFields extends ContentItem,
  TLocales extends ContentrainLocales = 'en' | 'tr',
  TRelations extends Record<string, ContentItem> = Record<string, never>,
> {
  fields: TFields
  locales: TLocales
  relations: TRelations
}
