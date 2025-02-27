import type { ApiResponse, ModelData, QueryFilter, QueryResult, QuerySort } from '../../../types';
import { useStorage } from '#imports';
import { defineEventHandler, getQuery } from 'h3';
import { RelationResolver } from '../services/relation-resolver';
import { ContentrainError, ERROR_CODES } from '../utils/errors';
import { STORAGE_KEYS, StorageManager } from '../utils/storage';

export default defineEventHandler(async (event) => {
    try {
        // 1. Storage durumunu kontrol et
        const isReady = await StorageManager.isReady();
        if (!isReady) {
            console.warn('[Contentrain Query] Storage is not ready');
            throw new ContentrainError({
                code: ERROR_CODES.STORAGE_NOT_READY,
                message: 'Storage is not ready',
            });
        }

        const query = getQuery(event);
        const {
            modelId,
            locale,
            filters: filtersStr,
            sort: sortStr,
            limit: limitStr,
            offset: offsetStr,
            include: includeStr,
        } = query;

        console.debug('[Contentrain Query] Processing query:', {
            modelId,
            locale,
            hasFilters: !!filtersStr,
            hasSort: !!sortStr,
            limit: limitStr,
            offset: offsetStr,
            include: includeStr,
        });

        if (!modelId || typeof modelId !== 'string') {
            throw new ContentrainError({
                code: ERROR_CODES.INVALID_MODEL_ID,
                message: 'Model ID is required',
            });
        }

        // 2. Model verisini al
        const storage = useStorage('data');
        const model = await storage.getItem<ModelData>(STORAGE_KEYS.MODEL_DATA(modelId));

        if (!model) {
            console.warn(`[Contentrain Query] Model not found: ${modelId}`);
            throw new ContentrainError({
                code: ERROR_CODES.MODEL_NOT_FOUND,
                message: `Model not found: ${modelId}`,
            });
        }

        let content = [...model.content];
        console.debug(`[Contentrain Query] Initial content length: ${content.length}`);

        // Apply locale filter
        if (locale && typeof locale === 'string' && model.metadata.localization) {
            content = content.filter(item => '_lang' in item && item._lang === locale);
        }

        // Apply filters
        if (filtersStr && typeof filtersStr === 'string') {
            try {
                const filters = JSON.parse(filtersStr) as QueryFilter[];
                content = content.filter(item =>
                    filters.every((filter) => {
                        const value = item[filter.field];
                        const compareValue = filter.value;

                        switch (filter.operator) {
                            case 'eq':
                                return value === compareValue;
                            case 'ne':
                                return value !== compareValue;
                            case 'gt':
                                return typeof value === 'number' && typeof compareValue === 'number' && value > compareValue;
                            case 'gte':
                                return typeof value === 'number' && typeof compareValue === 'number' && value >= compareValue;
                            case 'lt':
                                return typeof value === 'number' && typeof compareValue === 'number' && value < compareValue;
                            case 'lte':
                                return typeof value === 'number' && typeof compareValue === 'number' && value <= compareValue;
                            case 'in':
                                return Array.isArray(compareValue) && compareValue.includes(value);
                            case 'nin':
                                return Array.isArray(compareValue) && !compareValue.includes(value);
                            case 'contains':
                                return typeof value === 'string' && typeof compareValue === 'string' && value.includes(compareValue);
                            case 'startsWith':
                                return typeof value === 'string' && typeof compareValue === 'string' && value.startsWith(compareValue);
                            case 'endsWith':
                                return typeof value === 'string' && typeof compareValue === 'string' && value.endsWith(compareValue);
                            default:
                                return true;
                        }
                    }),
                );
            }
            catch (error: any) {
                console.error('Error parsing filters:', error);
                throw new ContentrainError({
                    code: ERROR_CODES.INVALID_QUERY_PARAMS,
                    message: 'Invalid filters format',
                    details: error,
                });
            }
        }

        // Apply sorting
        if (sortStr && typeof sortStr === 'string') {
            try {
                const sort = JSON.parse(sortStr) as QuerySort[];
                content.sort((a, b) => {
                    for (const { field, direction } of sort) {
                        const aValue = a[field];
                        const bValue = b[field];

                        if (aValue === bValue)
                            continue;

                        if (typeof aValue === 'number' && typeof bValue === 'number') {
                            const modifier = direction === 'asc' ? 1 : -1;
                            return aValue > bValue ? modifier : -modifier;
                        }

                        if (typeof aValue === 'string' && typeof bValue === 'string') {
                            return direction === 'asc'
                                ? aValue.localeCompare(bValue)
                                : bValue.localeCompare(aValue);
                        }
                    }
                    return 0;
                });
            }
            catch (error: any) {
                console.error('Error parsing sort:', error);
                throw new ContentrainError({
                    code: ERROR_CODES.INVALID_QUERY_PARAMS,
                    message: 'Invalid sort format',
                    details: error,
                });
            }
        }

        // Get total before pagination
        const total = content.length;

        // Apply pagination
        const limit = limitStr ? Number.parseInt(String(limitStr), 10) : 10;
        const offset = offsetStr ? Number.parseInt(String(offsetStr), 10) : 0;
        content = content.slice(offset, offset + limit);

        // Resolve relations
        if (includeStr && typeof includeStr === 'string') {
            try {
                const includes = JSON.parse(includeStr) as string[];
                const modelList = await storage.getItem<ModelData[]>(STORAGE_KEYS.MODEL_LIST) || [];
                const resolver = new RelationResolver(modelList);
                content = await resolver.resolveRelations(model, content, includes, locale as string | undefined);
            }
            catch (error: any) {
                console.error('Error resolving relations:', error);
                throw new ContentrainError({
                    code: ERROR_CODES.INVALID_QUERY_PARAMS,
                    message: 'Error resolving relations',
                    details: error,
                });
            }
        }

        const queryResult: QueryResult<typeof content[0]> = {
            data: content,
            total,
            pagination: {
                limit,
                offset,
                total,
            },
        };

        // Standardize API yanıtı
        const response: ApiResponse<QueryResult<typeof content[0]>> = {
            success: true,
            data: queryResult,
        };

        return response;
    }
    catch (error: any) {
        console.error('[Contentrain Query] Error:', error);

        // Hata yanıtını standardize et
        if (error instanceof ContentrainError) {
            return {
                success: false,
                data: {
                    data: [],
                    total: 0,
                    pagination: {
                        limit: 10,
                        offset: 0,
                        total: 0,
                    },
                },
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                },
            };
        }

        // H3 hataları için
        if (error.statusCode) {
            return {
                success: false,
                data: {
                    data: [],
                    total: 0,
                    pagination: {
                        limit: 10,
                        offset: 0,
                        total: 0,
                    },
                },
                error: {
                    code: `HTTP_${error.statusCode}`,
                    message: error.statusMessage || 'Unknown error',
                    details: error,
                },
            };
        }

        // Diğer hatalar için
        return {
            success: false,
            data: {
                data: [],
                total: 0,
                pagination: {
                    limit: 10,
                    offset: 0,
                    total: 0,
                },
            },
            error: {
                code: 'UNKNOWN_ERROR',
                message: error.message || 'Unknown error',
                details: error,
            },
        };
    }
});
