import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter } from '../runtime/types';
import type {
  FilterOperator,
  OrderByCondition,
  PaginationOptions,
  QueryOptions,
  WhereCondition,
} from './types';
import { QueryError, QueryErrorCodes } from '../types';

export class QueryBuilder<T extends ContentrainBaseModel> {
  private runtime: RuntimeAdapter;
  private modelId: string = '';
  private whereConditions: WhereCondition[] = [];
  private orderByConditions: OrderByCondition[] = [];
  private pagination: PaginationOptions = {};
  private relations: string[] = [];
  private relationCounts: string[] = [];
  private options: QueryOptions;

  constructor(runtime: RuntimeAdapter, options: QueryOptions) {
    this.runtime = runtime;
    this.options = options;
  }

  from<K extends string>(model: K): QueryBuilder<T> {
    this.modelId = model;
    return this;
  }

  where(field: string, operator: FilterOperator, value: unknown): this {
    this.whereConditions.push({ field, operator, value });
    return this;
  }

  whereIn(field: string, values: unknown[]): this {
    this.whereConditions.push({ field, operator: 'in', value: values });
    return this;
  }

  whereLike(field: string, value: string): this {
    this.whereConditions.push({ field, operator: 'contains', value });
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc'): this {
    this.orderByConditions.push({ field, direction });
    return this;
  }

  take(limit: number): this {
    this.pagination.take = limit;
    return this;
  }

  skip(offset: number): this {
    this.pagination.skip = offset;
    return this;
  }

  paginate(page: number, perPage: number): this {
    this.pagination.skip = (page - 1) * perPage;
    this.pagination.take = perPage;
    return this;
  }

  with(relation: string): this {
    this.relations.push(relation);
    return this;
  }

  withCount(relation: string): this {
    this.relationCounts.push(relation);
    return this;
  }

  private async loadModelWithFallback<T extends ContentrainBaseModel>(
    modelId: string,
  ): Promise<T[]> {
    try {
      const result = await this.runtime.loadModel<T>(modelId, {
        locale: this.options.locale,
        namespace: this.options.namespace,
      });
      return result.data;
    }
    catch (error) {
      if (
        error instanceof QueryError
        && error.code === QueryErrorCodes.MODEL_VALIDATION_ERROR
        && this.options.fallbackLocale
        && this.options.fallbackStrategy === 'loose'
      ) {
        const fallbackResult = await this.runtime.loadModel<T>(modelId, {
          locale: this.options.fallbackLocale,
          namespace: this.options.namespace,
        });
        return fallbackResult.data;
      }
      throw error;
    }
  }

  async get(): Promise<T[]> {
    try {
      const data = await this.loadModelWithFallback<T>(this.modelId);
      let result = [...data];

      // Apply where conditions
      if (this.whereConditions.length > 0) {
        result = result.filter((item) => {
          return this.whereConditions.every((condition) => {
            const value = item[condition.field as keyof T];
            switch (condition.operator) {
              case 'eq':
                return value === condition.value;
              case 'neq':
                return value !== condition.value;
              case 'contains':
                return (
                  typeof value === 'string'
                  && value.toLowerCase().includes(String(condition.value).toLowerCase())
                );
              case 'notContains':
                return (
                  typeof value === 'string'
                  && !value.toLowerCase().includes(String(condition.value).toLowerCase())
                );
              case 'startsWith':
                return (
                  typeof value === 'string'
                  && value.toLowerCase().startsWith(String(condition.value).toLowerCase())
                );
              case 'endsWith':
                return (
                  typeof value === 'string'
                  && value.toLowerCase().endsWith(String(condition.value).toLowerCase())
                );
              case 'in':
                return Array.isArray(condition.value) && condition.value.includes(value);
              case 'nin':
                return Array.isArray(condition.value) && !condition.value.includes(value);
              case 'gt':
                return (
                  typeof value === 'number'
                  && typeof condition.value === 'number'
                  && value > condition.value
                );
              case 'gte':
                return (
                  typeof value === 'number'
                  && typeof condition.value === 'number'
                  && value >= condition.value
                );
              case 'lt':
                return (
                  typeof value === 'number'
                  && typeof condition.value === 'number'
                  && value < condition.value
                );
              case 'lte':
                return (
                  typeof value === 'number'
                  && typeof condition.value === 'number'
                  && value <= condition.value
                );
              case 'exists':
                return value !== undefined && value !== null;
              default:
                throw new QueryError(
                  `Invalid filter operator: ${String(condition.operator)}`,
                  QueryErrorCodes.MODEL_VALIDATION_ERROR,
                  { operator: condition.operator },
                );
            }
          });
        });
      }

      // Apply order by conditions
      if (this.orderByConditions.length > 0) {
        result.sort((a, b) => {
          for (const condition of this.orderByConditions) {
            const aValue = a[condition.field as keyof T];
            const bValue = b[condition.field as keyof T];

            if (aValue === bValue)
              continue;

            if (condition.direction === 'asc') {
              return aValue < bValue ? -1 : 1;
            }
            else {
              return aValue > bValue ? -1 : 1;
            }
          }
          return 0;
        });
      }

      // Load relations with fallback
      if (this.relations.length > 0) {
        for (const relation of this.relations) {
          for (const item of result) {
            const id = item[`${relation}Id` as keyof T] as string;
            if (!id) {
              throw new QueryError(
                `Failed to load relation: ${String(relation)}`,
                QueryErrorCodes.MODEL_NOT_FOUND,
                { relation, item },
              );
            }
            try {
              const relatedItem = await this.runtime.loadRelation(relation, id, {
                locale: this.options.locale,
                namespace: this.options.namespace,
              });
              if (relatedItem) {
                ;(item as any)[relation] = relatedItem;
              }
            }
            catch (error) {
              throw new QueryError(
                `Failed to load relation: ${String(relation)}`,
                QueryErrorCodes.MODEL_NOT_FOUND,
                { relation, id, error },
              );
            }
          }
        }
      }

      // Load relation counts
      if (this.relationCounts.length > 0) {
        for (const relation of this.relationCounts) {
          for (const item of result) {
            const id = item.ID;
            try {
              const relatedItems = await this.loadModelWithFallback(relation);
              const count = relatedItems.filter(
                related => related[`${this.modelId}Id` as keyof typeof related] === id,
              ).length
              ;(item as any)[`${relation}Count`] = count;
            }
            catch (error) {
              throw new QueryError(
                `Failed to load relation count: ${String(relation)}`,
                QueryErrorCodes.MODEL_NOT_FOUND,
                { relation, id, error },
              );
            }
          }
        }
      }

      // Apply pagination
      if (this.pagination.skip !== undefined || this.pagination.take !== undefined) {
        const start = this.pagination.skip || 0;
        const end = this.pagination.take ? start + this.pagination.take : undefined;
        result = result.slice(start, end);
      }

      return result;
    }
    catch (error) {
      if (error instanceof QueryError) {
        throw error;
      }
      throw new QueryError(
        `Failed to execute query for model: ${String(this.modelId)}`,
        QueryErrorCodes.MODEL_NOT_FOUND,
        { modelId: this.modelId, error },
      );
    }
  }

  async first(): Promise<T | null> {
    const results = await this.take(1).get();
    return results[0] || null;
  }

  async count(): Promise<number> {
    const results = await this.get();
    return results.length;
  }
}
