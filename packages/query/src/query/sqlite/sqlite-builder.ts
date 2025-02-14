import type { IDBRecord } from '../../loader/types/sqlite';
import type { ISQLiteQuery, QueryCondition, QueryResult, QuerySort, SQLiteInclude, SQLiteOptions } from '../types';
import type { SQLiteQueryExecutor } from './sqlite-executor';
import { QueryBuilderError } from '../../errors';
import { loggers } from '../../utils/logger';

export class SQLiteQueryBuilder<TData extends IDBRecord> implements ISQLiteQuery<TData> {
  private readonly logger = loggers.query;
  private conditions: QueryCondition[] = [];
  private includes: SQLiteInclude = {};
  private sorting: QuerySort[] = [];
  private pagination: { limit?: number, offset?: number } = {};
  private queryOptions: SQLiteOptions = {};

  constructor(
    private readonly model: string,
    private readonly executor: SQLiteQueryExecutor<TData>,
  ) {
    this.logger.debug('Initializing SQLiteQueryBuilder', { model });
  }

  include(relations: string | string[]): this {
    try {
      const relationList = Array.isArray(relations) ? relations : [relations];
      relationList.forEach((relation) => {
        this.includes[relation] = {};
      });
      return this;
    }
    catch (error: any) {
      throw new QueryBuilderError('Failed to add relation', 'include', {
        relations,
        originalError: error?.message,
      });
    }
  }

  where(field: keyof TData, operator: QueryCondition['operator'], value: unknown): this {
    try {
      this.conditions.push({
        field: String(field),
        operator,
        value,
      });
      return this;
    }
    catch (error: any) {
      throw new QueryBuilderError('Failed to add condition', 'filter', {
        field: String(field),
        operator,
        value,
        originalError: error?.message,
      });
    }
  }

  orderBy(field: keyof TData, direction: 'asc' | 'desc' = 'asc'): this {
    try {
      this.sorting.push({
        field: String(field),
        direction,
      });
      return this;
    }
    catch (error: any) {
      throw new QueryBuilderError('Failed to add sort', 'sort', {
        field: String(field),
        direction,
        originalError: error?.message,
      });
    }
  }

  limit(count: number): this {
    if (count < 0) {
      throw new QueryBuilderError('Limit cannot be negative', 'validate', { count });
    }
    this.pagination.limit = count;
    return this;
  }

  offset(count: number): this {
    if (count < 0) {
      throw new QueryBuilderError('Offset cannot be negative', 'validate', { count });
    }
    this.pagination.offset = count;
    return this;
  }

  locale(code: string, translations: boolean = true): this {
    this.queryOptions.locale = code;
    this.queryOptions.translations = translations;
    return this;
  }

  async get(): Promise<QueryResult<TData>> {
    return this.executor.execute({
      model: this.model,
      filters: this.conditions,
      sorting: this.sorting,
      pagination: this.pagination,
      options: this.queryOptions,
    });
  }

  async first(): Promise<TData | null> {
    const result = await this.limit(1).get();
    return result.data[0] || null;
  }

  async count(): Promise<number> {
    const result = await this.get();
    return result.total;
  }
}
