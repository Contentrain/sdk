/**
 * Tablo konfigürasyonu için tipler
 */
export type TableName<T> = T extends { __tableName: infer U } ? U : T extends string ? T : never;

export interface TableConfig<T extends string> {
  __tableName: T
}

/**
 * Base model yapısı
 */
export interface BaseQueryModel {
  id: string
  created_at: string
  updated_at: string
  status: 'draft' | 'changed' | 'publish'
  _relations?: {
    [K: string]: BaseQueryModel | BaseQueryModel[]
  }
}

/**
 * İlişki tiplerini çıkart
 */
export type ExtractRelations<T> = {
  [K in keyof T]: T[K] extends BaseQueryModel | BaseQueryModel[] | null | undefined ? K : never
}[keyof T];

/**
 * İlişki olmayan tipleri çıkart
 */
export type ExtractFields<T> = {
  [K in keyof T]: T[K] extends BaseQueryModel | BaseQueryModel[] | null | undefined ? never : K
}[keyof T];

/**
 * Alan tipine göre operatör seçimi
 */
export type OperatorForType<T> = T extends string
  ? StringOperator | ArrayOperator
  : T extends number
    ? NumericOperator | ArrayOperator
    : T extends boolean
      ? 'eq' | 'ne'
      : T extends Date
        ? NumericOperator | ArrayOperator
        : T extends Array<any>
          ? ArrayOperator
          : never;

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
 * Filtre yapısı
 */
export interface WhereClause<T, K extends ExtractFields<T> = ExtractFields<T>> {
  field: K
  operator: OperatorForType<T[K]>
  value: T[K] | T[K][]
}

/**
 * Sıralama yapısı
 */
export interface OrderByClause<T, K extends ExtractFields<T> = ExtractFields<T>> {
  field: K
  direction: 'asc' | 'desc'
}

/**
 * İlişki seçenekleri
 */
export interface RelationConfig<T = any> {
  select?: Array<keyof T>
  where?: WhereClause<T>[]
  orderBy?: OrderByClause<T>[]
  include?: Record<string, RelationConfig<any>>
}

export interface RelationOptions<T extends BaseQueryModel> {
  select?: Array<ExtractFields<T>>
  where?: WhereClause<T>[]
  orderBy?: OrderByClause<T>[]
  include?: {
    [K in ExtractRelations<T>]?: T[K] extends Array<infer U>
      ? U extends BaseQueryModel
        ? RelationOptions<U>
        : never
      : T[K] extends BaseQueryModel
        ? RelationOptions<T[K]>
        : never
  }
}

/**
 * İlişki yapısı
 */
export type IncludeClause<T extends BaseQueryModel> = {
  [K in ExtractRelations<T>]?: T[K] extends Array<infer U>
    ? U extends BaseQueryModel
      ? RelationOptions<U>
      : never
    : T[K] extends BaseQueryModel
      ? RelationOptions<T[K]>
      : never
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
export interface QueryConfig<T extends BaseQueryModel> {
  select?: Array<ExtractFields<T>>
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
export interface QueryBuilder<
  T extends BaseQueryModel,
  TTable extends TableConfig<string> = any,
> {
  /**
   * Tablo bilgisi
   */
  readonly tableName: TableName<TTable>
  readonly hasTranslations: boolean

  /**
   * Filtre ekler
   */
  where: <K extends ExtractFields<T>>(
    field: K,
    operator: OperatorForType<T[K]>,
    value: T[K] | T[K][],
  ) => this

  /**
   * İlişki ekler
   */
  include: <K extends ExtractRelations<T>>(
    relations: K | K[],
    options?: T[K] extends Array<infer U>
      ? U extends BaseQueryModel
        ? RelationOptions<U>
        : never
      : T[K] extends BaseQueryModel
        ? RelationOptions<T[K]>
        : never,
  ) => this

  /**
   * Alan seçimi yapar
   */
  select: (fields: Array<ExtractFields<T>>) => this

  /**
   * Sıralama ekler
   */
  orderBy: (field: ExtractFields<T>, direction?: 'asc' | 'desc') => this

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
export interface Repository<T extends BaseQueryModel> {
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
