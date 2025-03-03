import type { Content, LocalizedContent, ModelData, ModelMetadata } from '../../../types';
import { useStorage } from '#imports';
import { ContentrainError, ERROR_CODES } from '../utils/errors';

export class StorageService {
    private static instance: StorageService;
    private storage = useStorage('assets:contentrain');
    private modelCache: Map<string, ModelData> = new Map();
    private modelListCache: ModelData[] | null = null;

    private constructor() {}

    static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    /**
     * Model metadata'sını okur ve cache'ler
     */
    private async getModelMetadata(): Promise<ModelMetadata[]> {
        try {
            const metadata = await this.storage.getItem<ModelMetadata[]>('metadata.json');

            if (!metadata) {
                throw new ContentrainError({
                    code: ERROR_CODES.METADATA_NOT_FOUND,
                    message: 'Model metadata not found',
                });
            }
            return metadata;
        }
        catch (error) {
            console.error('[Contentrain Storage] Error reading metadata:', error);
            throw error;
        }
    }

    /**
     * Model tanımını okur
     */
    private async getModelDefinition(modelId: string): Promise<any[]> {
        try {
            const definition = await this.storage.getItem<any[]>(`${modelId}/definition.json`);

            if (!definition) {
                throw new ContentrainError({
                    code: ERROR_CODES.MODEL_NOT_FOUND,
                    message: `Model definition not found: ${modelId}`,
                });
            }
            return definition;
        }
        catch (error) {
            console.error(`[Contentrain Storage] Error reading model definition: ${modelId}`, error);
            throw error;
        }
    }

    /**
     * Model içeriğini okur
     */
    private async getModelContent(modelId: string, isLocalized: boolean): Promise<(Content | LocalizedContent)[]> {
        try {
            let content: (Content | LocalizedContent)[] = [];

            if (isLocalized) {
                const languages = ['en', 'tr'];
                for (const lang of languages) {
                    const localeContent = await this.storage.getItem<any[]>(`${modelId}/${lang}.json`);
                    if (!localeContent) {
                        continue;
                    }

                    const localizedContent = localeContent.map(item => ({
                        ...item,
                        _lang: lang,
                    }));
                    content.push(...localizedContent);
                }
            }
            else {
                const modelContent = await this.storage.getItem<any[]>(`${modelId}/content.json`);
                if (modelContent) {
                    content = modelContent;
                }
            }
            return content;
        }
        catch (error) {
            console.error(`[Contentrain Storage] Error reading content: ${modelId}`, error);
            throw error;
        }
    }

    /**
     * Belirli bir modelin verilerini getirir
     */
    async getModelData(modelId: string): Promise<ModelData> {
        try {
            const cachedModel = this.modelCache.get(modelId);
            if (cachedModel) {
                return cachedModel;
            }

            const allMetadata = await this.getModelMetadata();
            const metadata = allMetadata.find(m => m.modelId === modelId);

            if (!metadata) {
                throw new ContentrainError({
                    code: ERROR_CODES.MODEL_NOT_FOUND,
                    message: `Model metadata not found: ${modelId}`,
                });
            }

            const fields = await this.getModelDefinition(modelId);
            const content = await this.getModelContent(modelId, metadata.localization);

            const modelData: ModelData = {
                metadata,
                fields,
                content,
            };

            this.modelCache.set(modelId, modelData);

            return modelData;
        }
        catch (error) {
            console.error(`[Contentrain Storage] Error getting model data: ${modelId}`, error);
            throw error;
        }
    }

    /**
     * Tüm modellerin listesini getirir
     */
    async getAllModels(): Promise<ModelData[]> {
        try {
            if (this.modelListCache) {
                return this.modelListCache;
            }

            const metadata = await this.getModelMetadata();
            const modelPromises = metadata.map(async (meta) => {
                try {
                    return await this.getModelData(meta.modelId);
                }
                catch {
                    return null;
                }
            });

            const models = (await Promise.all(modelPromises)).filter(Boolean) as ModelData[];
            this.modelListCache = models;
            return models;
        }
        catch (error) {
            console.error('[Contentrain Storage] Error getting all models:', error);
            throw error;
        }
    }

    /**
     * Cache'i temizler
     */
    clearCache(): void {
        this.modelCache.clear();
        this.modelListCache = null;
    }
}
