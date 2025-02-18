import type { SQLiteLoader } from '../loader/sqlite/sqlite.loader';
import type { IBaseJSONRecord } from '../loader/types/json';
import type { IDBRecord } from '../loader/types/sqlite';
import type { SQLiteQueryExecutor } from './sqlite/sqlite-executor';

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
export interface IncludeOptions {
  relation: string
  locale?: string
}

export type Include = string | IncludeOptions | (string | IncludeOptions)[];

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
export interface SQLiteOptions {
  includes?: IncludeOptions[]
  locale?: string
  translations?: boolean
}

// Dil desteği için tip
export type SupportedLocale = string;

// İlişki desteği için tip
export type RelationConfig<T> = {
  [K in keyof T]: T[K] extends { _relations?: infer R } ? R : never;
}[keyof T];

// Sorgu yapılandırması için ana tip
export interface QueryConfig<
  TModel extends IDBRecord,
  TLocale extends SupportedLocale = string,
  TRelations extends Record<string, any> = Record<string, any>,
> {
  model: TModel
  locale: TLocale
  relations: {
    [K in keyof TRelations]: {
      relation: K
      locale?: TLocale
    };
  }
}

// SQLite sorgu builder'ı için tip
export interface ISQLiteQuery<
  TModel extends IDBRecord,
  TLocale extends SupportedLocale = string,
  TRelations extends Record<string, any> = Record<string, any>,
> extends IBaseQueryBuilder<TModel> {
  include: <K extends keyof TRelations>(
    relations: K | K[] | { relation: K, locale?: TLocale } | Array<{ relation: K, locale?: TLocale }>
  ) => this
  locale: (code: TLocale) => this
  setLoader: (loader: SQLiteLoader<TModel>) => this
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

// SQLite sorgu yapılandırması için tip
export interface SQLiteQueryConfig<TData extends IDBRecord> {
  model: string
  loader?: SQLiteLoader<TData>
  options?: SQLiteOptions
}

// Query builder için yeni tip
export interface ISQLiteQueryBuilder<TData extends IDBRecord> {
  model: string
  executor: SQLiteQueryExecutor<TData>
  options: SQLiteOptions
}
