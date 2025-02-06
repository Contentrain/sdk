import type { ContentItem } from '../types/content';
import type { Database } from '../types/database';
import type {
  IncludeClause,
  QueryBuilder as IQueryBuilder,
  OperatorForType,
  PaginationOptions,
  QueryConfig,
  QueryOptions,
  QueryResult,
  RelationOptions,
} from '../types/query';
import { FieldNormalizer } from '../normalizer/FieldNormalizer';
import { ErrorCode, ValidationError } from '../types/errors';

export class QueryBuilder<T extends ContentItem> implements IQueryBuilder<T> {
  private config: QueryConfig<T> = {};
  private fieldNormalizer: FieldNormalizer;

  constructor(
    private db: Database,
    private modelId: string,
  ) {
    this.fieldNormalizer = new FieldNormalizer();
  }

  /**
   * Filtre ekler
   */
  public where<K extends keyof T>(
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
  public include<K extends keyof T>(
    relations: K | K[],
    options?: RelationOptions<T[K]>,
  ): this {
    if (!this.config.include) {
      this.config.include = {};
    }

    const relationArray = Array.isArray(relations) ? relations : [relations];
    for (const relation of relationArray) {
      if (options) {
        this.config.include[relation] = options;
      }
    }

    return this;
  }

  /**
   * Sıralama ekler
   */
  public orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
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
      const query = this.buildQuery();
      const countQuery = this.buildCountQuery();

      const [data, totalResult] = await Promise.all([
        this.db.all<T>(query.sql, query.params),
        this.db.get<{ total: number }>(countQuery.sql, countQuery.params),
      ]);

      const total = totalResult?.total ?? 0;
      const result: QueryResult<T> = { data, total };

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
        details: { modelId: this.modelId },
        cause: error instanceof Error ? error : undefined,
      });
    }
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
    const query = this.buildCountQuery();
    const result = await this.db.get<{ total: number }>(query.sql, query.params);
    return result?.total ?? 0;
  }

  /**
   * SQL sorgusunu oluşturur
   */
  private buildQuery(): { sql: string, params: Record<string, unknown> } {
    const tableName = this.fieldNormalizer.normalizeTableName(this.modelId);
    const params: Record<string, unknown> = {};
    const parts: string[] = [];

    // SELECT
    const fields = this.config.select?.length
      ? this.config.select.map(f => this.fieldNormalizer.normalize(f as string))
      : ['*'];
    parts.push(`SELECT ${fields.join(', ')} FROM ${tableName}`);

    // WHERE
    if (this.config.where?.length) {
      const conditions = this.buildWhereConditions(params);
      if (conditions) {
        parts.push(`WHERE ${conditions}`);
      }
    }

    // ORDER BY
    if (this.config.orderBy?.length) {
      const orderBy = this.config.orderBy
        .map(({ field, direction }) => `${this.fieldNormalizer.normalize(field as string)} ${direction.toUpperCase()}`)
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
  private buildCountQuery(): { sql: string, params: Record<string, unknown> } {
    const tableName = this.fieldNormalizer.normalizeTableName(this.modelId);
    const params: Record<string, unknown> = {};
    const parts: string[] = [];

    parts.push(`SELECT COUNT(*) as total FROM ${tableName}`);

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
        const fieldName = this.fieldNormalizer.normalize(field as string);
        const paramName = `p${index}`;
        params[paramName] = value;

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
          case 'in':
            return `${fieldName} IN (${(value as unknown[]).map((_, i) => `@${paramName}_${i}`).join(', ')})`;
          case 'nin':
            return `${fieldName} NOT IN (${(value as unknown[]).map((_, i) => `@${paramName}_${i}`).join(', ')})`;
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
    for (const [relation, config] of Object.entries(this.config.include!)) {
      // İlişki ID'lerini topla
      const relationIds = new Set<string>();
      for (const item of items) {
        const relationId = item[`${relation}_id` as keyof T];
        if (typeof relationId === 'string') {
          relationIds.add(relationId);
        }
      }

      if (relationIds.size === 0) {
        continue;
      }

      // İlişkili verileri getir
      const fields = config?.select ?? ['*'];
      const builder = new QueryBuilder<ContentItem>(this.db, relation);

      // ID'lere göre filtrele
      const ids = Array.from(relationIds);
      builder.where('id', 'in' as OperatorForType<string[]>, ids);

      if (fields.length > 0) {
        builder.select(fields as Array<keyof ContentItem>);
      }

      if (config?.include) {
        builder.include(config.include);
      }

      if (this.config.options?.locale) {
        builder.locale(this.config.options.locale);
      }

      const relations = await builder.get();

      // İlişkili verileri ana veriye bağla
      for (const item of items) {
        const relationId = item[`${relation}_id` as keyof T];
        if (typeof relationId === 'string') {
          (item as any)[relation] = relations.data.find(r => r.id === relationId);
        }
      }
    }
  }

  /**
   * Seçilecek alanları belirler
   */
  public select(fields: Array<keyof T>): this {
    this.config.select = fields;
    return this;
  }
}
