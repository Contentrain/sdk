import type { CacheManager } from '../cache';
import type { DataLoader } from '../loader';
import type {
  ContentrainBaseModel,
  PaginationOptions,
  QueryCondition,
  QueryOptions,
  QueryState,
  SortOption,
} from '../types';
import { createCacheManager } from '../cache';
import { createLoader } from '../loader';

export class ContentrainQuery<T extends ContentrainBaseModel> {
  private state: QueryState<T> = {
    conditions: [],
    relations: [],
    relationCounts: [],
    sorts: [],
  };

  private loader?: DataLoader;
  private cache: CacheManager;

  constructor(private options: QueryOptions = {}) {
    this.cache = createCacheManager(options.cacheStrategy || 'none');
  }

  private async ensureLoader(): Promise<void> {
    if (!this.loader) {
      const isNode = typeof window === 'undefined';
      this.loader = await createLoader(isNode ? 'node' : 'browser', this.options.basePath || '');
    }
  }

  from<K extends string>(model: K): ContentrainQuery<T> {
    this.state.model = model;
    return this;
  }

  where(field: keyof T, operator: QueryCondition<T>['operator'], value: any): this {
    this.state.conditions.push({ field, operator, value });
    return this;
  }

  whereIn(field: keyof T, values: any[]): this {
    return this.where(field, 'in', values);
  }

  whereLike(field: keyof T, pattern: string): this {
    return this.where(field, 'contains', pattern);
  }

  with(relation: string): this {
    this.state.relations.push(relation);
    return this;
  }

  withCount(relation: string): this {
    this.state.relationCounts.push(relation);
    return this;
  }

  orderBy(field: keyof T, direction: SortOption<T>['direction']): this {
    this.state.sorts.push({ field, direction });
    return this;
  }

  locale(locale: string): this {
    this.state.locale = locale;
    return this;
  }

  skip(count: number): this {
    this.state.skip = count;
    return this;
  }

  take(count: number): this {
    this.state.take = count;
    return this;
  }

  paginate(page: number, perPage: number): this {
    this.state.pagination = { page, perPage };
    return this;
  }

  private async executeQuery(): Promise<T[]> {
    if (!this.state.model) {
      throw new Error('Model not specified. Call from() first.');
    }

    await this.ensureLoader();

    const cacheKey = JSON.stringify({
      model: this.state.model,
      state: this.state,
    });

    const cached = await this.cache.get<T[]>(cacheKey);
    if (cached)
      return cached;

    const data = await this.loader!.loadModel<T>(
      this.state.model,
      this.state.locale || this.options.defaultLocale,
    );

    let result = this.applyConditions(data);
    result = this.applySorting(result);
    result = this.applyPagination(result);

    if (this.state.relations.length > 0) {
      result = await this.loadRelations(result);
    }

    await this.cache.set(cacheKey, result, {
      ttl: this.options.cacheTTL,
    });

    return result;
  }

  private applyConditions(data: T[]): T[] {
    return data.filter(item =>
      this.state.conditions.every(({ field, operator, value }) => {
        switch (operator) {
          case 'eq':
            return item[field] === value;
          case 'neq':
            return item[field] !== value;
          case 'gt':
            return item[field] > value;
          case 'gte':
            return item[field] >= value;
          case 'lt':
            return item[field] < value;
          case 'lte':
            return item[field] <= value;
          case 'in':
            return Array.isArray(value) && value.includes(item[field]);
          case 'nin':
            return Array.isArray(value) && !value.includes(item[field]);
          case 'contains':
            return String(item[field]).includes(String(value));
          case 'startsWith':
            return String(item[field]).startsWith(String(value));
          case 'endsWith':
            return String(item[field]).endsWith(String(value));
          case 'exists':
            return value ? item[field] !== undefined : item[field] === undefined;
          case 'notExists':
            return value ? item[field] === undefined : item[field] !== undefined;
          default:
            return true;
        }
      }),
    );
  }

  private applySorting(data: T[]): T[] {
    if (this.state.sorts.length === 0)
      return data;

    return [...data].sort((a, b) => {
      for (const { field, direction } of this.state.sorts) {
        if (a[field] === b[field])
          continue;

        const modifier = direction === 'asc' ? 1 : -1;
        return a[field] > b[field] ? modifier : -modifier;
      }
      return 0;
    });
  }

  private applyPagination(data: T[]): T[] {
    if (this.state.pagination) {
      const { page, perPage } = this.state.pagination;
      const start = (page - 1) * perPage;
      return data.slice(start, start + perPage);
    }

    if (this.state.skip !== undefined || this.state.take !== undefined) {
      const start = this.state.skip || 0;
      const end = this.state.take ? start + this.state.take : undefined;
      return data.slice(start, end);
    }

    return data;
  }

  private async loadRelations(data: T[]): Promise<T[]> {
    const result = [...data];

    for (const item of result) {
      for (const relation of this.state.relations) {
        const related = await this.loader!.loadRelation(
          relation,
          item.ID,
          this.state.locale || this.options.defaultLocale,
        );
        if (related) {
          (item as any)[`${relation}-data`] = related;
        }
      }
    }

    return result;
  }

  async get(): Promise<T[]> {
    return this.executeQuery();
  }

  async first(): Promise<T | null> {
    const results = await this.executeQuery();
    return results[0] || null;
  }

  async count(): Promise<number> {
    const results = await this.executeQuery();
    return results.length;
  }
}
