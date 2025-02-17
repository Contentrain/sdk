import type { IDBRecord } from '../../loader/types/sqlite';
import type { ISQLiteQuery, SQLiteOptions } from '../types';
import type { SQLiteQueryExecutor } from './sqlite-executor';
import { QueryBuilderError } from '../../errors';
import { loggers } from '../../utils/logger';
import { BaseQueryBuilder } from '../base/base-builder';

const logger = loggers.query;

export class SQLiteQueryBuilder<TData extends IDBRecord> extends BaseQueryBuilder<TData> implements ISQLiteQuery<TData> {
  protected options: SQLiteOptions = {};

  constructor(
    model: string,
    private readonly executor: SQLiteQueryExecutor<TData>,
  ) {
    super(model);
  }

  include(relations: string | string[]): this {
    try {
      this.options.includes = Array.isArray(relations) ? relations : [relations];
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
