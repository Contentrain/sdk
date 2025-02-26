import type { Ref } from 'vue';
import type { ModelData } from '../../types';
import { ref } from 'vue';

export class ContentrainModels {
    private models: Ref<ModelData[]>;
    private model: Ref<ModelData | null>;

    constructor() {
        this.models = ref<ModelData[]>([]);
        this.model = ref<ModelData | null>(null);
    }

    async get(modelId: string): Promise<ModelData | null> {
        try {
            const model = await $fetch<ModelData>(`/_contentrain/api/models/${modelId}`);
            this.model.value = model;
            return model;
        }
        catch (error) {
            console.error('[Contentrain] Error fetching model:', error);
            this.model.value = null;
            return null;
        }
    }

    async getAll(): Promise<ModelData[]> {
        try {
            const models = await $fetch<ModelData[]>('/_contentrain/api/models');
            this.models.value = models;
            return models;
        }
        catch (error) {
            console.error('[Contentrain] Error fetching models:', error);
            this.models.value = [];
            return [];
        }
    }

    useModel(): Ref<ModelData | null> {
        return this.model;
    }

    useModels(): Ref<ModelData[]> {
        return this.models;
    }
}

export function useContentrainModels(): ContentrainModels {
    return new ContentrainModels();
}
