import type { ApiResponse, ModelData } from '../../../../types';
import { defineEventHandler, getRouterParam } from 'h3';
import { StorageService } from '../../services/storage.service';
import { ContentrainError, ERROR_CODES } from '../../utils/errors';

export default defineEventHandler(async (event) => {
    try {
        const modelId = getRouterParam(event, 'id');

        if (!modelId) {
            throw new ContentrainError({
                code: ERROR_CODES.INVALID_MODEL_ID,
                message: 'Model ID is required',
            });
        }

        // StorageService ile model verisini al
        const storageService = StorageService.getInstance();
        const modelData = await storageService.getModelData(modelId);

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

        // Genel hata durumu
        return {
            success: false,
            data: null,
            error: {
                code: ERROR_CODES.UNKNOWN_ERROR,
                message: error.message || 'An unknown error occurred',
                details: error,
            },
        };
    }
});
