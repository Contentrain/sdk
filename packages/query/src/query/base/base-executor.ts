import type { Filter, Include, Pagination, QueryOptions, QueryResult, Sort, StringOperator } from '../types';
import { QueryExecutorError } from '../../errors';
import { loggers } from '../../utils/logger';

const logger = loggers.executor;

export interface IQueryExecutor<TData, TInclude extends Include = Include, TOptions extends QueryOptions = QueryOptions> {
    execute: (params: {
        model: string
        filters?: Filter[]
        includes?: TInclude
        sorting?: Sort[]
        pagination?: Pagination
        options?: TOptions
    }) => Promise<QueryResult<TData>>
}

export abstract class BaseQueryExecutor<TData, TInclude extends Include = Include, TOptions extends QueryOptions = QueryOptions> implements IQueryExecutor<TData, TInclude, TOptions> {
    protected applyStringOperation(value: string, operator: StringOperator, searchValue: string): boolean {
        try {
            switch (operator) {
                case 'eq':
                    return value === searchValue;
                case 'ne':
                    return value !== searchValue;
                case 'contains':
                    return value.toLowerCase().includes(searchValue.toLowerCase());
                case 'startsWith':
                    return value.toLowerCase().startsWith(searchValue.toLowerCase());
                case 'endsWith':
                    return value.toLowerCase().endsWith(searchValue.toLowerCase());
                default: {
                    const _exhaustiveCheck: never = operator;
                    return _exhaustiveCheck;
                }
            }
        }
        catch (error: any) {
            logger.error('Failed to apply string operation', { operator, error: error?.message });
            throw new QueryExecutorError('Failed to apply string operation', 'filter', {
                operator,
                originalError: error?.message,
            });
        }
    }

    protected async resolveIncludes(
        model: string,
        data: TData[],
        includes: TInclude,
        options: TOptions,
    ): Promise<TData[]> {
        try {
            const result = [...data];

            for (const [field, config] of Object.entries(includes)) {
                // Resolve relation - Bu metod alt sınıflarda implement edilmeli
                const relations = await this.resolveRelation(
                    model,
                    field,
                    result,
                    options,
                );
                // Resolve nested relations
                if (config.include && relations.length) {
                    await this.resolveIncludes(
                        field,
                        relations,
                        config.include as TInclude,
                        options,
                    );
                }

                // Add related data
                result.forEach((item) => {
                    const value = (item as any)[field];
                    const relatedItems = relations.filter((r) => {
                        if (Array.isArray(value)) {
                            return value.includes((r as any).ID);
                        }
                        return (r as any).ID === value;
                    });

                    if (!(item as any)._relations) {
                        (item as any)._relations = {};
                    }
                    (item as any)._relations[field] = Array.isArray(value) ? relatedItems : relatedItems[0];
                });
            }

            return result;
        }
        catch (error: any) {
            logger.error('Failed to resolve includes', {
                model,
                error: error?.message,
                errorCode: error?.code,
            });

            throw new QueryExecutorError(
                'Failed to resolve includes',
                'resolve',
                {
                    model,
                    originalError: error?.message,
                    errorCode: error?.code,
                },
            );
        }
    }

    protected abstract resolveRelation(
        model: string,
        field: string,
        data: TData[],
        options: TOptions,
    ): Promise<TData[]>;

    abstract execute(params: {
        model: string
        filters?: Filter[]
        includes?: TInclude
        sorting?: Sort[]
        pagination?: Pagination
        options?: TOptions
    }): Promise<QueryResult<TData>>;

    protected applyFilters(data: TData[], filters: Filter[] = []): TData[] {
        try {
            const result = data.filter((item) => {
                return filters.every(({ field, operator, value }) => {
                    const itemValue = item[field as keyof TData];
                    return this.compareValues(itemValue, operator, value);
                });
            });
            return result;
        }
        catch (error: any) {
            logger.error('Failed to apply filters', {
                error: error?.message,
                errorCode: error?.code,
            });

            throw new QueryExecutorError(
                'Failed to apply filters',
                'filter',
                {
                    originalError: error?.message,
                    errorCode: error?.code,
                },
            );
        }
    }

    protected applySorting(data: TData[], sorting: Sort[] = []): TData[] {
        try {
            const result = [...data].sort((a, b) => {
                for (const { field, direction } of sorting) {
                    const aValue = a[field as keyof TData];
                    const bValue = b[field as keyof TData];

                    if (aValue === bValue)
                        continue;

                    const compareResult = aValue < bValue ? -1 : 1;
                    return direction === 'asc' ? compareResult : -compareResult;
                }
                return 0;
            });
            return result;
        }
        catch (error: any) {
            logger.error('Failed to apply sorting', {
                error: error?.message,
                errorCode: error?.code,
            });

            throw new QueryExecutorError(
                'Failed to apply sorting',
                'sort',
                {
                    originalError: error?.message,
                    errorCode: error?.code,
                },
            );
        }
    }

    protected applyPagination(data: TData[], limit?: number, offset: number = 0): TData[] {
        try {
            const result = limit ? data.slice(offset, offset + limit) : data.slice(offset);
            return result;
        }
        catch (error: any) {
            logger.error('Failed to apply pagination', {
                limit,
                offset,
                error: error?.message,
                errorCode: error?.code,
            });

            throw new QueryExecutorError(
                'Failed to apply pagination',
                'paginate',
                {
                    limit,
                    offset,
                    originalError: error?.message,
                    errorCode: error?.code,
                },
            );
        }
    }

    protected compareValues(itemValue: any, operator: string, value: any): boolean {
        try {
            switch (operator) {
                case 'eq':
                    return itemValue === value;
                case 'ne':
                    return itemValue !== value;
                case 'gt':
                    return itemValue > value;
                case 'gte':
                    return itemValue >= value;
                case 'lt':
                    return itemValue < value;
                case 'lte':
                    return itemValue <= value;
                case 'in':
                    return Array.isArray(value) ? value.includes(itemValue) : false;
                case 'nin':
                    return Array.isArray(value) ? !value.includes(itemValue) : false;
                case 'contains':
                    return typeof itemValue === 'string' && typeof value === 'string'
                        ? this.applyStringOperation(itemValue, 'contains', value)
                        : false;
                case 'startsWith':
                    return typeof itemValue === 'string' && typeof value === 'string'
                        ? this.applyStringOperation(itemValue, 'startsWith', value)
                        : false;
                case 'endsWith':
                    return typeof itemValue === 'string' && typeof value === 'string'
                        ? this.applyStringOperation(itemValue, 'endsWith', value)
                        : false;
                default:
                    return false;
            }
        }
        catch (error: any) {
            logger.error('Failed to compare values', { operator, error: error?.message });
            throw new QueryExecutorError('Failed to compare values', 'filter', {
                operator,
                originalError: error?.message,
            });
        }
    }

    protected getPaginationInfo(
        pagination: Pagination | undefined,
        total: number,
    ): QueryResult<TData>['pagination'] {
        if (!pagination?.limit) {
            return undefined;
        }

        return {
            limit: pagination.limit,
            offset: pagination.offset || 0,
            hasMore: (pagination.offset || 0) + pagination.limit < total,
        };
    }
}
