import type { Filter, IBaseQueryBuilder, Include, Operator, Pagination, QueryOptions, QueryResult, Sort } from '../types';
import { QueryBuilderError } from '../../errors';
import { loggers } from '../../utils/logger';

const logger = loggers.query;

export abstract class BaseQueryBuilder<TData> implements IBaseQueryBuilder<TData> {
  protected filters: Filter[] = [];
  protected includes: Include = {};
  protected sorting: Sort[] = [];
  protected pagination: Pagination = {};
  protected options: QueryOptions = {};

  constructor(
    protected readonly model: string,
  ) {
  }

  abstract where(field: keyof TData, operator: Operator, value: any): this;
  abstract include(relations: string | string[]): this;
  abstract orderBy(field: keyof TData, direction?: 'asc' | 'desc'): this;
  abstract limit(count: number): this;
  abstract offset(count: number): this;
  abstract locale(code: string): this;
  abstract get(): Promise<QueryResult<TData>>;
  abstract first(): Promise<TData | null>;
  abstract count(): Promise<number>;

  cache(ttl?: number): this {
    try {
      this.options.cache = true;
      if (ttl)
        this.options.ttl = ttl;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to set cache', {
        ttl,
        error: error?.message,
        errorCode: error?.code,
      });

      throw new QueryBuilderError(
        'Failed to set cache',
        'cache',
        {
          ttl,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  noCache(): this {
    try {
      this.options.cache = false;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to disable cache', {
        error: error?.message,
        errorCode: error?.code,
      });

      throw new QueryBuilderError(
        'Failed to disable cache',
        'cache',
        {
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  bypassCache(): this {
    try {
      this.options.cache = false;
      this.options.ttl = 0;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to bypass cache', {
        error: error?.message,
        errorCode: error?.code,
      });

      throw new QueryBuilderError(
        'Failed to bypass cache',
        'cache',
        {
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  toJSON() {
    try {
      const result = {
        model: this.model,
        filters: this.filters,
        includes: this.includes,
        sorting: this.sorting,
        pagination: this.pagination,
        options: this.options,
      };
      return result;
    }
    catch (error: any) {
      logger.error('Failed to convert query to JSON', {
        model: this.model,
        error: error?.message,
        errorCode: error?.code,
      });

      throw new QueryBuilderError(
        'Failed to convert query to JSON',
        'serialize',
        {
          model: this.model,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }
}
