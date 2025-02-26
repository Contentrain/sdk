import type { ModelData } from '../../../../types';
import { useStorage } from '#imports';
import { createError, defineEventHandler } from 'h3';
import { STORAGE_KEYS, StorageManager } from '../../utils/storage';

export default defineEventHandler(async () => {
    try {
        // 1. Storage durumunu kontrol et
        const isReady = await StorageManager.isReady();
        if (!isReady) {
            console.warn('[Contentrain Models] Storage is not ready');
            throw createError({
                statusCode: 503,
                statusMessage: 'Storage is not ready',
            });
        }

        // 2. Model listesini al
        const storage = useStorage('data');
        const modelList = await storage.getItem<ModelData[]>(STORAGE_KEYS.MODEL_LIST);

        if (!modelList) {
            console.warn('[Contentrain Models] No models found in storage');
            return [];
        }

        console.debug('[Contentrain Models] Found models:', {
            count: modelList.length,
            models: modelList.map(m => m.metadata.modelId),
        });

        return modelList;
    }
    catch (error) {
        console.error('[Contentrain Models] Error:', error);
        throw error;
    }
});
