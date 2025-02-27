import type { ApiResponse, ModelData } from '../../../../types';
import { useStorage } from '#imports';
import { defineEventHandler } from 'h3';
import { ContentrainError, ERROR_CODES } from '../../utils/errors';
import { STORAGE_KEYS, StorageManager } from '../../utils/storage';

export default defineEventHandler(async () => {
    try {
        // 1. Storage durumunu kontrol et
        const isReady = await StorageManager.isReady();
        if (!isReady) {
            console.warn('[Contentrain Models] Storage is not ready');
            throw new ContentrainError({
                code: ERROR_CODES.STORAGE_NOT_READY,
                message: 'Storage is not ready',
            });
        }

        // 2. Model listesini al
        const storage = useStorage('data');
        const modelList = await storage.getItem<ModelData[]>(STORAGE_KEYS.MODEL_LIST);

        if (!modelList) {
            console.warn('[Contentrain Models] No models found in storage');
            // Boş liste dönmek yerine başarılı bir yanıt dönelim
            return {
                success: true,
                data: [],
            };
        }

        console.debug('[Contentrain Models] Found models:', {
            count: modelList.length,
            models: modelList.map(m => m.metadata.modelId),
        });

        // Standardize API yanıtı
        const response: ApiResponse<ModelData[]> = {
            success: true,
            data: modelList,
        };

        return response;
    }
    catch (error: any) {
        console.error('[Contentrain Models] Error:', error);

        // Hata yanıtını standardize et
        if (error instanceof ContentrainError) {
            return {
                success: false,
                data: [],
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
                data: [],
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
            data: [],
            error: {
                code: 'UNKNOWN_ERROR',
                message: error.message || 'Unknown error',
                details: error,
            },
        };
    }
});
