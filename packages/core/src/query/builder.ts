import type { ContentLoader } from '../loader/content';
import type { BaseContentrainType } from '../types/model';
import type { Filter, Include, Operator, QueryOptions, QueryResult, Sort } from '../types/query';
import type { QueryExecutor } from './executor';

export class ContentrainQueryBuilder<T extends BaseContentrainType> {
  private model: string;
  private filters: Filter[] = [];
  private includes: Include = {};
  private sorting: Sort[] = [];
  private pagination: {
    limit?: number
    offset?: number
  } = {};

  private options: QueryOptions = {};
  private executor: QueryExecutor;
  private loader: ContentLoader;

  constructor(model: string, executor: QueryExecutor, loader: ContentLoader) {
    this.model = model;
    this.executor = executor;
    this.loader = loader;
  }

  where(field: keyof T, operator: Operator, value: any): this {
    this.filters.push({
      field: field as string,
      operator,
      value,
    });
    return this;
  }

  include(relations: string | string[] | Include): this {
    if (typeof relations === 'string') {
      this.includes[relations] = {};
    }
    else if (Array.isArray(relations)) {
      relations.forEach((relation) => {
        this.includes[relation] = {};
      });
    }
    else {
      this.includes = {
        ...this.includes,
        ...relations,
      };
    }
    return this;
  }

  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
    this.sorting.push({
      field: field as string,
      direction,
    });
    return this;
  }

  limit(count: number): this {
    this.pagination.limit = count;
    return this;
  }

  offset(count: number): this {
    this.pagination.offset = count;
    return this;
  }

  locale(code: string): this {
    this.options.locale = code;
    return this;
  }

  cache(ttl?: number): this {
    this.options.cache = true;
    if (ttl)
      this.options.ttl = ttl;
    return this;
  }

  noCache(): this {
    this.options.cache = false;
    return this;
  }

  bypassCache(): this {
    this.options.cache = false;
    this.options.ttl = 0;
    return this;
  }

  toJSON() {
    return {
      model: this.model,
      filters: this.filters,
      includes: this.includes,
      sorting: this.sorting,
      pagination: this.pagination,
      options: this.options,
    };
  }

  async get(): Promise<QueryResult<T>> {
    // Content Loader'dan veriyi al
    const result = await this.loader.load<T>(this.model);
    const data = this.options.locale ? result.content[this.options.locale] : result.content.en;

    return this.executor.execute({
      model: this.model,
      data,
      filters: this.filters,
      includes: this.includes,
      sorting: this.sorting,
      pagination: this.pagination,
      options: this.options,
    });
  }

  async first(): Promise<T | null> {
    const result = await this.limit(1).get();
    return result.data[0] || null;
  }
}
