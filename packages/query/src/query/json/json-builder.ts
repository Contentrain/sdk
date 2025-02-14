import type { JSONLoader } from '../../loader/json/json.loader';
import type { IBaseJSONRecord } from '../../loader/types/json';
import type { Operator, QueryResult } from '../types';
import { QueryBuilderError } from '../../errors';
import { loggers } from '../../utils/logger';
import { BaseQueryBuilder } from '../base/base-builder';
import { JSONQueryExecutor } from './json-executor';

const logger = loggers.query;

export class JSONQueryBuilder<TData extends IBaseJSONRecord> extends BaseQueryBuilder<TData> {
  private readonly executor: JSONQueryExecutor<TData>;

  constructor(
    model: string,
    loader: JSONLoader<TData>,
  ) {
    super(model);
    logger.debug('Initializing JSONQueryBuilder', {
      model,
      operation: 'initialize',
    });

    try {
      this.executor = new JSONQueryExecutor<TData>(loader);
      logger.info('Query builder initialized successfully');
    }
    catch (error: any) {
      logger.error('Failed to initialize query builder', {
        model,
        error: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  }

  where(field: keyof TData, operator: Operator, value: any): this {
    try {
      logger.debug('Adding filter', {
        field: String(field),
        operator,
        value,
      });

      this.validateField(field);
      this.validateOperator(operator);
      this.filters.push({ field: String(field), operator, value });

      return this;
    }
    catch (error: any) {
      logger.error('Failed to add filter', {
        field: String(field),
        operator,
        value,
        error: error?.message,
      });
      throw error;
    }
  }

  include(relations: string | string[]): this {
    try {
      logger.debug('Adding relation', {
        relation: typeof relations === 'string' ? { name: relations } : { names: relations },
        operation: 'include',
      });

      if (typeof relations === 'string') {
        this.includes[relations] = {};
      }
      else {
        relations.forEach((r) => {
          this.includes[r] = {};
        });
      }
      return this;
    }
    catch (error: any) {
      logger.error('Failed to add relation', {
        relations,
        error: error?.message,
        errorCode: error?.code,
      });

      throw new QueryBuilderError(
        'Failed to add relation',
        'include',
        {
          relations,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  orderBy(field: keyof TData, direction: 'asc' | 'desc' = 'asc'): this {
    try {
      logger.debug('Adding sort', {
        field: String(field),
        direction,
      });

      this.validateField(field);
      this.sorting.push({ field: String(field), direction });

      return this;
    }
    catch (error: any) {
      logger.error('Failed to add sort', {
        field: String(field),
        direction,
        error: error?.message,
      });
      throw error;
    }
  }

  limit(count: number): this {
    try {
      logger.debug('Setting limit', { count });

      if (count < 0) {
        throw new QueryBuilderError(
          'Limit cannot be negative',
          'validate',
          { count },
        );
      }

      this.pagination.limit = count;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to set limit', {
        count,
        error: error?.message,
      });
      throw error;
    }
  }

  offset(count: number): this {
    try {
      logger.debug('Setting offset', { count });

      if (count < 0) {
        throw new QueryBuilderError(
          'Offset cannot be negative',
          'validate',
          { count },
        );
      }

      this.pagination.offset = count;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to set offset', {
        count,
        error: error?.message,
      });
      throw error;
    }
  }

  locale(code: string): this {
    try {
      logger.debug('Setting locale', { code });

      if (!code) {
        throw new QueryBuilderError(
          'Locale code cannot be empty',
          'validate',
          { code },
        );
      }

      this.options.locale = code;
      return this;
    }
    catch (error: any) {
      logger.error('Failed to set locale', {
        code,
        error: error?.message,
      });
      throw error;
    }
  }

  private validateField(field: keyof TData): void {
    if (!field) {
      throw new QueryBuilderError(
        'Field cannot be empty',
        'validate',
        { field },
      );
    }

    if (typeof field !== 'string') {
      throw new QueryBuilderError(
        'Field must be a string',
        'validate',
        { field, type: typeof field },
      );
    }
  }

  private validateOperator(operator: Operator): void {
    if (typeof operator !== 'string') {
      throw new QueryBuilderError(
        'Operator must be a string',
        'validate',
        { operator, type: typeof operator },
      );
    }

    const validOperators = [
      'eq',
      'ne',
      'gt',
      'gte',
      'lt',
      'lte',
      'in',
      'nin',
      'contains',
      'startsWith',
      'endsWith',
    ];

    if (!validOperators.includes(operator)) {
      throw new QueryBuilderError(
        `Invalid operator: ${operator}`,
        'validate',
        { operator, validOperators },
      );
    }
  }

  async get(): Promise<QueryResult<TData>> {
    try {
      logger.debug('Executing query', {
        model: this.model,
        filters: this.filters,
        includes: this.includes,
        sorting: this.sorting,
        pagination: this.pagination,
        options: this.options,
      });

      const result = await this.executor.execute({
        model: this.model,
        filters: this.filters,
        includes: this.includes,
        sorting: this.sorting,
        pagination: this.pagination,
        options: this.options,
      });

      logger.debug('Query executed successfully', {
        model: this.model,
        resultCount: result.data.length,
        total: result.total,
      });

      return result;
    }
    catch (error: any) {
      logger.error('Failed to execute query', {
        model: this.model,
        error: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async first(): Promise<TData | null> {
    try {
      logger.debug('Getting first record', {
        model: this.model,
      });

      const result = await this.limit(1).get();
      return result.data[0] || null;
    }
    catch (error: any) {
      logger.error('Failed to get first record', {
        model: this.model,
        error: error?.message,
      });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      logger.debug('Getting record count', {
        model: this.model,
      });

      const result = await this.get();
      return result.total;
    }
    catch (error: any) {
      logger.error('Failed to get record count', {
        model: this.model,
        error: error?.message,
      });
      throw error;
    }
  }
}
