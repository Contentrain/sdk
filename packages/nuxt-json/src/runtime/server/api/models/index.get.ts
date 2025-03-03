import type { ApiResponse, ModelData } from '../../../../types';
import { defineEventHandler } from 'h3';
import { StorageService } from '../../services/storage.service';
import { ContentrainError, ERROR_CODES } from '../../utils/errors';

export default defineEventHandler(async () => {
    try {
        // StorageService ile tüm modelleri al
        const storageService = StorageService.getInstance();
        const modelList = await storageService.getAllModels();
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

        // Genel hata durumu
        return {
            success: false,
            data: [],
            error: {
                code: ERROR_CODES.UNKNOWN_ERROR,
                message: error.message || 'An unknown error occurred',
                details: error,
            },
        };
    }
});
