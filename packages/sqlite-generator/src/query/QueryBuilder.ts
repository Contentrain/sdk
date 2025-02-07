import type { ContentItem } from '../types/content';
import type { Database } from '../types/database';
import type {
  BaseTranslation,
  QueryBuilder as IQueryBuilder,
  Operator,
  OperatorForType,
  QueryConfig,
  QueryResult,
  RelationConfig,
  ValueForOperator,
  WhereClause,
} from '../types/query';
import { FieldNormalizer } from '../normalizer/FieldNormalizer';
import { ErrorCode, ValidationError } from '../types/errors';

export class QueryBuilder<
  T extends ContentItem,
  TTranslation extends BaseTranslation = BaseTranslation,
  TRelations extends Record<string, RelationConfig<ContentItem>> = Record<string, never>,
> implements IQueryBuilder<T, TTranslation, TRelations> {
  private config: QueryConfig<T, TTranslation, TRelations> = {};
  private includedRelations: Set<keyof TRelations> = new Set();
  private selectedFields: Set<keyof (T & TTranslation)> = new Set();
  private hasLocaleSet = false;
  private readonly defaultLocale = 'en';
  private readonly fieldNormalizer: FieldNormalizer;
  private readonly tableName: string;
  private hasTranslations = false;
  private initTranslationsPromise: Promise<void>;

  constructor(
    private db: Database,
    modelId: string,
  ) {
    this.fieldNormalizer = new FieldNormalizer();
    this.tableName = `tbl_${modelId}`;
    this.initTranslationsPromise = this.initTranslations();
  }

  private async initTranslations(): Promise<void> {
    try {
      const translationTable = `${this.tableName}_translations`;
      const result = await this.db.get<{ name: string }>(
        'SELECT name FROM sqlite_master WHERE type = @type AND name = @name',
        { type: 'table', name: translationTable },
      );
      this.hasTranslations = result?.name === translationTable;
    }
    catch (error) {
      console.error('Failed to initialize translations:', error);
      this.hasTranslations = false;
    }
  }

  public where<K extends keyof (T & TTranslation)>(
    field: K,
    operator: Operator,
    value: ValueForOperator<(T & TTranslation)[K], Operator>,
  ): this {
    if (!this.config.where) {
      this.config.where = [];
    }

    this.config.where.push({
      field,
      operator,
      value,
    } as WhereClause<T & TTranslation, K>);

    return this;
  }

  public include<K extends keyof TRelations>(
    relation: K,
    options: RelationConfig<TRelations[K]['model']>,
  ): this {
    if (!this.config.include) {
      this.config.include = {};
    }

    this.config.include[relation] = options;
    this.includedRelations.add(relation);
    return this;
  }

  public select(fields: Array<keyof (T & TTranslation)>): this {
    this.config.select = fields;
    fields.forEach(field => this.selectedFields.add(field));
    return this;
  }

  public orderBy(field: keyof (T & TTranslation), direction: 'asc' | 'desc' = 'asc'): this {
    if (!this.config.orderBy) {
      this.config.orderBy = [];
    }

    this.config.orderBy.push({
      field,
      direction,
    });

    return this;
  }

  public limit(count: number): this {
    if (!this.config.pagination) {
      this.config.pagination = {};
    }
    this.config.pagination.limit = count;
    return this;
  }

  public offset(count: number): this {
    if (!this.config.pagination) {
      this.config.pagination = {};
    }
    this.config.pagination.offset = count;
    return this;
  }

  public locale(code: string): this {
    this.hasLocaleSet = true;
    if (!this.config.options) {
      this.config.options = {};
    }
    this.config.options.locale = code;
    return this;
  }

  public cache(ttl?: number): this {
    if (!this.config.options) {
      this.config.options = {};
    }
    this.config.options.cache = true;
    this.config.options.ttl = ttl;
    return this;
  }

  public noCache(): this {
    if (!this.config.options) {
      this.config.options = {};
    }
    this.config.options.cache = false;
    return this;
  }

  public bypassCache(): this {
    if (!this.config.options) {
      this.config.options = {};
    }
    this.config.options.bypassCache = true;
    return this;
  }

  public async get(): Promise<QueryResult<T & Partial<TRelations>>> {
    try {
      await this.initTranslationsPromise;

      if (this.hasTranslations && !this.hasLocaleSet) {
        this.locale(this.defaultLocale);
      }

      const query = await this.buildQuery();
      const countQuery = await this.buildCountQuery();

      const [data, totalResult] = await Promise.all([
        this.db.all<T & Partial<TRelations>>(query.sql, query.params),
        this.db.get<{ total: number }>(countQuery.sql, countQuery.params),
      ]);

      const total = totalResult?.total ?? 0;
      const result: QueryResult<T & Partial<TRelations>> = {
        data: await this.transformResult(data),
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

  public async first(): Promise<(T & Partial<TRelations>) | null> {
    this.limit(1);
    const result = await this.get();
    return result.data[0] ?? null;
  }

  public async count(): Promise<number> {
    try {
      await this.initTranslationsPromise;

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

  private async transformResult(data: (T & Partial<TRelations>)[]): Promise<(T & Partial<TRelations>)[]> {
    return data.map((item) => {
      const result = { ...item };

      if (this.selectedFields.size > 0) {
        for (const key in result) {
          if (!this.selectedFields.has(key as keyof (T & TTranslation))) {
            delete result[key];
          }
        }
      }

      return result;
    });
  }

  private async loadRelations(items: (T & Partial<TRelations>)[]): Promise<void> {
    if (!this.config.include || !items.length)
      return;

    for (const [relationField, options] of Object.entries(this.config.include)) {
      if (!options)
        continue;

      const relationInfo = await this.getRelationInfo(relationField);
      if (!relationInfo)
        continue;

      const targetIds = await this.getRelationTargetIds(items, relationField);
      if (!targetIds.length)
        continue;

      const relatedItems = await this.getRelatedItems(relationInfo.target_model, targetIds, options);
      await this.attachRelatedItems(items, relationField, relationInfo.type, relatedItems);
    }
  }

  private async getRelationInfo(relationField: string) {
    return this.db.get<{
      type: 'one-to-one' | 'one-to-many'
      target_model: string
    }>(
      `SELECT type, target_model FROM tbl_contentrain_relations
       WHERE source_model = @sourceModel
       AND field_id = @fieldId
       LIMIT 1`,
      {
        sourceModel: this.tableName.replace(/^tbl_/, ''),
        fieldId: relationField,
      },
    );
  }

  private async getRelationTargetIds(items: (T & Partial<TRelations>)[], relationField: string) {
    const result = await this.db.all<{ target_id: string }>(
      `SELECT target_id FROM tbl_contentrain_relations
       WHERE source_model = @sourceModel
       AND field_id = @fieldId
       AND source_id IN (${items.map((_, i) => `@id${i}`).join(', ')})`,
      {
        sourceModel: this.tableName.replace(/^tbl_/, ''),
        fieldId: relationField,
        ...items.reduce((acc, item, i) => ({ ...acc, [`id${i}`]: item.id }), {}),
      },
    );

    return result.map(r => r.target_id);
  }

  private async getRelatedItems<M extends ContentItem, MT extends BaseTranslation>(
    targetModel: string,
    targetIds: string[],
    options: RelationConfig<M>,
  ): Promise<M[]> {
    const builder = new QueryBuilder<M, MT>(this.db, targetModel.replace(/^tbl_/, ''));

    builder.where('id', 'in', targetIds);

    if (options.select?.length) {
      builder.select(options.select as Array<keyof (M & MT)>);
    }

    if (this.config.options?.locale) {
      builder.locale(this.config.options.locale);
    }

    const result = await builder.get();
    return result.data;
  }

  private async attachRelatedItems(
    items: (T & Partial<TRelations>)[],
    relationField: string,
    relationType: 'one-to-one' | 'one-to-many',
    relatedItems: any[],
  ) {
    for (const item of items) {
      const itemRelations = await this.db.all<{ target_id: string }>(
        `SELECT target_id FROM tbl_contentrain_relations
         WHERE source_model = @sourceModel
         AND field_id = @fieldId
         AND source_id = @sourceId`,
        {
          sourceModel: this.tableName.replace(/^tbl_/, ''),
          fieldId: relationField,
          sourceId: item.id,
        },
      );

      const related = relatedItems.filter(r =>
        itemRelations.some(ir => ir.target_id === r.id),
      );

      if (related.length > 0) {
        const relationKey = relationField as keyof (T & Partial<TRelations>);
        (item as any)[relationKey] = relationType === 'one-to-one' ? related[0] : related;
      }
    }
  }

  private async buildQuery(): Promise<{ sql: string, params: Record<string, unknown> }> {
    const params: Record<string, unknown> = {};
    const parts: string[] = [];

    if (this.hasTranslations) {
      const hasTranslationFields = this.hasTranslationFieldsInQuery();

      if (hasTranslationFields && !this.hasLocaleSet) {
        const availableLocales = await this.getAvailableLocales();
        throw new ValidationError({
          code: ErrorCode.LOCALE_REQUIRED,
          message: 'This table has translation support. You need to use .locale() method to access translation fields.',
          details: {
            tableName: this.tableName,
            availableLocales,
            example: `queryBuilder.locale('${availableLocales[0] || 'en'}')`,
          },
        });
      }

      if (this.hasLocaleSet) {
        await this.buildTranslationJoinQuery(parts, params);
      }
      else {
        this.buildSimpleQuery(parts);
      }
    }
    else {
      this.buildSimpleQuery(parts);
    }

    this.buildWhereClause(parts, params);
    this.buildOrderByClause(parts);
    this.buildPaginationClauses(parts, params);

    return {
      sql: parts.join(' '),
      params,
    };
  }

  private hasTranslationFieldsInQuery(): boolean {
    const systemFields = ['id', 'created_at', 'updated_at', 'status'];
    return !!(
      this.config.select?.some(field => !systemFields.includes(String(field)))
      || this.config.where?.some(where => !systemFields.includes(String(where.field)))
    );
  }

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

  private async buildTranslationJoinQuery(parts: string[], params: Record<string, unknown>): Promise<void> {
    const translationTable = `${this.tableName}_translations`;
    const mainAlias = 'm';
    const translationAlias = 't';

    let selectFields: string[];
    if (this.config.select?.length) {
      selectFields = this.config.select.map((field) => {
        const fieldStr = String(field);
        const isSystemField = ['id', 'created_at', 'updated_at', 'status'].includes(fieldStr);
        return isSystemField
          ? `${mainAlias}.${fieldStr}`
          : `${translationAlias}.${fieldStr}`;
      });
    }
    else {
      selectFields = [
        `${mainAlias}.id`,
        `${mainAlias}.created_at`,
        `${mainAlias}.updated_at`,
        `${mainAlias}.status`,
        `${translationAlias}.*`,
      ];
    }

    parts.push(`SELECT ${selectFields.join(', ')} FROM ${this.tableName} ${mainAlias}`);
    parts.push(`JOIN ${translationTable} ${translationAlias} ON ${mainAlias}.id = ${translationAlias}.id AND ${translationAlias}.locale = @locale`);
    params.locale = this.config.options?.locale;
  }

  private buildSimpleQuery(parts: string[]): void {
    const fields = this.config.select?.length ? this.config.select.map(String) : ['*'];
    parts.push(`SELECT ${fields.join(', ')} FROM ${this.tableName}`);
  }

  private buildWhereClause(parts: string[], params: Record<string, unknown>): void {
    if (!this.config.where?.length)
      return;

    const conditions = this.config.where
      .map(({ field, operator, value }, index) => {
        const paramName = `p${index}`;
        const isSystemField = ['id', 'created_at', 'updated_at', 'status'].includes(String(field));
        const fieldName = this.hasTranslations && this.hasLocaleSet
          ? `${isSystemField ? 'm' : 't'}.${String(field)}`
          : String(field);

        if (operator === 'in' || operator === 'nin') {
          const values = Array.isArray(value) ? value : [value];
          values.forEach((val, i) => {
            params[`${paramName}_${i}`] = val;
          });
          const placeholders = values.map((_, i) => `@${paramName}_${i}`).join(', ');
          return `${fieldName} ${operator === 'in' ? 'IN' : 'NOT IN'} (${placeholders})`;
        }

        params[paramName] = this.formatValue(operator, value);
        return this.buildOperatorCondition(fieldName, operator, paramName);
      })
      .join(' AND ');

    if (conditions) {
      parts.push(`WHERE ${conditions}`);
    }
  }

  private formatValue(operator: string, value: unknown): unknown {
    switch (operator) {
      case 'contains':
        return `%${String(value)}%`;
      case 'startsWith':
        return `${String(value)}%`;
      case 'endsWith':
        return `%${String(value)}`;
      default:
        return value;
    }
  }

  private buildOperatorCondition(field: string, operator: string, param: string): string {
    switch (operator) {
      case 'eq':
        return `${field} = @${param}`;
      case 'ne':
        return `${field} != @${param}`;
      case 'gt':
        return `${field} > @${param}`;
      case 'gte':
        return `${field} >= @${param}`;
      case 'lt':
        return `${field} < @${param}`;
      case 'lte':
        return `${field} <= @${param}`;
      case 'contains':
      case 'startsWith':
      case 'endsWith':
        return `${field} LIKE @${param}`;
      default:
        throw new ValidationError({
          code: ErrorCode.INVALID_OPERATOR,
          message: 'Invalid operator',
          details: { operator },
        });
    }
  }

  private buildOrderByClause(parts: string[]): void {
    if (!this.config.orderBy?.length)
      return;

    const orderBy = this.config.orderBy
      .map(({ field, direction }) => {
        let fieldName = String(field);
        if (this.hasTranslations && this.hasLocaleSet) {
          const isSystemField = ['id', 'created_at', 'updated_at', 'status'].includes(fieldName);
          fieldName = `${isSystemField ? 'm' : 't'}.${fieldName}`;
        }
        return `${fieldName} ${direction.toUpperCase()}`;
      })
      .join(', ');

    parts.push(`ORDER BY ${orderBy}`);
  }

  private buildPaginationClauses(parts: string[], params: Record<string, unknown>): void {
    if (this.config.pagination?.limit) {
      parts.push('LIMIT @limit');
      params.limit = this.config.pagination.limit;
    }

    if (this.config.pagination?.offset) {
      parts.push('OFFSET @offset');
      params.offset = this.config.pagination.offset;
    }
  }

  private async buildCountQuery(): Promise<{ sql: string, params: Record<string, unknown> }> {
    const params: Record<string, unknown> = {};
    const parts: string[] = [];

    if (this.hasTranslations && this.hasLocaleSet) {
      const translationTable = `${this.tableName}_translations`;
      parts.push(`SELECT COUNT(DISTINCT m.id) as total FROM ${this.tableName} m`);
      parts.push(`JOIN ${translationTable} t ON m.id = t.id AND t.locale = @locale`);
      params.locale = this.config.options?.locale || this.defaultLocale;
    }
    else {
      parts.push(`SELECT COUNT(*) as total FROM ${this.tableName}`);
    }

    this.buildWhereClause(parts, params);

    return {
      sql: parts.join(' '),
      params,
    };
  }
}
