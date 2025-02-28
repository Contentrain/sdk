import type { ContentrainOptions } from '../../module';
import type {
    Content,
    LocalizedContent,
    ModelData,
    QueryFilter,
    QueryResult,
    QuerySort,
} from '../../types';
import { useRequestURL, useRuntimeConfig } from 'nuxt/app';
import { $fetch } from 'ofetch';
import { reactive, ref } from 'vue';
import { ContentrainError, createError, ERROR_CODES } from '../server/utils/errors';

/**
 * Client-side veri yönetimi için ContentrainClient sınıfı
 */
export class ContentrainClient {
    private static instance: ContentrainClient;
    private _models = ref<ModelData[]>([]);
    private _modelsMap = reactive(new Map<string, ModelData>());
    private _isLoaded = ref(false);
    private _isLoading = ref(false);
    private _error = ref<Error | null>(null);
    private _autoLoadInitiated = false;
    private _baseURL: string;

    private constructor() {
        // Singleton
        this._baseURL = this.getBaseURL();
    }

    /**
     * Singleton instance'ı döndürür
     */
    public static getInstance(): ContentrainClient {
        if (!ContentrainClient.instance) {
            ContentrainClient.instance = new ContentrainClient();
        }
        return ContentrainClient.instance;
    }

    /**
     * Base URL'yi oluştur
     */
    private getBaseURL(): string {
        try {
            if (this.isBrowser()) {
                return window.location.origin;
            }
            // SSR için request URL'den al
            const requestURL = useRequestURL();
            return `${requestURL.protocol}//${requestURL.host}`;
        }
        catch (error) {
            throw createError(ERROR_CODES.INVALID_URL_ERROR, error);
        }
    }

    /**
     * Prerender edilmiş dosyaların yolunu oluşturur
     */
    private getPrerenderPath(path: string): string {
        try {
            const config = useRuntimeConfig();
            const contentrain = config.public.contentrain as ContentrainOptions;
            const outputDir = contentrain.outputDir || '_contentrain';
            const basePath = this._baseURL || this.getBaseURL();

            // URL oluştur
            const url = new URL(`${outputDir}/${path}`, basePath);
            return url.toString();
        }
        catch (error) {
            throw createError(ERROR_CODES.INVALID_URL_ERROR, error);
        }
    }

    /**
     * Tarayıcı ortamında olup olmadığımızı kontrol eder
     */
    private isBrowser(): boolean {
        return typeof window !== 'undefined';
    }

    /**
     * Tüm model verilerini yükler
     */
    public async loadModels(): Promise<void> {
        if (this._isLoaded.value || this._isLoading.value) {
            return;
        }

        try {
            this._isLoading.value = true;
            this._error.value = null;

            // Prerender edilmiş models.json dosyasını yükle
            const modelPath = this.getPrerenderPath('models.json');

            // $fetch için opsiyonlar
            const fetchOptions = {
                retry: 3,
                retryDelay: 500,
                headers: {
                    'Cache-Control': 'no-cache',
                },
            };

            const models = await $fetch<ModelData[]>(modelPath, fetchOptions);
            if (!models || !Array.isArray(models)) {
                throw createError(ERROR_CODES.INVALID_DATA_ERROR, 'Invalid models data received');
            }

            this._models.value = models;

            // Model haritasını güncelle
            this._modelsMap.clear();
            for (const model of models) {
                if (model?.metadata?.modelId) {
                    this._modelsMap.set(model.metadata.modelId, model);
                }
            }

            this._isLoaded.value = true;
        }
        catch (error) {
            this._error.value = error instanceof ContentrainError ? error : createError(ERROR_CODES.MODEL_LOAD_ERROR, error);
            throw this._error.value;
        }
        finally {
            this._isLoading.value = false;
        }
    }

    /**
     * Modellere erişim sağlar, gerekirse otomatik olarak yükler
     */
    public async getModels(): Promise<ModelData[]> {
        // Otomatik yükleme kontrolü
        if (!this._isLoaded.value && !this._isLoading.value && !this._autoLoadInitiated) {
            this._autoLoadInitiated = true;
            try {
                const config = useRuntimeConfig();
                const contentrain = config.public.contentrain as ContentrainOptions;
                if (contentrain.outputDir) {
                    console.info('[Contentrain] Auto-loading models...');
                    await this.loadModels();
                }
            }
            catch (error) {
                console.error('[Contentrain] Error auto-loading models:', error);
            }
        }

        return this._models.value;
    }

