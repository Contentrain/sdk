import type { Database } from '../types/database';
import type {
  BaseQueryModel,
  ExtractFields,
  ExtractRelations,
  IncludeClause,
  QueryBuilder as IQueryBuilder,
  OperatorForType,
  QueryConfig,
  QueryResult,
  RelationConfig,
  RelationOptions,
  TableConfig,
  TableName,
} from '../types/query';
import { FieldNormalizer } from '../normalizer/FieldNormalizer';
import { ErrorCode, ValidationError } from '../types/errors';

export class QueryBuilder<
  T extends BaseQueryModel,
  TTable extends TableConfig<string> = any,
> implements IQueryBuilder<T, TTable> {
  private config: QueryConfig<T> = {};
  private includedRelations: Set<ExtractRelations<T>> = new Set();
  private selectedFields: Set<ExtractFields<T>> = new Set();
  private hasLocaleSet = false;
  private readonly defaultLocale = 'en';
  private readonly fieldNormalizer: FieldNormalizer;

  public readonly tableName: TableName<TTable>;
  public hasTranslations = false;

  constructor(
    private db: Database,
    modelId: TableName<TTable>,
  ) {
    this.fieldNormalizer = new FieldNormalizer();
    this.tableName = this.fieldNormalizer.normalizeTableName(modelId) as TableName<TTable>;
    this.initTranslationsPromise = this.initTranslations().catch((error) => {
      console.error('Failed to initialize translations:', error);
      this.hasTranslations = false;
    });
  }

  private initTranslationsPromise: Promise<void>;

  private async initTranslations(): Promise<void> {
    const hasTranslations = await this.checkTranslationTable();
    this.hasTranslations = hasTranslations;
  }

  /**
   * Checks translation table
   */
  private async checkTranslationTable(): Promise<boolean> {
    try {
      const translationTable = `${this.tableName}_translations`;
      const result = await this.db.get<{ name: string }>(
        'SELECT name FROM sqlite_master WHERE type = @type AND name = @name',
        { type: 'table', name: translationTable },
      );
      return result?.name === translationTable;
    }
    catch (error) {
      throw new ValidationError({
        code: ErrorCode.INVALID_QUERY_PARAMETER,
        message: 'Translation table not found',
        details: { tableName: this.tableName },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Filtre ekler
   */
  public where<K extends ExtractFields<T>>(
    field: K,
    operator: OperatorForType<T[K]>,
    value: T[K] | T[K][],
  ): this {
    if (!this.config.where) {
      this.config.where = [];
    }

    this.config.where.push({
      field,
      operator,
      value,
    });

    return this;
  }

  /**
   * İlişki ekler
   */
  public include<K extends ExtractRelations<T>>(
    relations: K | K[],
    options?: T[K] extends Array<infer U>
      ? U extends BaseQueryModel
        ? RelationOptions<U>
        : never
      : T[K] extends BaseQueryModel
        ? RelationOptions<T[K]>
        : never,
  ): this {
    if (!this.config.include) {
      this.config.include = {};
    }

    const relationArray = Array.isArray(relations) ? relations : [relations];

    for (const relation of relationArray) {
      if (options) {
        (this.config.include)[relation] = options;
      }
      this.includedRelations.add(relation);
    }

    return this;
  }

  /**
   * Alan seçimi yapar
   */
  public select(fields: Array<ExtractFields<T>>): this {
    this.config.select = fields;
    fields.forEach(field => this.selectedFields.add(field));
    return this;
  }

  /**
   * Sıralama ekler
   */
  public orderBy(field: ExtractFields<T>, direction: 'asc' | 'desc' = 'asc'): this {
    if (!this.config.orderBy) {
      this.config.orderBy = [];
    }

    this.config.orderBy.push({
      field,
      direction,
    });

    return this;
  }

  /**
   * Limit ekler
   */
  public limit(count: number): this {
    if (!this.config.pagination) {
      this.config.pagination = {};
    }
    this.config.pagination.limit = count;
    return this;
  }

  /**
   * Offset ekler
   */
  public offset(count: number): this {
    if (!this.config.pagination) {
      this.config.pagination = {};
    }
    this.config.pagination.offset = count;
    return this;
  }

  /**
   * Dil seçer
   */
  public locale(code: string): this {
    this.hasLocaleSet = true;
    if (!this.config.options) {
      this.config.options = {};
    }
    this.config.options.locale = code;
    return this;
  }

  /**
   * Önbellek süresini ayarlar
   */
  public cache(ttl?: number): this {
    if (!this.config.options) {
      this.config.options = {};
    }
    this.config.options.cache = true;
    this.config.options.ttl = ttl;
    return this;
  }

  /**
   * Önbelleği devre dışı bırakır
   */
  public noCache(): this {
    if (!this.config.options) {
      this.config.options = {};
    }
    this.config.options.cache = false;
    return this;
  }

  /**
   * Önbelleği atlar
   */
  public bypassCache(): this {
    if (!this.config.options) {
      this.config.options = {};
    }
    this.config.options.bypassCache = true;
    return this;
  }

  /**
   * Sorguyu çalıştırır
   */
  public async get(): Promise<QueryResult<T>> {
    try {
      // Önce translations'ın yüklenmesini bekle
      await this.initTranslationsPromise;

      // Lokalize edilmiş tablo için locale kontrolü
      if (this.hasTranslations && !this.hasLocaleSet) {
        this.locale(this.defaultLocale);
      }

      const query = await this.buildQuery();
      const countQuery = await this.buildCountQuery();

      const [data, totalResult] = await Promise.all([
        this.db.all<T>(query.sql, query.params),
        this.db.get<{ total: number }>(countQuery.sql, countQuery.params),
      ]);

      const total = totalResult?.total ?? 0;
      const result: QueryResult<T> = {
        data: this.transformResult(data),
        total,
      };

      if (this.config.pagination) {
        result.pagination = {
          limit: this.config.pagination.limit ?? 0,
          offset: this.config.pagination.offset ?? 0,
          hasMore: (this.config.pagination.offset ?? 0) + (this.config.pagination.limit ?? 0) < total,
        };
      }

      if (this.config.include) {
        await this.loadRelations(result.data);
      }

      return result;
    }
    catch (error) {
      throw new ValidationError({
        code: ErrorCode.QUERY_EXECUTION_FAILED,
        message: 'Query execution failed',
        details: { modelId: this.tableName },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Sonuçları dönüştürür
   */
  private transformResult(data: T[]): T[] {
    return data.map((item) => {
      const result = { ...item };

      // Seçili alanları kontrol et
      if (this.selectedFields.size > 0) {
        for (const key in result) {
          if (!this.selectedFields.has(key as unknown as ExtractFields<T>)) {
            delete result[key as keyof T];
          }
        }
      }

      // İlişkileri başlat
      this.includedRelations.forEach((relation) => {
        if (!(relation in result)) {
          result[relation] = null as any;
        }
      });

      return result;
    });
  }

  /**
   * Tek kayıt getirir
   */
  public async first(): Promise<T | null> {
    this.limit(1);
    const result = await this.get();
    return result.data[0] ?? null;
  }

  /**
   * Kayıt sayısını getirir
   */
  public async count(): Promise<number> {
    try {
      // Önce translations'ın yüklenmesini bekle
      await this.initTranslationsPromise;

      // Lokalize edilmiş tablo için locale kontrolü
      if (this.hasTranslations && !this.hasLocaleSet) {
        this.locale(this.defaultLocale);
      }

      const query = await this.buildCountQuery();
      const result = await this.db.get<{ total: number }>(query.sql, query.params);
      return result?.total ?? 0;
    }
    catch (error) {
      throw new ValidationError({
        code: ErrorCode.QUERY_EXECUTION_FAILED,
        message: 'Count query execution failed',
        details: { modelId: this.tableName },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Gets available locales
   */
  private async getAvailableLocales(): Promise<string[]> {
    try {
      const translationTable = `${this.tableName}_translations`;
      const result = await this.db.all<{ locale: string }>(
        `SELECT DISTINCT locale FROM ${translationTable} ORDER BY locale ASC`,
      );
      return result.map(row => row.locale);
    }
    catch {
      return [];
    }
  }

  /**
   * SQL sorgusunu oluşturur
   */
  private async buildQuery(): Promise<{ sql: string, params: Record<string, unknown> }> {
    const params: Record<string, unknown> = {};
    const parts: string[] = [];

    // Çevirisi olan tablolar için çeviri kontrolü
    if (this.hasTranslations) {
      // Çeviri alanlarına erişmeye çalışıyor ama locale ayarlanmamış
      const hasTranslationFields = this.config.select?.some(field =>
        !['id', 'created_at', 'updated_at', 'status'].includes(String(field)))
      || this.config.where?.some(where =>
        !['id', 'created_at', 'updated_at', 'status'].includes(String(where.field)));

      if (hasTranslationFields && !this.hasLocaleSet) {
        const availableLocales = await this.getAvailableLocales();
        throw new ValidationError({
          code: ErrorCode.LOCALE_REQUIRED,
          message: 'This table has translation support. You need to use .locale() method to access translation fields.',
          details: {
            tableName: this.tableName,
            availableLocales,
            example: `queryBuilder.locale('${JSON.stringify(availableLocales)}')`,
            note: 'Translation fields are only accessible when a locale is set.',
          },
        });
      }
    }

    // Çevirisi olan tablolar için JOIN yapısı
    if (this.hasTranslations && this.hasLocaleSet) {
      const translationTable = `${this.tableName}_translations`;

      // Çeviri tablosunun varlığını tekrar kontrol et
      const hasTranslationTable = await this.checkTranslationTable();

      if (!hasTranslationTable) {
        // Çeviri tablosu yoksa normal sorgu yap
        const fields = this.config.select?.length ? this.config.select.map(String) : ['*'];
        parts.push(`SELECT ${fields.join(', ')} FROM ${this.tableName}`);
      }
      else {
        const locale = this.config.options?.locale;

        // Ana tablo ve çeviri tablosu için alias'lar
        const mainAlias = 'm';
        const translationAlias = 't';

        // SELECT kısmını güncelle
        let selectFields: string[];
        if (this.config.select?.length) {
          // Seçili alanları ana tablo ve çeviri tablosuna göre ayır
          selectFields = this.config.select.map((field) => {
            const fieldStr = String(field);
            // Sistem alanları ana tablodan
            if (['id', 'created_at', 'updated_at', 'status'].includes(fieldStr)) {
              return `${mainAlias}.${fieldStr}`;
            }
            // Diğer alanlar çeviri tablosundan
            return `${translationAlias}.${fieldStr}`;
          });
        }
        else {
          // Tüm alanları seç
          selectFields = [
            // Sistem alanları
            `${mainAlias}.id`,
            `${mainAlias}.created_at`,
            `${mainAlias}.updated_at`,
            `${mainAlias}.status`,
            // Çeviri tablosundan tüm alanlar (id ve locale hariç)
            `${translationAlias}.*`,
          ];
        }

        parts.push(`SELECT ${selectFields.join(', ')} FROM ${this.tableName} ${mainAlias}`);
        parts.push(`JOIN ${translationTable} ${translationAlias} ON ${mainAlias}.id = ${translationAlias}.id AND ${translationAlias}.locale = @locale`);
        params.locale = locale;
      }
    }
    else {
      // Normal tablo için standart sorgu
      const fields = this.config.select?.length ? this.config.select.map(String) : ['*'];
      parts.push(`SELECT ${fields.join(', ')} FROM ${this.tableName}`);
    }

    // WHERE koşulları
    if (this.config.where?.length) {
      const conditions = this.buildWhereConditions(params);
      if (conditions) {
        parts.push(`WHERE ${conditions}`);
      }
    }

    // ORDER BY
    if (this.config.orderBy?.length) {
      const orderBy = this.config.orderBy
        .map(({ field, direction }) => {
          let fieldName = String(field);

          // Çevirisi olan tablolarda alias ekle
          if (this.hasTranslations && this.hasLocaleSet) {
            const isSystemField = ['id', 'created_at', 'updated_at', 'status'].includes(fieldName);
            fieldName = `${isSystemField ? 'm' : 't'}.${fieldName}`;
          }

          return `${fieldName} ${direction.toUpperCase()}`;
        })
        .join(', ');
      parts.push(`ORDER BY ${orderBy}`);
    }

    // LIMIT & OFFSET
    if (this.config.pagination) {
      if (this.config.pagination.limit) {
        parts.push('LIMIT @limit');
        params.limit = this.config.pagination.limit;
      }
      if (this.config.pagination.offset) {
        parts.push('OFFSET @offset');
        params.offset = this.config.pagination.offset;
      }
    }

    return {
      sql: parts.join(' '),
      params,
    };
  }

  /**
   * Toplam kayıt sayısı sorgusunu oluşturur
   */
  private async buildCountQuery(): Promise<{ sql: string, params: Record<string, unknown> }> {
    const params: Record<string, unknown> = {};
    const parts: string[] = [];

    // Çevirisi olan tablolar için çeviri kontrolü
    if (this.hasTranslations) {
      // Çeviri alanlarına erişmeye çalışıyor ama locale ayarlanmamış
      const hasTranslationFields = this.config.where?.some(where =>
        !['id', 'created_at', 'updated_at', 'status'].includes(String(where.field)));

      if (hasTranslationFields && !this.hasLocaleSet) {
        const availableLocales = await this.getAvailableLocales();
        throw new ValidationError({
          code: ErrorCode.LOCALE_REQUIRED,
          message: 'This table has translation support. You need to use .locale() method to access translation fields.',
          details: {
            tableName: this.tableName,
            availableLocales,
            example: `queryBuilder.locale('${availableLocales[0] || 'en'}')`,
            note: 'Translation fields are only accessible when a locale is set.',
          },
        });
      }
    }

    if (this.hasTranslations && this.hasLocaleSet) {
      const translationTable = `${this.tableName}_translations`;
      const locale = this.config.options?.locale || this.defaultLocale;

      parts.push(`SELECT COUNT(DISTINCT m.id) as total FROM ${this.tableName} m`);
      parts.push(`JOIN ${translationTable} t ON m.id = t.id AND t.locale = @locale`);
      params.locale = locale;
    }
    else {
      parts.push(`SELECT COUNT(*) as total FROM ${this.tableName}`);
    }

    if (this.config.where?.length) {
      const conditions = this.buildWhereConditions(params);
      if (conditions) {
        parts.push(`WHERE ${conditions}`);
      }
    }

    return {
      sql: parts.join(' '),
      params,
    };
  }

  /**
   * WHERE koşullarını oluşturur
   */
  private buildWhereConditions(params: Record<string, unknown>): string {
    return this.config.where!
      .map(({ field, operator, value }, index) => {
        const paramName = `p${index}`;

        // Array operatörleri için özel işlem
        if (operator === 'in' || operator === 'nin') {
          const values = Array.isArray(value) ? value : [value];
          values.forEach((val, i) => {
            params[`${paramName}_${i}`] = val;
          });
        }
        else {
          params[paramName] = value;
        }

        // Alan adını hazırla
        const isSystemField = ['id', 'created_at', 'updated_at', 'status'].includes(String(field));
        const fieldName = this.hasTranslations && this.hasLocaleSet
          ? `${isSystemField ? 'm' : 't'}.${String(field)}`
          : String(field);

        // Operatör işleme
        switch (operator) {
          case 'eq':
            return `${fieldName} = @${paramName}`;
          case 'ne':
            return `${fieldName} != @${paramName}`;
          case 'gt':
            return `${fieldName} > @${paramName}`;
          case 'gte':
            return `${fieldName} >= @${paramName}`;
          case 'lt':
            return `${fieldName} < @${paramName}`;
          case 'lte':
            return `${fieldName} <= @${paramName}`;
          case 'contains':
            params[paramName] = `%${String(value)}%`;
            return `${fieldName} LIKE @${paramName}`;
          case 'startsWith':
            params[paramName] = `${String(value)}%`;
            return `${fieldName} LIKE @${paramName}`;
          case 'endsWith':
            params[paramName] = `%${String(value)}`;
            return `${fieldName} LIKE @${paramName}`;
          case 'in': {
            const values = Array.isArray(value) ? value : [value];
            return `${fieldName} IN (${values.map((_, i) => `@${paramName}_${i}`).join(', ')})`;
          }
          case 'nin': {
            const values = Array.isArray(value) ? value : [value];
            return `${fieldName} NOT IN (${values.map((_, i) => `@${paramName}_${i}`).join(', ')})`;
          }
          default:
            throw new ValidationError({
              code: ErrorCode.INVALID_OPERATOR,
              message: 'Invalid operator',
              details: { operator },
            });
        }
      })
      .join(' AND ');
  }

  /**
   * İlişkili verileri yükler
   */
  private async loadRelations(items: T[]): Promise<void> {
    if (!this.config.include)
      return;

    const include = this.config.include as Required<IncludeClause<T>>;
    for (const [relationField, config] of Object.entries(include)) {
      if (!config)
        continue;

      // İlişki ID'lerini topla
      const relationIds = new Set<string>();
      const relationIdField = `${this.fieldNormalizer.normalize(relationField)}_id`;

      for (const item of items) {
        const relationId = item[relationIdField as keyof T];
        if (typeof relationId === 'string') {
          relationIds.add(relationId);
        }
        else if (Array.isArray(relationId)) {
          relationId.forEach(id => relationIds.add(id));
        }
      }

      if (relationIds.size === 0)
        continue;

      // İlişkili verileri getir
      const fields = (config as RelationConfig<BaseQueryModel>).select ?? ['*'];
      const targetModelId = this.getTargetModelId(relationField);
      const relationTableName = this.fieldNormalizer.normalizeTableName(targetModelId);

      const builder = new QueryBuilder<BaseQueryModel>(this.db, relationTableName as TableName<TTable>);

      // ID'lere göre filtrele
      const ids = Array.from(relationIds);
      builder.where('id', 'in' as const, ids);

      if (fields.length > 0) {
        builder.select(fields as Array<ExtractFields<BaseQueryModel>>);
      }

      if ((config as RelationConfig<BaseQueryModel>).include) {
        builder.include((config as RelationConfig<BaseQueryModel>).include as any);
      }

      if (this.config.options?.locale) {
        builder.locale(this.config.options.locale);
      }

      const relations = await builder.get();

      // İlişkili verileri ana veriye bağla
      for (const item of items) {
        const relationId = item[relationIdField as keyof T];
        if (typeof relationId === 'string') {
          const relatedItem = relations.data.find(r => r.id === relationId);
          if (relatedItem) {
            const relationKey = relationField as keyof T;
            item[relationKey] = relatedItem as any;
          }
        }
        else if (Array.isArray(relationId)) {
          const relatedItems = relations.data.filter(r => relationId.includes(r.id));
          if (relatedItems.length > 0) {
            const relationKey = relationField as keyof T;
            item[relationKey] = relatedItems as any;
          }
        }
      }
    }
  }

  private getTargetModelId(relationField: string): string {
    // İlişki alanından gerçek model ID'sini çıkar
    const normalized = this.fieldNormalizer.normalize(relationField);
    // İlişki tanımından hedef model bilgisini al
    return normalized.replace(/^my-/, '').replace(/-/g, '_');
  }
}
