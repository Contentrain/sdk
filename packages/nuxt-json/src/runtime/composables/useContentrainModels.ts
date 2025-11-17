import type { ApiResponse, ModelData } from '../../types';
import { computed, onMounted, ref } from 'vue';
import { ContentrainError, createError, ERROR_CODES } from '../server/utils/errors';

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

    const pending = ref(false);
    const error = ref<Error | null>(null);
    const retries = ref(0);
    const _models = ref<ModelData[]>([]);
    const _loaded = ref(false);

    const models = computed(() => _models.value);
    const isLoaded = computed(() => _loaded.value);
    const isLoading = computed(() => pending.value);

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
            const res = await fetch('/_contentrain/api/models');
            const response = await res.json() as ApiResponse<ModelData[]>;
            if (!response.success || !response.data) {
                const payload = response.error;
                throw createError(
                    (payload?.code as typeof ERROR_CODES[keyof typeof ERROR_CODES]) || ERROR_CODES.MODEL_LOAD_ERROR,
                    payload,
                    payload?.message,
                );
            }
            _models.value = response.data;
            _loaded.value = true;
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
            // Önce cache'de var mı?
            const cached = _models.value.find(m => m.metadata.modelId === modelId);
            if (cached) {
                return cached;
            }

            const res = await fetch(`/_contentrain/api/models/${modelId}`);
            const response = await res.json() as ApiResponse<ModelData | null>;
            if (!response.success) {
                const payload = response.error;
                throw createError(
                    (payload?.code as typeof ERROR_CODES[keyof typeof ERROR_CODES]) || ERROR_CODES.MODEL_LOAD_ERROR,
                    payload,
                    payload?.message,
                );
            }
            const result = response.data;
            if (!result) {
                throw createError(ERROR_CODES.MODEL_NOT_FOUND, { modelId });
            }
            _models.value = [..._models.value, result];
            retries.value = 0;
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
        return models.value.some((model: ModelData) => model.metadata.modelId === modelId);
    }

    /**
     * Model getir
     */
    function getModel(modelId: string): ModelData | undefined {
        return models.value.find((model: ModelData) => model.metadata.modelId === modelId);
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
