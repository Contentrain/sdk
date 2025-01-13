import type { BaseContentrainType, Filter, Include, LoaderResult, Operator, QueryResult, Sort } from '@contentrain/query';
import type { RuntimeConfig } from 'nuxt/schema';
import { useRuntimeConfig } from '#imports';

export interface QueryState<
  M extends BaseContentrainType,
  L extends string = string,
  R extends Record<string, BaseContentrainType> = Record<string, BaseContentrainType>,
> {
  model: string
  filters: Array<Omit<Filter, 'field'> & { field: keyof M | keyof BaseContentrainType }>
  includes: Record<keyof R, Include>
  sorting: Array<Omit<Sort, 'field'> & { field: keyof M | keyof BaseContentrainType }>
  pagination: {
    limit?: number
    offset?: number
  }
  options: {
    locale?: L
    cache?: boolean
    ttl?: number
  }
}

export class QueryBuilder<
  M extends BaseContentrainType,
  L extends string = string,
  R extends Record<string, BaseContentrainType> = Record<string, BaseContentrainType>,
> {
  private state: QueryState<M, L, R>;

  constructor(
    model: string,
    private fetch: typeof $fetch,
    private defaultLocale: string,
  ) {
    this.state = {
      model,
      filters: [],
      includes: {} as Record<keyof R, Include>,
      sorting: [],
      pagination: {},
      options: {},
    };
  }

  where(field: keyof M | keyof BaseContentrainType, operator: Operator, value: any): this {
    this.state.filters.push({
      field,
      operator,
      value,
    });
    return this;
  }

  include(relation: keyof R): this {
    this.state.includes[relation] = {};
    return this;
  }

  orderBy(field: keyof M | keyof BaseContentrainType, direction: 'asc' | 'desc' = 'asc'): this {
    this.state.sorting.push({
      field,
      direction,
    });
    return this;
  }

  limit(count: number): this {
    this.state.pagination.limit = count;
    return this;
  }

  offset(count: number): this {
    this.state.pagination.offset = count;
    return this;
  }

  locale(code: L): this {
    this.state.options.locale = code;
    return this;
  }

  async get(): Promise<QueryResult<M>> {
    const { model, ...rest } = this.state;
    return this.fetch('/api/contentrain/query', {
      method: 'POST',
      body: {
        model,
        defaultLocale: this.defaultLocale,
        ...rest,
      },
    });
  }

  async first(): Promise<M | null> {
    this.limit(1);
    const result = await this.get();
    return result.data[0] || null;
  }
}

export function useContentrain() {
  const config = useRuntimeConfig() as RuntimeConfig & {
    public: {
      contentrain: {
        defaultLocale: string
      }
    }
  };

  function query<
    M extends BaseContentrainType,
    L extends string = string,
    R extends Record<string, BaseContentrainType> = Record<string, BaseContentrainType>,
  >(model: string): QueryBuilder<M, L, R> {
    return new QueryBuilder<M, L, R>(model, $fetch, config.public.contentrain.defaultLocale);
  }

  async function load<T extends BaseContentrainType>(model: string): Promise<LoaderResult<T>> {
    return $fetch('/api/contentrain/load', {
      method: 'POST',
      body: {
        model,
      },
    });
  }

  return {
    query,
    load,
  };
}
