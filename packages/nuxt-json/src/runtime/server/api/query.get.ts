import type { ApiResponse, QueryFilter, QueryResult, QuerySort } from '../../../types';
import { defineEventHandler, getQuery } from 'h3';
import { RelationResolver } from '../services/relation-resolver';
import { StorageService } from '../services/storage.service';
import { ContentrainError, ERROR_CODES } from '../utils/errors';
import { applyFilters, sortItems } from '../../utils/query';

export default defineEventHandler(async (event) => {
    try {
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
        if (!modelId || typeof modelId !== 'string') {
            throw new ContentrainError({
                code: ERROR_CODES.INVALID_MODEL_ID,
                message: 'Model ID is required',
            });
        }

        // 2. Model verisini al
        const storageService = StorageService.getInstance();
        const model = await storageService.getModelData(modelId);

        if (!model) {
            throw new ContentrainError({
                code: ERROR_CODES.MODEL_NOT_FOUND,
                message: `Model not found: ${modelId}`,
            });
        }

        let content = [...model.content];
        // Apply locale filter
        if (locale && typeof locale === 'string' && model.metadata.localization) {
            content = content.filter(item => '_lang' in item && item._lang === locale);
        }

        if (filtersStr && typeof filtersStr === 'string') {
            try {
                const filters = JSON.parse(filtersStr) as QueryFilter[];
                content = applyFilters(content as any, filters as any) as typeof content;
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

        if (sortStr && typeof sortStr === 'string') {
            try {
                const sort = JSON.parse(sortStr) as QuerySort[];
                content = sortItems(content as any, sort as any) as typeof content;
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
                const modelList = await storageService.getAllModels() || [];
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
