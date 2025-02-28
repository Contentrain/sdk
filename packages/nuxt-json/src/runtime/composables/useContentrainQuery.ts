import type { MaybeRef, Ref } from 'vue';
import type {
    Content,
    LocalizedContent,
    Operator,
    QueryFilter,
    QueryResult,
    QuerySort,
    SingleQueryResult,
} from '../../types';
import { ref, unref } from 'vue';
import { ContentrainError, createError, ERROR_CODES } from '../server/utils/errors';
import { useContentrainClient } from './useContentrainClient';

// İlişki tiplerini çıkarmak için yardımcı tip
type ExtractRelations<T> = T extends { _relations?: infer R } ? keyof R : never;

export interface ContentrainQueryOptions<T extends Content | LocalizedContent> {
    modelId: string
    locale?: MaybeRef<string>
    filters?: MaybeRef<QueryFilter<T>[]>
    sort?: MaybeRef<QuerySort<T>[]>
    limit?: MaybeRef<number>
    offset?: MaybeRef<number>
    include?: MaybeRef<string[]>
    immediate?: boolean
}

/**
 * Sınıf tabanlı sorgu oluşturucu - Builder pattern
 */
export class ContentrainQuery<M extends Content | LocalizedContent> {
    private _locale?: string;
    private _filters: QueryFilter<M>[] = [];
    private _sort: QuerySort<M>[] = [];
    private _limit?: number;
    private _offset?: number;
    private _includes: Array<ExtractRelations<M>> = [];
    private readonly _data: Ref<M[]>;
    private readonly _total: Ref<number>;
    private readonly _loading: Ref<boolean>;
    private readonly _error: Ref<Error | null>;
    private _page: number = 1;
    private _hasMore: boolean = true;
    private _lastFetch: number = 0;
    private readonly _cacheTimeout: number = 5000; // 5 saniye cache

    constructor(private modelId: string) {
        if (!modelId) {
            throw createError(ERROR_CODES.INVALID_MODEL_ID);
        }

        console.info('[Contentrain Query] Initializing query for model:', modelId);
        this._data = ref([]) as Ref<M[]>;
        this._total = ref(0);
        this._loading = ref(false);
        this._error = ref(null);
    }

    // Locale için dinamik tip güvenliği
    locale<L extends string>(locale: M extends { _lang: infer Lang } ? Lang extends L ? L : never : never): this {
        if (!locale) {
            throw createError(ERROR_CODES.INVALID_QUERY_PARAMS, 'Invalid locale provided');
        }
        this._locale = locale;
        return this;
    }

    // Field'lar için tip güvenliği
    where<K extends keyof M & string>(
        field: K,
        operator: Operator,
        value: M[K] extends Array<infer U> ? U | U[] : M[K],
    ): this {
        if (!field) {
            throw createError(ERROR_CODES.INVALID_QUERY_PARAMS, 'Invalid field provided for filter');
        }
        this._filters.push({ field, operator, value } as QueryFilter<M>);
        return this;
    }

    // Sıralama için tip güvenliği
    orderBy<K extends keyof M & string>(field: K, direction: 'asc' | 'desc' = 'asc'): this {
        if (!field) {
            throw createError(ERROR_CODES.INVALID_QUERY_PARAMS, 'Invalid field provided for sorting');
        }
        this._sort.push({ field, direction } as QuerySort<M>);
        return this;
    }

    limit(limit: number): this {
        if (limit < 0) {
            throw createError(ERROR_CODES.INVALID_QUERY_PARAMS, 'Invalid limit value');
        }
        this._limit = limit;
        return this;
    }

    offset(offset: number): this {
        if (offset < 0) {
            throw createError(ERROR_CODES.INVALID_QUERY_PARAMS, 'Invalid offset value');
        }
        this._offset = offset;
        return this;
    }

    // İlişkiler için tip güvenliği
    include<R extends ExtractRelations<M>>(relation: R): this {
        if (!relation) {
            throw createError(ERROR_CODES.INVALID_QUERY_PARAMS, 'Invalid relation provided');
        }
        if (!this._includes.includes(relation)) {
            this._includes.push(relation);
        }
        return this;
    }

    private shouldRefetch(): boolean {
        return Date.now() - this._lastFetch > this._cacheTimeout;
    }

