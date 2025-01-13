export type Operator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith';

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
