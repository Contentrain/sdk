import type { IBaseJSONRecord } from '../loader/types/json';
import type { IDBRecord } from '../loader/types/sqlite';

// Common Types
export type StringOperator = 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith';
export type NumericOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
export type ArrayOperator = 'in' | 'nin';
export type Operator = StringOperator | NumericOperator | ArrayOperator;

export interface Filter {
  field: string
  operator: Operator
  value: any
}

export interface Sort {
  field: string
  direction: 'asc' | 'desc'
}

export interface Pagination {
  limit?: number
  offset?: number
}

export interface QueryOptions {
  locale?: string
  cache?: boolean
  ttl?: number
}

export interface QueryResult<TData> {
  data: TData[]
  total: number
  pagination?: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

// Base Include Types
export interface Include {
  [key: string]: {
    include?: Include
  }
}

// Base Query Builder Interfaces
export interface IBaseQueryBuilder<TData> {
  where: (field: keyof TData, operator: Operator, value: any) => this
  orderBy: (field: keyof TData, direction?: 'asc' | 'desc') => this
  limit: (count: number) => this
  offset: (count: number) => this
  get: () => Promise<QueryResult<TData>>
  first: () => Promise<TData | null>
  count: () => Promise<number>
  cache: (ttl?: number) => this
  noCache: () => this
  bypassCache: () => this
}

// SQLite Tipleri
export interface SQLiteOptions extends QueryOptions {
  translations?: boolean
  includes?: string[]
}

export interface ISQLiteQuery<TData extends IDBRecord> extends IBaseQueryBuilder<TData> {
  include: (relations: string | string[]) => this
  locale: (code: string, translations?: boolean) => this
}

export interface SQLQuery {
  select: string[]
  from: string
  joins: SQLJoin[]
  where: Filter[]
  orderBy: Sort[]
  parameters: unknown[]
  pagination?: Pagination
  options?: SQLiteOptions
}

export interface SQLJoin {
  type: 'LEFT' | 'INNER'
  table: string
  alias: string
  conditions: string[]
}

// JSON Tipleri
export interface JSONOptions extends QueryOptions {
  defaultLocale?: string
}

export interface IJSONQuery<TData extends IBaseJSONRecord> extends IBaseQueryBuilder<TData> {
  include: (relations: string | string[], reference?: string) => this
  locale: (code: string, defaultLocale?: string) => this
}
