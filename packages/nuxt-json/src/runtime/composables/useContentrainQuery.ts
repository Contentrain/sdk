import type { Ref } from 'vue';
import type {
    ApiResponse,
    Content,
    LocalizedContent,
    Operator,
    QueryFilter,
    QueryResult,
    QuerySort,
    SingleQueryResult,
} from '../../types';
import { ref } from 'vue';
import { ContentrainError, createError, ERROR_CODES } from '../server/utils/errors';
// Shared query utilities (currently only server side used for consistency in future client-side filtering if needed)
// import { applyFilters, sortItems } from '../utils/query';

// İlişki tiplerini çıkarmak için yardımcı tip
type ExtractRelations<T> = T extends { _relations?: infer R } ? keyof R : never;

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
    private readonly _hasMore: Ref<boolean>;
    private _page: number = 1;

    constructor(private modelId: string) {
        this._data = ref([]) as Ref<M[]>;
        this._total = ref(0);
        this._loading = ref(false);
        this._error = ref(null);
        this._hasMore = ref(true);
    }

    locale<L extends string>(locale: M extends { _lang: infer Lang } ? Lang extends L ? L : never : never): this {
        if (!locale) {
            return this;
        }
        this._locale = locale;
        return this;
    }

    where<K extends keyof M & string>(
        field: K,
        operator: Operator,
        value: M[K] extends Array<infer U> ? U | U[] : M[K],
    ): this {
        if (!field) {
            return this;
        }
        this._filters.push({ field, operator, value } as QueryFilter<M>);
        return this;
    }

    orderBy<K extends keyof M & string>(field: K, direction: 'asc' | 'desc' = 'asc'): this {
        if (!field) {
            return this;
        }
        this._sort.push({ field, direction } as QuerySort<M>);
        return this;
    }

    limit(limit: number): this {
        if (limit < 0) {
            return this;
        }
        this._limit = limit;
        return this;
    }

    offset(offset: number): this {
        if (offset < 0) {
            return this;
        }
        this._offset = offset;
        return this;
    }

    include<R extends ExtractRelations<M>>(relation: R): this {
        if (!relation) {
            return this;
        }
        if (!this._includes.includes(relation)) {
            this._includes.push(relation);
        }
        return this;
    }

    async get(): Promise<QueryResult<M>> {
        const params = new URLSearchParams();

        if (this._locale) {
            params.append('locale', this._locale);
        }

        if (this._filters.length) {
            params.append('filters', JSON.stringify(this._filters));
        }

        if (this._sort.length) {
            params.append('sort', JSON.stringify(this._sort));
        }

        if (typeof this._limit === 'number') {
            params.append('limit', this._limit.toString());
        }

        if (typeof this._offset === 'number') {
            params.append('offset', this._offset.toString());
        }

        if (this._includes.length) {
            params.append('include', JSON.stringify(this._includes));
        }

        params.append('modelId', this.modelId);

        const apiUrl = `/_contentrain/api/query?${params.toString()}`;

        try {
            this._loading.value = true;

            const response = await $fetch<ApiResponse<QueryResult<M>>>(apiUrl);
            if (!response?.success || !response.data) {
                const errorPayload = response?.error;
                throw createError(
                    (errorPayload?.code as typeof ERROR_CODES[keyof typeof ERROR_CODES]) || ERROR_CODES.UNKNOWN_ERROR,
                    errorPayload,
                    errorPayload?.message,
                );
            }
            this._data.value = response.data.data;
            this._total.value = response.data.total;
            return response.data;
        }
        catch (error) {
            const queryError = error instanceof ContentrainError
                ? error
                : createError(ERROR_CODES.UNKNOWN_ERROR, error);
            console.error('[Contentrain Query] Error executing query:', {
                error: queryError,
                modelId: this.modelId,
                params: Object.fromEntries(params.entries()),
            });
            this._error.value = queryError;
            this._data.value = [];
            this._total.value = 0;
            throw queryError;
        }
        finally {
            this._loading.value = false;
        }
    }

    async first(): Promise<SingleQueryResult<M>> {
        this._limit = 1;
        const result = await this.get();
        if (!result.data.length) {
            return {
                data: null as unknown as M,
                total: result.total,
                pagination: {
                    limit: this._limit || 10,
                    offset: this._offset || 0,
                    total: result.total,
                },
            };
        }
        return {
            data: result.data[0],
            total: result.total,
            pagination: {
                limit: this._limit || 10,
                offset: this._offset || 0,
                total: result.total,
            },
        };
    }

    async count(): Promise<QueryResult<M>> {
        const result = await this.get();
        return {
            data: [] as M[],
            total: result.total,
            pagination: {
                limit: this._limit || 10,
                offset: this._offset || 0,
                total: result.total,
            },
        };
    }

    async loadMore(): Promise<QueryResult<M>> {
        if (!this._hasMore.value) {
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

        const currentLimit = this._limit || 10;
        this._offset = (this._page - 1) * currentLimit;

        const result = await this.get();

        if (Array.isArray(result.data) && result.data.length > 0) {
            this._data.value = [...this._data.value, ...result.data];
            this._page++;
        }

        const receivedExpectedCount = Array.isArray(result.data) && result.data.length === currentLimit;
        const nextOffset = (this._offset ?? 0) + (Array.isArray(result.data) ? result.data.length : 0);
        this._hasMore.value = receivedExpectedCount && nextOffset < result.total;

        return result;
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

    get hasMore(): Ref<boolean> {
        return this._hasMore;
    }

    reset(): this {
        this._filters = [];
        this._sort = [];
        this._limit = undefined;
        this._offset = undefined;
        this._includes = [];
        this._locale = undefined;
        this._error.value = null;
        this._page = 1;
        this._hasMore.value = true;
        this._data.value = [] as M[];
        this._total.value = 0;
        return this;
    }
}

export function useContentrainQuery<M extends Content | LocalizedContent>(modelId: string): ContentrainQuery<M> {
    if (!modelId) {
        console.error('[Contentrain Query] Model ID is required');
        throw new Error('Model ID is required');
    }
    return new ContentrainQuery<M>(modelId);
}
