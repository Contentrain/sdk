import type { Ref } from 'vue';
import type { ApiResponse, ModelData, ModelResult } from '../../types';
import { ref } from 'vue';

export class ContentrainModels {
    private models: Ref<ModelData[]>;
    private model: Ref<ModelData | null>;
    private loading: Ref<boolean>;
    private error: Ref<Error | null>;

    constructor() {
        this.models = ref<ModelData[]>([]);
        this.model = ref<ModelData | null>(null);
        this.loading = ref<boolean>(false);
        this.error = ref<Error | null>(null);
    }

    async get(modelId: string): Promise<ModelResult<ModelData | null>> {
        try {
            this.loading.value = true;
            const response = await $fetch<ApiResponse<ModelData>>(`/_contentrain/api/models/${modelId}`);

            if (response.success && response.data) {
                this.model.value = response.data;
                return {
                    data: response.data,
                    metadata: {
                        modelId,
                        timestamp: Date.now(),
                    },
                };
            }
            else {
                console.error('[Contentrain] Error fetching model:', response.error);
                this.error.value = new Error(response.error?.message || 'Unknown error');
                this.model.value = null;
                return {
                    data: null,
                    metadata: {
                        modelId,
                        timestamp: Date.now(),
                    },
                };
            }
        }
        catch (error) {
            console.error('[Contentrain] Error fetching model:', error);
            this.error.value = error as Error;
            this.model.value = null;
            return {
                data: null,
                metadata: {
                    modelId,
                    timestamp: Date.now(),
                },
            };
        }
        finally {
            this.loading.value = false;
        }
    }

    async getAll(): Promise<ModelResult<ModelData[]>> {
        try {
            this.loading.value = true;
            const response = await $fetch<ApiResponse<ModelData[]>>('/_contentrain/api/models');

            if (response.success && response.data) {
                this.models.value = response.data;
                return {
                    data: response.data,
                    metadata: {
                        modelId: 'all',
                        timestamp: Date.now(),
                    },
                };
            }
            else {
                console.error('[Contentrain] Error fetching models:', response.error);
                this.error.value = new Error(response.error?.message || 'Unknown error');
                this.models.value = [];
                return {
                    data: [],
                    metadata: {
                        modelId: 'all',
                        timestamp: Date.now(),
                    },
                };
            }
        }
        catch (error) {
            console.error('[Contentrain] Error fetching models:', error);
            this.error.value = error as Error;
            this.models.value = [];
            return {
                data: [],
                metadata: {
                    modelId: 'all',
                    timestamp: Date.now(),
                },
            };
        }
        finally {
            this.loading.value = false;
        }
    }

    useModel(): Ref<ModelData | null> {
        return this.model;
    }

    useModels(): Ref<ModelData[]> {
        return this.models;
    }

    useLoading(): Ref<boolean> {
        return this.loading;
    }

    useError(): Ref<Error | null> {
        return this.error;
    }
}

export function useContentrainModels(): ContentrainModels {
    return new ContentrainModels();
}
