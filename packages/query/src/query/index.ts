import type { ContentrainBaseModel } from '@contentrain/types';
import type { DataLoader } from '../loader/types';
import type { FilterOperator, OrderByCondition, PaginationOptions, QueryOptions, WhereCondition } from './types';

export class ContentrainQuery<T extends ContentrainBaseModel> {
  private loader: DataLoader;
  private modelId: string;
  private locale?: string;
  private whereConditions: WhereCondition[] = [];
  private orderByConditions: OrderByCondition[] = [];
  private pagination: PaginationOptions = {};

  constructor(modelId: string, options: QueryOptions) {
    this.loader = options.loader;
    this.modelId = modelId;
    this.locale = options.locale;
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

  async get(): Promise<T[]> {
    const data = await this.loader.loadModel<T>(this.modelId, this.locale);
    let result = [...data];

    // Apply where conditions
    if (this.whereConditions.length > 0) {
      result = result.filter((item) => {
        return this.whereConditions.every((condition) => {
          const value = item[condition.field as keyof T];
          switch (condition.operator) {
            case 'equals':
              return value === condition.value;
            case 'notEquals':
              return value !== condition.value;
            case 'contains':
              return typeof value === 'string' && value.toLowerCase().includes(String(condition.value).toLowerCase());
            case 'notContains':
              return typeof value === 'string' && !value.toLowerCase().includes(String(condition.value).toLowerCase());
            case 'startsWith':
              return typeof value === 'string' && value.toLowerCase().startsWith(String(condition.value).toLowerCase());
            case 'endsWith':
              return typeof value === 'string' && value.toLowerCase().endsWith(String(condition.value).toLowerCase());
            case 'in':
              return Array.isArray(condition.value) && condition.value.includes(value);
            case 'notIn':
              return Array.isArray(condition.value) && !condition.value.includes(value);
            default:
              return false;
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

    // Apply pagination
    if (this.pagination.skip !== undefined || this.pagination.take !== undefined) {
      const start = this.pagination.skip || 0;
      const end = this.pagination.take ? start + this.pagination.take : undefined;
      result = result.slice(start, end);
    }

    return result;
  }
}
