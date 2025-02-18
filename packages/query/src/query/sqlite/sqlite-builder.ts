import type { SQLiteLoader } from '../../loader/sqlite/sqlite.loader';
import type { IDBRecord } from '../../loader/types/sqlite';
import type { IncludeOptions, ISQLiteQuery, SQLiteOptions } from '../types';
import type { SQLiteQueryExecutor } from './sqlite-executor';
import { QueryBuilderError } from '../../errors';
import { loggers } from '../../utils/logger';
import { BaseQueryBuilder } from '../base/base-builder';

const logger = loggers.query;

export class SQLiteQueryBuilder<TData extends IDBRecord> extends BaseQueryBuilder<TData> implements ISQLiteQuery<TData> {
  protected options: SQLiteOptions = {};

  constructor(
    protected readonly model: string,
    protected readonly executor: SQLiteQueryExecutor<TData>,
  ) {
    super(model);
  }

  setLoader(loader: SQLiteLoader<TData>): this {
    this.executor.setLoader(loader);
    return this;
  }

  include(relations: string | string[] | IncludeOptions | IncludeOptions[]): this {
    try {
      if (typeof relations === 'string') {
        this.options.includes = [{ relation: relations }];
      }
      else if (Array.isArray(relations)) {
        this.options.includes = relations.map((relation) => {
          if (typeof relation === 'string') {
            return { relation };
          }
          return relation;
        });
      }
      else {
        this.options.includes = [relations];
      }
      return this;
    }
    catch (error: any) {
      logger.error('Failed to add relation', {
        relations,
        error: error?.message,
      });
      throw new QueryBuilderError('Failed to add relation', 'include', {
        relations,
        originalError: error?.message,
      });
    }
  }

  locale(code: string): this {
    try {
      this.options.locale = code;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to set locale', {
        code,
        error: error?.message,
      });
      throw new QueryBuilderError('Failed to set locale', 'localize', {
        code,
        originalError: error?.message,
      });
    }
  }

  orderBy(field: keyof TData, direction: 'asc' | 'desc' = 'asc'): this {
    try {
      this.sorting.push({ field: field as string, direction });
      return this;
    }
    catch (error: any) {
      logger.error('Failed to add sorting', {
        field,
        direction,
        error: error?.message,
      });
      throw new QueryBuilderError('Failed to add sorting', 'sort', {
        field,
        direction,
        originalError: error?.message,
      });
    }
  }

  limit(count: number): this {
    try {
      if (count < 0) {
        throw new Error('Limit count must be positive');
      }
      this.pagination.limit = count;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to set limit', {
        count,
        error: error?.message,
      });
      throw new QueryBuilderError('Failed to set limit', 'paginate', {
        count,
        originalError: error?.message,
      });
    }
  }

  offset(count: number): this {
    try {
      if (count < 0) {
        throw new Error('Offset count must be positive');
      }
      this.pagination.offset = count;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to set offset', {
        count,
        error: error?.message,
      });
      throw new QueryBuilderError('Failed to set offset', 'paginate', {
        count,
        originalError: error?.message,
      });
    }
  }

  async get() {
    try {
      return await this.executor.execute({
        model: this.model,
        filters: this.filters,
        sorting: this.sorting,
        pagination: this.pagination,
        options: this.options,
      });
    }
    catch (error: any) {
      logger.error('Failed to execute query', {
        model: this.model,
        error: error?.message,
      });
      throw new QueryBuilderError('Failed to execute query', 'execute', {
        model: this.model,
        originalError: error?.message,
      });
    }
  }

  async first() {
    try {
      const result = await this.limit(1).get();
      return result.data[0] || null;
    }
    catch (error: any) {
      logger.error('Failed to get first record', {
        model: this.model,
        error: error?.message,
      });
      throw new QueryBuilderError('Failed to get first record', 'query', {
        model: this.model,
        originalError: error?.message,
      });
    }
  }

  async count() {
    try {
      const result = await this.get();
      return result.total;
    }
    catch (error: any) {
      logger.error('Failed to get record count', {
        model: this.model,
        error: error?.message,
      });
      throw new QueryBuilderError('Failed to get record count', 'query', {
        model: this.model,
        originalError: error?.message,
      });
    }
  }
}
