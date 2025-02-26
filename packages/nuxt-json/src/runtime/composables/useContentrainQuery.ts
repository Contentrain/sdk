import type { Ref } from 'vue';
import type {
    Content,
    LocalizedContent,
    QueryFilter,
    QueryResult,
    QuerySort,
} from '../../types';
import { ref } from 'vue';

// İlişki tiplerini çıkarmak için yardımcı tip
type ExtractRelations<T> = T extends { _relations?: infer R } ? keyof R : never;

// Locale tipini LocalizedContent'ten çıkaralım
type ExtractLocale<T> = T extends LocalizedContent
    ? T['_lang'] extends Array<infer L>
        ? L
        : T['_lang'] extends string
            ? T['_lang']
            : never
    : never;

export class ContentrainQuery<M extends Content | LocalizedContent> {
    private _locale?: ExtractLocale<M>;
    private _filters: QueryFilter[] = [];
    private _sort: QuerySort[] = [];
    private _limit?: number;
    private _offset?: number;
    private _includes: Array<ExtractRelations<M>> = [];
    private readonly _data: Ref<M[]>;
    private readonly _total: Ref<number>;
    private readonly _loading: Ref<boolean>;
    private readonly _error: Ref<Error | null>;

    constructor(private modelId: string) {
        console.info('[Contentrain Query] Initializing query for model:', modelId);
        this._data = ref([]) as Ref<M[]>;
        this._total = ref(0);
        this._loading = ref(false);
        this._error = ref(null);
    }

    // Locale için dinamik tip güvenliği
    locale(locale: M extends LocalizedContent ? ExtractLocale<M> : never): this {
        console.debug('[Contentrain Query] Setting locale:', locale);
        if (!locale) {
            console.warn('[Contentrain Query] Invalid locale provided:', locale);
            return this;
        }
        this._locale = locale as ExtractLocale<M>;
        return this;
    }

    // Field'lar için tip güvenliği
    where<K extends keyof M>(
        field: keyof M,
        operator: QueryFilter['operator'],
        value: M[K] extends Array<infer U> ? U | U[] : M[K],
    ): this {
        console.debug('[Contentrain Query] Adding filter:', { field, operator, value });
        if (!field) {
            console.warn('[Contentrain Query] Invalid field provided for filter');
            return this;
        }
        this._filters.push({ field: field as string, operator, value });
        return this;
    }

    // Sıralama için tip güvenliği
    orderBy<K extends keyof M>(field: K, direction: 'asc' | 'desc' = 'asc'): this {
        console.debug('[Contentrain Query] Adding sort:', { field, direction });
        if (!field) {
            console.warn('[Contentrain Query] Invalid field provided for sorting');
            return this;
        }
        this._sort.push({ field: field as string, direction });
        return this;
    }

    limit(limit: number): this {
        console.debug('[Contentrain Query] Setting limit:', limit);
        if (limit < 0) {
            console.warn('[Contentrain Query] Invalid limit value:', limit);
            return this;
        }
        this._limit = limit;
        return this;
    }

    offset(offset: number): this {
        console.debug('[Contentrain Query] Setting offset:', offset);
        if (offset < 0) {
            console.warn('[Contentrain Query] Invalid offset value:', offset);
            return this;
        }
        this._offset = offset;
        return this;
    }

    // İlişkiler için tip güvenliği
    include<R extends ExtractRelations<M>>(relation: R): this {
        console.debug('[Contentrain Query] Including relation:', relation);
        if (!relation) {
            console.warn('[Contentrain Query] Invalid relation provided');
            return this;
        }
        if (!this._includes.includes(relation)) {
            this._includes.push(relation);
        }
        return this;
    }

    async get(): Promise<QueryResult<M>> {
        console.info('[Contentrain Query] Executing query with params:', {
            modelId: this.modelId,
            locale: this._locale,
            filters: this._filters,
            sort: this._sort,
            limit: this._limit,
            offset: this._offset,
            includes: this._includes,
        });

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

        if (this._limit) {
            params.append('limit', this._limit.toString());
        }

        if (this._offset) {
            params.append('offset', this._offset.toString());
        }

        if (this._includes.length) {
            params.append('include', JSON.stringify(this._includes));
        }

        params.append('modelId', this.modelId);

        const apiUrl = `/_contentrain/api/query?${params.toString()}`;
        console.debug('[Contentrain Query] API URL:', apiUrl);

        try {
            this._loading.value = true;
            console.time(`[Contentrain Query] Fetch time for ${this.modelId}`);

            const response = await $fetch<QueryResult<M>>(apiUrl);
            console.timeEnd(`[Contentrain Query] Fetch time for ${this.modelId}`);

            console.info('[Contentrain Query] Query results:', {
                total: response.total,
                dataLength: response.data.length,
                pagination: response.pagination,
            });

            this._data.value = response.data;
            this._total.value = response.total;
            return response;
        }
        catch (error) {
            console.error('[Contentrain Query] Error executing query:', {
                error,
                modelId: this.modelId,
                params: Object.fromEntries(params.entries()),
            });
            this._error.value = error as Error;
            this._data.value = [];
            this._total.value = 0;
            return {
                data: [],
                total: 0,
                pagination: {
                    limit: this._limit || 10,
                    offset: this._offset || 0,
                    total: 0,
                },
            };
        }
        finally {
            this._loading.value = false;
        }
    }

    async first(): Promise<M | null> {
        console.debug('[Contentrain Query] Fetching first record for model:', this.modelId);
        this._limit = 1;
        const result = await this.get();
        if (!result.data.length) {
            console.warn('[Contentrain Query] No records found for first() query');
            return null;
        }
        return result.data[0] || null;
    }

    async count(): Promise<number> {
        console.debug('[Contentrain Query] Counting records for model:', this.modelId);
        await this.get();
        console.info('[Contentrain Query] Total records:', this._total.value);
        return this._total.value;
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

    // Query durumunu sıfırlamak için yardımcı metod
    reset(): this {
        console.info('[Contentrain Query] Resetting query state');
        this._filters = [];
        this._sort = [];
        this._limit = undefined;
        this._offset = undefined;
        this._includes = [];
        this._locale = undefined;
        this._error.value = null;
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
