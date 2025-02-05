import type { ContentItem } from '../types/content';
import type { Database } from '../types/database';
import type { Filter, Include, Operator, Pagination, QueryOptions, QueryResult, Sort } from '../types/query';
import { FieldNormalizer } from '../normalizer/FieldNormalizer';
import { ErrorCode, ValidationError } from '../types/errors';

export class QueryBuilder {
  private fieldNormalizer: FieldNormalizer;
  private filters: Filter[] = [];
  private sorts: Sort[] = [];
  private includes: Include = {};
  private selectedFields: string[] = [];
  private pagination?: Pagination;
  private options: QueryOptions = {};

  constructor(
    private db: Database,
    private modelId: string,
  ) {
    this.fieldNormalizer = new FieldNormalizer();
  }

  /**
   * Filtre ekler
   */
  public where(filter: Filter): this {
    this.filters.push(filter);
    return this;
  }

  /**
   * Sıralama ekler
   */
  public orderBy(sort: Sort): this {
    this.sorts.push(sort);
    return this;
  }

  /**
   * İlişkileri ekler
   */
  public include(includes: Include): this {
    this.includes = includes;
    return this;
  }

  /**
   * Seçilecek alanları belirler
   */
  public select(fields: string[]): this {
    this.selectedFields = fields;
    return this;
  }

  /**
   * Sayfalama ekler
   */
  public paginate(pagination: Pagination): this {
    this.pagination = pagination;
    return this;
  }

  /**
   * Sorgu seçeneklerini ayarlar
   */
  public setOptions(options: QueryOptions): this {
    this.options = options;
    return this;
  }

  /**
   * Sorguyu çalıştırır
   */
  public async execute<T extends ContentItem = ContentItem>(): Promise<QueryResult<T>> {
    try {
      const query = this.buildQuery();
      const countQuery = this.buildCountQuery();

      const [data, totalResult] = await Promise.all([
        this.db.all<T>(query.sql, query.params),
        this.db.get<{ total: number }>(countQuery.sql, countQuery.params),
      ]);

      const total = totalResult?.total ?? 0;
      const result: QueryResult<T> = { data, total };

      if (this.pagination) {
        result.pagination = {
          limit: this.pagination.limit ?? 0,
          offset: this.pagination.offset ?? 0,
          hasMore: (this.pagination.offset ?? 0) + (this.pagination.limit ?? 0) < total,
        };
      }

      if (Object.keys(this.includes).length > 0) {
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
   * SQL sorgusunu oluşturur
   */
  private buildQuery(): { sql: string, params: Record<string, unknown> } {
    const tableName = this.fieldNormalizer.normalizeTableName(this.modelId);
    const params: Record<string, unknown> = {};
    const parts: string[] = [];

    // SELECT
    const fields = this.selectedFields.length > 0
      ? this.selectedFields.map(f => this.fieldNormalizer.normalize(f))
      : ['*'];
    parts.push(`SELECT ${fields.join(', ')} FROM ${tableName}`);

    // WHERE
    if (this.filters.length > 0) {
      const conditions = this.buildWhereConditions(params);
      if (conditions) {
        parts.push(`WHERE ${conditions}`);
      }
    }

    // ORDER BY
    if (this.sorts.length > 0) {
      const orderBy = this.sorts
        .map(s => `${this.fieldNormalizer.normalize(s.field)} ${s.direction.toUpperCase()}`)
        .join(', ');
      parts.push(`ORDER BY ${orderBy}`);
    }

    // LIMIT & OFFSET
    if (this.pagination) {
      if (this.pagination.limit) {
        parts.push('LIMIT @limit');
        params.limit = this.pagination.limit;
      }
      if (this.pagination.offset) {
        parts.push('OFFSET @offset');
        params.offset = this.pagination.offset;
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

    if (this.filters.length > 0) {
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
    return this.filters
      .map((filter, index) => {
        const field = this.fieldNormalizer.normalize(filter.field);
        const paramName = `p${index}`;
        params[paramName] = filter.value;

        switch (filter.operator) {
          case 'eq':
            return `${field} = @${paramName}`;
          case 'ne':
            return `${field} != @${paramName}`;
          case 'gt':
            return `${field} > @${paramName}`;
          case 'gte':
            return `${field} >= @${paramName}`;
          case 'lt':
            return `${field} < @${paramName}`;
          case 'lte':
            return `${field} <= @${paramName}`;
          case 'contains':
            params[paramName] = `%${filter.value}%`;
            return `${field} LIKE @${paramName}`;
          case 'startsWith':
            params[paramName] = `${filter.value}%`;
            return `${field} LIKE @${paramName}`;
          case 'endsWith':
            params[paramName] = `%${filter.value}`;
            return `${field} LIKE @${paramName}`;
          case 'in':
            return `${field} IN (${(filter.value as unknown[]).map((_, i) => `@${paramName}_${i}`).join(', ')})`;
          case 'nin':
            return `${field} NOT IN (${(filter.value as unknown[]).map((_, i) => `@${paramName}_${i}`).join(', ')})`;
          default:
            throw new ValidationError({
              code: ErrorCode.INVALID_OPERATOR,
              message: 'Invalid operator',
              details: { operator: filter.operator },
            });
        }
      })
      .join(' AND ');
  }

  /**
   * İlişkili verileri yükler
   */
  private async loadRelations<T extends ContentItem>(items: T[]): Promise<void> {
    for (const [relation, config] of Object.entries(this.includes)) {
      const ids = items.map((item) => {
        const relationId = item[`${relation}_id` as keyof T];
        return typeof relationId === 'string' ? relationId : null;
      }).filter(Boolean);

      if (ids.length === 0)
        continue;

      const fields = config.fields ?? ['*'];
      const builder = new QueryBuilder(this.db, relation)
        .select(fields)
        .where({ field: 'id', operator: 'in', value: ids });

      if (config.include) {
        builder.include(config.include);
      }

      if (this.options.locale) {
        builder.setOptions({ locale: this.options.locale });
      }

      const relations = await builder.execute();

      // İlişkili verileri ana veriye bağla
      for (const item of items) {
        const relationId = item[`${relation}_id` as keyof T];
        if (typeof relationId === 'string') {
          (item as any)[relation] = relations.data.find(r => r.id === relationId);
        }
      }
    }
  }
}
