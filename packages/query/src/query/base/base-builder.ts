import type { Filter, IBaseQueryBuilder, Include, Operator, Pagination, QueryOptions, QueryResult, Sort } from '../types';
import { QueryBuilderError } from '../../errors';
import { loggers } from '../../utils/logger';

const logger = loggers.query;

export abstract class BaseQueryBuilder<TData> implements IBaseQueryBuilder<TData> {
    protected filters: Filter[] = [];
    protected includes: Include = {};
    protected sorting: Sort[] = [];
    protected pagination: Pagination = {};
    protected options: QueryOptions = {};

    constructor(protected readonly model: string) {}

    where(field: keyof TData, operator: Operator, value: any): this {
        try {
            this.filters.push({
                field: String(field),
                operator,
                value,
            });
            return this;
        }
        catch (error: any) {
            logger.error('Failed to add filter', {
                field: String(field),
                operator,
                value,
                error: error?.message,
            });
            throw new QueryBuilderError('Failed to add filter', 'filter', {
                field: String(field),
                operator,
                value,
                originalError: error?.message,
            });
        }
    }

    orderBy(field: keyof TData, direction: 'asc' | 'desc' = 'asc'): this {
        try {
            this.sorting.push({
                field: String(field),
                direction,
            });
            return this;
        }
        catch (error: any) {
            logger.error('Failed to add sort', {
                field: String(field),
                direction,
                error: error?.message,
            });
            throw new QueryBuilderError('Failed to add sort', 'sort', {
                field: String(field),
                direction,
                originalError: error?.message,
            });
        }
    }

    limit(count: number): this {
        if (count < 0) {
            throw new QueryBuilderError('Limit cannot be negative', 'validate', { count });
        }
        this.pagination.limit = count;
        return this;
    }

    offset(count: number): this {
        if (count < 0) {
            throw new QueryBuilderError('Offset cannot be negative', 'validate', { count });
        }
        this.pagination.offset = count;
        return this;
    }

    cache(ttl?: number): this {
        try {
            this.options.cache = true;
            if (ttl)
                this.options.ttl = ttl;
            return this;
        }
        catch (error: any) {
            logger.error('Failed to set cache', {
                ttl,
                error: error?.message,
            });
            throw new QueryBuilderError('Failed to set cache', 'cache', {
                ttl,
                originalError: error?.message,
            });
        }
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

    abstract get(): Promise<QueryResult<TData>>;
    abstract first(): Promise<TData | null>;
    abstract count(): Promise<number>;

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
}
