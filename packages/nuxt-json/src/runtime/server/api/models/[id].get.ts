import type { ModelData } from '../../../../types';
import { useStorage } from '#imports';
import { createError, defineEventHandler, getRouterParam } from 'h3';
import { STORAGE_KEYS, StorageManager } from '../../utils/storage';

export default defineEventHandler(async (event) => {
    try {
        // 1. Storage durumunu kontrol et
        const isReady = await StorageManager.isReady();
        if (!isReady) {
            console.warn('[Contentrain Model] Storage is not ready');
            throw createError({
                statusCode: 503,
                statusMessage: 'Storage is not ready',
            });
        }

        const modelId = getRouterParam(event, 'id');
        console.debug('[Contentrain Model] Fetching model:', modelId);

        if (!modelId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Model ID is required',
            });
        }

        // 2. Model verisini al
        const storage = useStorage('data');
        const modelData = await storage.getItem<ModelData>(STORAGE_KEYS.MODEL_DATA(modelId));

        if (!modelData) {
            console.warn(`[Contentrain Model] Model not found: ${modelId}`);
            throw createError({
                statusCode: 404,
                statusMessage: `Model not found: ${modelId}`,
            });
        }

        console.debug(`[Contentrain Model] Found model: ${modelId}`, {
            contentLength: modelData.content.length,
            hasLocalization: modelData.metadata.localization,
        });

        return modelData;
    }
    catch (error) {
        console.error('[Contentrain Model] Error:', error);
        throw error;
    }
});