    async get(): Promise<QueryResult<M>> {
        // Cache kontrolü
        if (!this.shouldRefetch() && this._data.value.length > 0) {
            return {
                data: this._data.value,
                total: this._total.value,
                pagination: {
                    limit: this._limit || 10,
                    offset: this._offset || 0,
                    total: this._total.value,
                },
            };
        }

        this._loading.value = true;
        this._error.value = null;

        try {
            const client = useContentrainClient();

            // Model yükleme kontrolü
            if (!client.isLoaded.value) {
                await client.loadModels();
            }

            const result = await client.query<M>(this.modelId, {
                locale: this._locale,
                filters: this._filters,
                sort: this._sort,
                limit: this._limit,
                offset: this._offset,
                include: this._includes as string[],
            });

            // Sonuçları önbellekleme
            this._data.value = result.data;
            this._total.value = result.total;
            this._hasMore = result.data.length === (this._limit || 10);
            this._lastFetch = Date.now();

            return result;
        }
        catch (error) {
            this._error.value = error instanceof ContentrainError ? error : createError(ERROR_CODES.QUERY_EXECUTION_ERROR, error);
            throw this._error.value;
        }
        finally {
            this._loading.value = false;
        }
    }

    async first(): Promise<SingleQueryResult<M>> {
        const originalLimit = this._limit;
        this._limit = 1;

        try {
            const result = await this.get();
            return {
                data: result.data[0] || null,
                total: result.total,
                pagination: {
                    limit: this._limit || 10,
                    offset: this._offset || 0,
                    total: result.total,
                },
            };
        }
        finally {
            this._limit = originalLimit;
        }
    }

    async paginate(page: number = 1, perPage: number = 10): Promise<QueryResult<M>> {
        if (page < 1) {
            throw createError(ERROR_CODES.INVALID_QUERY_PARAMS, 'Invalid page number');
        }

        if (perPage < 1) {
            throw createError(ERROR_CODES.INVALID_QUERY_PARAMS, 'Invalid perPage value');
        }

        this._page = page;
        this._limit = perPage;
        this._offset = (page - 1) * perPage;

        return this.get();
    }

    async next(): Promise<QueryResult<M>> {
        if (!this._hasMore) {
            return {
                data: [],
                total: this._total.value,
                pagination: {
                    limit: this._limit || 10,
                    offset: this._offset || 0,
                    total: this._total.value,
                },
            };
        }

        this._page++;
        this._offset = (this._page - 1) * (this._limit || 10);
        return this.get();
    }

    get data(): Ref<M[]> {
        return this._data;
    }

    get total(): Ref<number> {
        return this._total;
    }

    get loading(): Ref<boolean> {
        return this._loading;
    }

    get error(): Ref<Error | null> {
        return this._error;
    }

    get hasMore(): boolean {
        return this._hasMore;
    }

    get currentPage(): number {
        return this._page;
    }
}

/**
 * Sınıf tabanlı sorgu oluşturucu için factory fonksiyonu
 * Hem string hem de ContentrainQueryOptions parametresi destekler
 */
export function useContentrainQuery<M extends Content | LocalizedContent>(
    modelIdOrOptions: string | ContentrainQueryOptions<M>,
): ContentrainQuery<M> {
    // String parametresi veya options nesnesi kontrolü
    const modelId = typeof modelIdOrOptions === 'string'
        ? modelIdOrOptions
        : modelIdOrOptions.modelId;

    if (!modelId) {
        console.error('[Contentrain Query] Model ID is required');
        throw createError(ERROR_CODES.INVALID_MODEL_ID);
    }

    const query = new ContentrainQuery<M>(modelId);

    // Eğer options nesnesi verilmişse, parametreleri ayarla
    if (typeof modelIdOrOptions !== 'string') {
        const options = modelIdOrOptions;

        if (options.locale) {
            query.locale(unref(options.locale) as any);
        }

        if (options.filters) {
            const filters = unref(options.filters);
            filters.forEach((filter) => {
                query.where(filter.field, filter.operator, filter.value as any);
            });
        }

        if (options.sort) {
            const sorts = unref(options.sort);
            sorts.forEach((sort) => {
                query.orderBy(sort.field, sort.direction);
            });
        }

        if (options.limit) {
            query.limit(unref(options.limit));
        }

        if (options.offset) {
            query.offset(unref(options.offset));
        }

        if (options.include) {
            const includes = unref(options.include);
            includes.forEach((include) => {
                query.include(include as any);
            });
        }
    }

    return query;
}
