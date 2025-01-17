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

  where<K extends keyof M | keyof BaseContentrainType>(
    field: K,
    operator: Operator,
    value: K extends keyof M ? M[K] : any,
  ): this {
    this.state.filters.push({
      field,
      operator,
      value,
    });
    return this;
  }

  include<K extends M extends { _relations?: infer R } ? keyof R : never>(relation: K | K[]): this {
    if (typeof relation === 'string') {
      (this.state.includes as any)[relation] = {};
    }
    else if (Array.isArray(relation)) {
      relation.forEach((r) => {
        (this.state.includes as any)[r] = {};
      });
    }
    return this;
  }

  orderBy<K extends keyof M | keyof BaseContentrainType>(
    field: K,
    direction: 'asc' | 'desc' = 'asc',
  ): this {
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

  cache(ttl?: number): this {
    this.state.options.cache = true;
    if (ttl)
      this.state.options.ttl = ttl;
    return this;
  }

  noCache(): this {
    this.state.options.cache = false;
    return this;
  }

  async get(): Promise<QueryResult<M>> {
    const { model, options, filters, sorting, includes, pagination } = this.state;

    const formattedIncludes = Object.keys(includes).length > 0
      ? Object.keys(includes).map(key => key.toString())
      : undefined;

    return $fetch<QueryResult<M>>('/api/_contentrain/query', {
      method: 'POST',
      body: {
        model,
        locale: options.locale || this.defaultLocale,
        where: filters.map(filter => [filter.field, filter.operator, filter.value]),
        orderBy: sorting.map(sort => [sort.field, sort.direction]),
        include: formattedIncludes,
        limit: pagination.limit,
        offset: pagination.offset,
        cache: options.cache,
        ttl: options.ttl,
      },
    });
  }

  async first(): Promise<M | null> {
    this.limit(1);
    const result = await this.get();
    return result.data[0] || null;
  }

  async count(): Promise<number> {
    const result = await this.get();
    return result.total;
  }
}

export interface ContentrainComposable<
  M extends BaseContentrainType = BaseContentrainType,
  L extends string = string,
  R extends Record<string, BaseContentrainType> = Record<string, BaseContentrainType>,
> {
  query: <
    TFields extends M = M,
    TLocales extends L = L,
    TRelations extends R = R,
  >(
    model: string
  ) => QueryBuilder<TFields, TLocales, TRelations>
  load: <T extends BaseContentrainType = M>(model: string) => Promise<LoaderResult<T>>
  clearCache: (model?: string) => Promise<void>
}

export function useContentrain(): ContentrainComposable {
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
    return new QueryBuilder<M, L, R>(model, config.public.contentrain.defaultLocale);
  }

  async function load<T extends BaseContentrainType>(model: string): Promise<LoaderResult<T>> {
    return $fetch<LoaderResult<T>>('/api/_contentrain/load', {
      method: 'POST',
      body: {
        model,
      },
    });
  }

  async function clearCache(model?: string): Promise<void> {
    return $fetch('/api/_contentrain/cache/clear', {
      method: 'POST',
      body: { model },
    });
  }

  return {
    query,
    load,
    clearCache,
  };
}