    /**
     * Belirli bir modeli yükler
     */
    public async loadModel(modelId: string): Promise<ModelData | null> {
        if (!modelId) {
            throw createError(ERROR_CODES.INVALID_MODEL_ID);
        }

        if (this._modelsMap.has(modelId)) {
            return this._modelsMap.get(modelId) || null;
        }

        try {
            this._isLoading.value = true;
            this._error.value = null;

            // Prerender edilmiş model dosyasını yükle
            const modelPath = this.getPrerenderPath(`model-${modelId}.json`);

            // $fetch için opsiyonlar
            const fetchOptions = {
                retry: 3,
                retryDelay: 500,
                headers: {
                    'Cache-Control': 'no-cache',
                },
            };

            const model = await $fetch<ModelData>(modelPath, fetchOptions);
            if (!model?.metadata?.modelId) {
                throw createError(ERROR_CODES.INVALID_DATA_ERROR, 'Invalid model data received');
            }

            this._modelsMap.set(modelId, model);

            // Modeller listesini güncelle
            if (!this._models.value.some(m => m.metadata.modelId === modelId)) {
                this._models.value = [...this._models.value, model];
            }

            return model;
        }
        catch (error) {
            this._error.value = error instanceof ContentrainError ? error : createError(ERROR_CODES.MODEL_LOAD_ERROR, error);
            throw this._error.value;
        }
        finally {
            this._isLoading.value = false;
        }
    }

    /**
     * Sorgu işleme
     */
    public async query<T extends Content | LocalizedContent>(
        modelId: string,
        params: {
            locale?: string
            filters?: QueryFilter<T>[]
            sort?: QuerySort<T>[]
            limit?: number
            offset?: number
            include?: string[]
        },
    ): Promise<QueryResult<T>> {
        let model = this._modelsMap.get(modelId);
        if (!model) {
            const loadedModel = await this.loadModel(modelId);
            if (!loadedModel) {
                return {
                    data: [] as T[],
                    total: 0,
                    pagination: {
                        limit: params.limit || 10,
                        offset: params.offset || 0,
                        total: 0,
                    },
                };
            }
            model = loadedModel;
        }

        // İçeriği kopyala
        let content = [...model.content] as T[];

        // Locale filtresi uygula
        if (params.locale && model.metadata.localization) {
            content = content.filter(item => '_lang' in item && item._lang === params.locale);
        }

        // Filtreleri uygula
        if (params.filters && params.filters.length > 0) {
            content = content.filter(item =>
                params.filters!.every((filter) => {
                    const value = item[filter.field];
                    const compareValue = filter.value;

                    switch (filter.operator) {
                        case 'eq':
                            return value === compareValue;
                        case 'ne':
                            return value !== compareValue;
                        case 'gt':
                            return typeof value === 'number' && typeof compareValue === 'number' && value > compareValue;
                        case 'gte':
                            return typeof value === 'number' && typeof compareValue === 'number' && value >= compareValue;
                        case 'lt':
                            return typeof value === 'number' && typeof compareValue === 'number' && value < compareValue;
                        case 'lte':
                            return typeof value === 'number' && typeof compareValue === 'number' && value <= compareValue;
                        case 'in':
                            return Array.isArray(compareValue) && compareValue.includes(value);
                        case 'nin':
                            return Array.isArray(compareValue) && !compareValue.includes(value);
                        case 'contains':
                            return typeof value === 'string' && typeof compareValue === 'string' && value.includes(compareValue);
                        case 'startsWith':
                            return typeof value === 'string' && typeof compareValue === 'string' && value.startsWith(compareValue);
                        case 'endsWith':
                            return typeof value === 'string' && typeof compareValue === 'string' && value.endsWith(compareValue);
                        default:
                            return true;
                    }
                }),
            );
        }

        // Sıralamayı uygula
        if (params.sort && params.sort.length > 0) {
            content.sort((a, b) => {
                for (const { field, direction } of params.sort!) {
                    const aValue = a[field];
                    const bValue = b[field];

                    if (aValue === bValue)
                        continue;

                    if (typeof aValue === 'number' && typeof bValue === 'number') {
                        const modifier = direction === 'asc' ? 1 : -1;
                        return aValue > bValue ? modifier : -modifier;
                    }

                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                        return direction === 'asc'
                            ? aValue.localeCompare(bValue)
                            : bValue.localeCompare(aValue);
                    }
                }
                return 0;
            });
        }

        // Toplam sayıyı al
        const total = content.length;

        // Sayfalama uygula
        const limit = params.limit || 10;
        const offset = params.offset || 0;
        content = content.slice(offset, offset + limit);

        // İlişkileri çöz
        if (params.include && params.include.length > 0) {
            content = await this.resolveRelations(model, content, params.include, params.locale);
        }

