import type { ApiResponse, ModelData } from '../../../../types';
import { useStorage } from '#imports';
import { defineEventHandler, getRouterParam } from 'h3';
import { ContentrainError, ERROR_CODES } from '../../utils/errors';
import { STORAGE_KEYS, StorageManager } from '../../utils/storage';

export default defineEventHandler(async (event) => {
    try {
        // 1. Storage durumunu kontrol et
        const isReady = await StorageManager.isReady();
        if (!isReady) {
            console.warn('[Contentrain Model] Storage is not ready');
            throw new ContentrainError({
                code: ERROR_CODES.STORAGE_NOT_READY,
                message: 'Storage is not ready',
            });
        }

        const modelId = getRouterParam(event, 'id');
        console.debug('[Contentrain Model] Fetching model:', modelId);

        if (!modelId) {
            throw new ContentrainError({
                code: ERROR_CODES.INVALID_MODEL_ID,
                message: 'Model ID is required',
            });
        }

        // 2. Model verisini al
        const storage = useStorage('data');
        const modelData = await storage.getItem<ModelData>(STORAGE_KEYS.MODEL_DATA(modelId));

        if (!modelData) {
            console.warn(`[Contentrain Model] Model not found: ${modelId}`);
            throw new ContentrainError({
                code: ERROR_CODES.MODEL_NOT_FOUND,
                message: `Model not found: ${modelId}`,
            });
        }

        console.debug(`[Contentrain Model] Found model: ${modelId}`, {
            contentLength: modelData.content.length,
            hasLocalization: modelData.metadata.localization,
        });

        // Standardize API yanıtı
        const response: ApiResponse<ModelData> = {
            success: true,
            data: modelData,
        };

        return response;
    }
    catch (error: any) {
        console.error('[Contentrain Model] Error:', error);

        // Hata yanıtını standardize et
        if (error instanceof ContentrainError) {
            return {
                success: false,
                data: null,
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
                data: null,
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
            data: null,
            error: {
                code: 'UNKNOWN_ERROR',
                message: error.message || 'Unknown error',
                details: error,
            },
        };
    }
});
