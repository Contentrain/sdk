import type { ContentLoader } from '../loader/content';
import type { BaseContentrainType, ContentrainLocales } from '../types/model';
import type { Filter, Include, Operator, Pagination, QueryOptions, QueryResult, Sort } from '../types/query';
import type { QueryExecutor } from './executor';

export class ContentrainQueryBuilder<
  TFields extends BaseContentrainType,
  TLocales extends ContentrainLocales = 'en' | 'tr',
  TRelations extends Record<string, BaseContentrainType> = Record<string, never>,
> {
  private model: string;
  private filters: Filter[] = [];
  private includes: Include = {};
  private sorting: Sort[] = [];
  private pagination: Pagination = {};

  private options: QueryOptions = {};
  private executor: QueryExecutor;
  private loader: ContentLoader;

  constructor(model: string, executor: QueryExecutor, loader: ContentLoader) {
    this.model = model;
    this.executor = executor;
    this.loader = loader;
  }

  where<K extends keyof TFields, O extends Operator>(
    field: K,
    operator: O,
    value: O extends 'in' ? TFields[K][] : TFields[K],
  ): this {
    this.filters.push({
      field: field as string,
      operator,
      value,
    });
    return this;
  }

  include<K extends keyof TRelations>(relation: K | K[]): this {
    if (typeof relation === 'string') {
      this.includes[relation] = {};
    }
    else if (Array.isArray(relation)) {
      relation.forEach((r) => {
        this.includes[r as string] = {};
      });
    }
    return this;
  }

  orderBy<K extends keyof TFields>(field: K, direction: 'asc' | 'desc' = 'asc'): this {
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

  locale(code: TLocales): this {
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

  async get(): Promise<QueryResult<TFields>> {
    const result = await this.loader.load<TFields>(this.model);
    const modelConfig = result.model;

    // Locale kontrolü ve veri seçimi
    let data: TFields[];
    if (modelConfig.metadata.localization) {
      // Localize edilmiş model için locale kontrolü
      const locale = this.options.locale || 'en'; // Default locale
      data = result.content[locale];

      if (!data) {
        throw new Error(`Content not found for locale: ${locale}`);
      }
    }
    else {
      // Localize edilmemiş model için default içerik
      if (!result.content.default) {
        throw new Error(`Content not found for model: ${this.model}`);
      }
      data = result.content.default;
    }

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

  async first(): Promise<TFields | null> {
    const result = await this.limit(1).get();
    return result.data[0] || null;
  }

  async count(): Promise<number> {
    const result = await this.get();
    return result.total;
  }
}
