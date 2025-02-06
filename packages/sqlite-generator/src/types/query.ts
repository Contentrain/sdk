import type { ContentItem } from './content';

/**
 * String operatörleri
 */
export type StringOperator = 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith';

/**
 * Sayısal operatörler
 */
export type NumericOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';

/**
 * Dizi operatörleri
 */
export type ArrayOperator = 'in' | 'nin';

/**
 * Tüm operatörler
 */
export type Operator = StringOperator | NumericOperator | ArrayOperator;

/**
 * Alan tipine göre operatör seçimi
 */
export type OperatorForType<T> = T extends (infer _U)[]
  ? ArrayOperator
  : T extends string
    ? StringOperator | ArrayOperator
    : T extends number
      ? NumericOperator | ArrayOperator
      : never;

/**
 * Filtre yapısı
 */
export interface WhereClause<T, K extends keyof T = keyof T> {
  field: K
  operator: OperatorForType<T[K]>
  value: T[K] | T[K][]
}

/**
 * Sıralama yapısı
 */
export interface OrderByClause<T> {
  field: keyof T
  direction: 'asc' | 'desc'
}

/**
 * İlişki seçenekleri
 */
export interface RelationOptions<T> {
  select?: Array<keyof T>
  where?: WhereClause<T>[]
  include?: Record<keyof T, RelationOptions<any>>
}

/**
 * İlişki yapısı
 */
export type IncludeClause<T> = {
  [K in keyof T]?: RelationOptions<T[K]>;
};

/**
 * Sayfalama seçenekleri
 */
export interface PaginationOptions {
  limit?: number
  offset?: number
}

/**
 * Sorgu seçenekleri
 */
export interface QueryOptions {
  locale?: string
  cache?: boolean
  ttl?: number
  bypassCache?: boolean
}

/**
 * Sorgu yapılandırması
 */
export interface QueryConfig<T extends ContentItem> {
  select?: Array<keyof T>
  where?: WhereClause<T>[]
  orderBy?: OrderByClause<T>[]
  include?: IncludeClause<T>
  pagination?: PaginationOptions
  options?: QueryOptions
}

/**
 * Sorgu sonucu
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
 * QueryBuilder arayüzü
 */
export interface QueryBuilder<T extends ContentItem> {
  /**
   * Filtre ekler
   */
  where: <K extends keyof T>(
    field: K,
    operator: OperatorForType<T[K]>,
    value: T[K] | T[K][],
  ) => this

  /**
   * İlişki ekler
   */
  include: <K extends keyof T>(
    relations: K | K[],
    options?: RelationOptions<T[K]>,
  ) => this

  /**
   * Sıralama ekler
   */
  orderBy: (field: keyof T, direction?: 'asc' | 'desc') => this

  /**
   * Limit ekler
   */
  limit: (count: number) => this

  /**
   * Offset ekler
   */
  offset: (count: number) => this

  /**
   * Dil seçer
   */
  locale: (code: string) => this

  /**
   * Önbellek süresini ayarlar
   */
  cache: (ttl?: number) => this

  /**
   * Önbelleği devre dışı bırakır
   */
  noCache: () => this

  /**
   * Önbelleği atlar
   */
  bypassCache: () => this

  /**
   * Sorguyu çalıştırır
   */
  get: () => Promise<QueryResult<T>>

  /**
   * Tek kayıt getirir
   */
  first: () => Promise<T | null>

  /**
   * Kayıt sayısını getirir
   */
  count: () => Promise<number>
}

/**
 * Repository arayüzü
 */
export interface Repository<T extends ContentItem> {
  /**
   * Yeni sorgu oluşturur
   */
  query: () => QueryBuilder<T>

  /**
   * ID ile kayıt getirir
   */
  findById: (id: string, options?: QueryOptions) => Promise<T | null>

  /**
   * Tek kayıt getirir
   */
  findOne: (query: QueryConfig<T>) => Promise<T | null>

  /**
   * Çoklu kayıt getirir
   */
  findMany: (query: QueryConfig<T>) => Promise<QueryResult<T>>

  /**
   * Kayıt sayısını getirir
   */
  count: (query?: Omit<QueryConfig<T>, 'pagination' | 'orderBy'>) => Promise<number>
}
