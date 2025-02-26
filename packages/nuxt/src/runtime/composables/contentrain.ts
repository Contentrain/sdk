import type { Filter, IDBRecord, Operator, QueryResult, Sort, SQLiteOptions } from '@contentrain/query';
import type { RuntimeConfig } from 'nuxt/schema';
import { useRuntimeConfig } from '#imports';

type ContentrainRecord = IDBRecord;

export interface IncludeOptions<
    M extends ContentrainRecord,
    L extends string = string,
> {
    relation: keyof M['_relations']
    locale?: L
}

export type ContentrainInclude<
    M extends ContentrainRecord,
    L extends string = string,
> = keyof M['_relations'] | IncludeOptions<M, L> | Array<keyof M['_relations'] | IncludeOptions<M, L>>;

export interface QueryState<
    M extends ContentrainRecord,
    L extends string = string,
> {
    model: string
    filters: Array<Filter & { field: keyof M }>
    includes: Array<IncludeOptions<M, L>>
    sorting: Array<Sort & { field: keyof M }>
    pagination: {
        limit?: number
        offset?: number
    }
    options: SQLiteOptions & {
        locale?: L
        cache?: boolean
        ttl?: number
    }
}

export class QueryBuilder<
    M extends ContentrainRecord,
    L extends string = string,
> {
    private state: QueryState<M, L>;

    constructor(
        model: string,
        private defaultLocale: string,
    ) {
        this.state = {
            model,
            filters: [],
            includes: [],
            sorting: [],
            pagination: {},
            options: {},
        };
    }

    where<K extends keyof M & string, V = M[K], O extends Operator = Operator>(
        field: K,
        operator: O,
        value: V extends Array<infer U>
            ? O extends 'in' | 'nin'
                ? U[]
                : V
            : V,
    ): this {
        this.state.filters.push({
            field,
            operator,
            value,
        });
        return this;
    }

    include(options: ContentrainInclude<M, L>): this {
        if (typeof options === 'string') {
            this.state.includes.push({
                relation: options,
                locale: this.state.options.locale,
            });
        }
        else if (Array.isArray(options)) {
            options.forEach((item) => {
                if (typeof item === 'string') {
                    this.state.includes.push({
                        relation: item,
                        locale: this.state.options.locale,
                    });
                }
                else if (typeof item === 'object' && 'relation' in item) {
                    this.state.includes.push({
                        relation: item.relation,
                        locale: item.locale || this.state.options.locale,
                    });
                }
            });
        }
        else if (typeof options === 'object' && 'relation' in options) {
            this.state.includes.push({
                relation: options.relation,
                locale: options.locale || this.state.options.locale,
            });
        }
        return this;
    }

    orderBy<K extends keyof M & string>(
        field: K,
        direction: 'asc' | 'desc' = 'asc',
    ): this {
        this.state.sorting.push({
            field,
            direction,
        });
        return this;
    }

    limit(limit: number): this {
        this.state.pagination.limit = limit;
        return this;
    }

    offset(offset: number): this {
        this.state.pagination.offset = offset;
        return this;
    }

    locale(locale: L): this {
        this.state.options.locale = locale;
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

        const requestBody = {
            model,
            locale: options.locale || this.defaultLocale,
            where: filters.map(filter => [filter.field, filter.operator, filter.value]),
            orderBy: sorting.map(sort => [sort.field, sort.direction]),
            include: includes.map(include => ({
                relation: include.relation,
                locale: include.locale || options.locale || this.defaultLocale,
            })),
            limit: pagination.limit,
            offset: pagination.offset,
            cache: options.cache,
            ttl: options.ttl,
        };

        try {
            const result = await $fetch<QueryResult<M>>('/api/_contentrain/query', {
                method: 'POST',
                body: requestBody,
            });
            return result;
        }
        catch (error) {
            console.error('Query Error:', error);
            throw error;
        }
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

export interface ContentrainComposable {
    query: <
        M extends ContentrainRecord,
        L extends string = string,
    >(
        model: string
    ) => QueryBuilder<M, L>
    load: <T extends ContentrainRecord>(model: string) => Promise<T>
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
        M extends ContentrainRecord,
        L extends string = string,
    >(
        model: string,
    ): QueryBuilder<M, L> {
        return new QueryBuilder<M, L>(
            model,
            config.public.contentrain.defaultLocale,
        );
    }

    async function load<T extends ContentrainRecord>(model: string): Promise<T> {
        return $fetch<T>('/api/_contentrain/load', {
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