        return {
            data: content,
            total,
            pagination: {
                limit,
                offset,
                total,
            },
        };
    }

    /**
     * İlişkileri çözümle
     */
    private async resolveRelations<T extends Content | LocalizedContent>(
        sourceModel: ModelData,
        content: T[],
        relations: string[],
        locale?: string,
    ): Promise<T[]> {
        if (!relations.length) {
            return content;
        }

        // Tüm modellerin yüklü olduğundan emin ol
        if (!this._isLoaded.value) {
            console.info('[Contentrain Client] Loading all models for relations...');
            await this.loadModels();
        }

        const resolvedContent = await Promise.all(content.map(async (item) => {
            const resolvedItem = { ...item, _relations: {} } as T & { _relations: Record<string, unknown> };

            for (const relation of relations) {
                console.debug(`[Contentrain Client] Resolving relation "${relation}" for model "${sourceModel.metadata.modelId}"`);

                // İlişki alanını bul
                const field = sourceModel.fields.find(f =>
                    f.name === relation
                    || f.fieldId === relation,
                );
                if (!field) {
                    throw createError(ERROR_CODES.FIELD_NOT_FOUND, {
                        modelId: sourceModel.metadata.modelId,
                        field: relation,
                        message: `Field not found with name or fieldId: ${relation}`,
                    });
                }

                if (field.fieldType !== 'relation') {
                    throw createError(ERROR_CODES.INVALID_RELATION, {
                        modelId: sourceModel.metadata.modelId,
                        field: relation,
                        fieldType: field.fieldType,
                        message: `Field ${field.name} (${field.fieldId}) is not a relation field`,
                    });
                }

                // Hedef model ID'sini al
                const targetModelId = field.options?.reference?.form?.reference?.value;
                if (!targetModelId) {
                    throw createError(ERROR_CODES.INVALID_RELATION, {
                        modelId: sourceModel.metadata.modelId,
                        field: relation,
                        reason: 'Missing target model reference',
                    });
                }

                console.debug(`[Contentrain Client] Target model for relation "${relation}": "${targetModelId}"`);

                // Hedef modeli yükle
                let targetModel = this._modelsMap.get(targetModelId);
                if (!targetModel) {
                    console.info(`[Contentrain Client] Loading target model "${targetModelId}" for relation "${relation}"`);
                    const loadedModel = await this.loadModel(targetModelId);
                    if (!loadedModel) {
                        console.error(`[Contentrain Client] Target model "${targetModelId}" not found for relation "${relation}"`);
                        continue;
                    }
                    targetModel = loadedModel;
                }

                // İlişki değerini al
                const relationValue = item[field.fieldId];
                if (!relationValue) {
                    throw createError(ERROR_CODES.RELATION_NOT_FOUND, {
                        modelId: sourceModel.metadata.modelId,
                        field: field.name,
                        fieldId: field.fieldId,
                        itemId: item.ID,
                    });
                }

                // İlişki ID'lerini dizi olarak al
                const relationIds = Array.isArray(relationValue) ? relationValue : [relationValue];
                if (!relationIds.length) {
                    throw createError(ERROR_CODES.INVALID_RELATION, {
                        modelId: sourceModel.metadata.modelId,
                        field: field.name,
                        fieldId: field.fieldId,
                        itemId: item.ID,
                    });
                }

                // İlişkili içerikleri bul
                const isLocalizedTarget = targetModel.metadata.localization;
                const resolvedRelations = relationIds
                    .map((id) => {
                        const contentId = String(id);
                        let found: Content | LocalizedContent | undefined;

                        if (isLocalizedTarget && locale) {
                            found = targetModel.content.find(
                                content =>
                                    '_lang' in content
                                    && content.ID === contentId
                                    && content._lang === locale,
                            );

                            if (!found) {
                                throw createError(ERROR_CODES.CONTENT_NOT_FOUND, {
                                    modelId: targetModelId,
                                    contentId,
                                    locale,
                                });
                            }
                        }
                        else {
                            found = targetModel.content.find(content => content.ID === contentId);
                            if (!found) {
                                throw createError(ERROR_CODES.CONTENT_NOT_FOUND, {
                                    modelId: targetModelId,
                                    contentId,
                                });
                            }
                        }

                        return found;
                    })
                    .filter(Boolean);

                // İlişki tipine göre değeri ata
                resolvedItem._relations[relation] = field.componentId === 'one-to-many'
                    ? resolvedRelations
                    : resolvedRelations[0];

                console.debug(`[Contentrain Client] Successfully resolved relation "${relation}" for item ${item.ID}`);
            }

            return resolvedItem;
        }));

        return resolvedContent;
    }

    /**
     * Getter metodları
     */
    public get models() {
        return this._models;
    }

    public get isLoaded() {
        return this._isLoaded;
    }

    public get isLoading() {
        return this._isLoading;
    }

    public get error() {
        return this._error;
    }
}

/**
 * Client-side Contentrain verilerine erişim için composable
 */
export function useContentrainClient() {
    return ContentrainClient.getInstance();
}
