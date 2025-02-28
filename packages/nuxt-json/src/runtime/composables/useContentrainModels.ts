import type { ModelData } from '../../types';
import { computed, onMounted, ref } from 'vue';
import { ContentrainError, createError, ERROR_CODES } from '../server/utils/errors';
import { useContentrainClient } from './useContentrainClient';

export interface UseContentrainModelsOptions {
    autoLoad?: boolean
    retryCount?: number
    retryDelay?: number
}

export function useContentrainModels(options: UseContentrainModelsOptions = {}) {
    const {
        autoLoad = true,
        retryCount = 3,
        retryDelay = 1000,
    } = options;

    const client = useContentrainClient();
    const pending = ref(false);
    const error = ref<Error | null>(null);
    const retries = ref(0);

    // Client'dan modelleri al
    const models = computed(() => client.models.value);
    const isLoaded = computed(() => client.isLoaded.value);
    const isLoading = computed(() => client.isLoading.value || pending.value);

    /**
     * Tüm modelleri yükle
     */
    async function loadModels(): Promise<ModelData[]> {
        if (isLoaded.value || isLoading.value) {
            return models.value;
        }

        pending.value = true;
        error.value = null;

        try {
            await client.loadModels();
            retries.value = 0;
            return models.value;
        }
        catch (err) {
            error.value = err instanceof ContentrainError ? err : createError(ERROR_CODES.MODEL_LOAD_ERROR, err);

            // Yeniden deneme mantığı
            if (retries.value < retryCount) {
                retries.value++;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return await loadModels();
            }

            throw error.value;
        }
        finally {
            pending.value = false;
        }
    }

    /**
     * Belirli bir modeli yükle
     */
    async function loadModel(modelId: string): Promise<ModelData | null> {
        if (!modelId) {
            throw createError(ERROR_CODES.INVALID_MODEL_ID);
        }

        pending.value = true;
        error.value = null;

        try {
            const result = await client.loadModel(modelId);
            if (!result) {
                throw createError(ERROR_CODES.MODEL_NOT_FOUND, { modelId });
            }
            return result;
        }
        catch (err) {
            error.value = err instanceof ContentrainError ? err : createError(ERROR_CODES.MODEL_LOAD_ERROR, err);

            // Yeniden deneme mantığı
            if (retries.value < retryCount) {
                retries.value++;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return await loadModel(modelId);
            }

            throw error.value;
        }
        finally {
            pending.value = false;
        }
    }

    /**
     * Model var mı kontrol et
     */
    function hasModel(modelId: string): boolean {
        return models.value.some(model => model.metadata.modelId === modelId);
    }

    /**
     * Model getir
     */
    function getModel(modelId: string): ModelData | undefined {
        return models.value.find(model => model.metadata.modelId === modelId);
    }

    // Otomatik yükleme
    if (autoLoad) {
        onMounted(async () => {
            if (!isLoaded.value && !isLoading.value) {
                try {
                    await loadModels();
                }
                catch (err) {
                    error.value = err instanceof ContentrainError ? err : createError(ERROR_CODES.MODEL_LOAD_ERROR, err);
                }
            }
        });
    }

    return {
        models,
        isLoaded,
        isLoading,
        error,
        retries,
        loadModels,
        loadModel,
        hasModel,
        getModel,
    };
}
