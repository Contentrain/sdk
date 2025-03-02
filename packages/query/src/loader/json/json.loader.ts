import type { ICacheStats } from 'src/cache/types';
import type { IBaseJSONRecord, IJSONLoaderOptions, IJSONLoaderResult, IJSONModelConfig } from '../types/json';
import { MemoryCache } from '../../cache/memory';
import { loggers } from '../../utils/logger';
import { JSONContentManager } from './managers/content.manager';
import { JSONRelationManager } from './managers/relation.manager';

const logger = loggers.loader;

export class JSONLoader<TData extends IBaseJSONRecord> extends JSONContentManager {
    private readonly relationManager: JSONRelationManager;
    private readonly cache?: MemoryCache;
    private readonly modelConfigs = new Map<string, IJSONModelConfig>();

    constructor(
        private readonly options: IJSONLoaderOptions,
    ) {
        super(options.contentDir, options.defaultLocale);

        this.relationManager = new JSONRelationManager(options.contentDir, options.defaultLocale);

        if (options.cache) {
            this.cache = new MemoryCache({
                maxSize: options.maxCacheSize || 100,
                defaultTTL: options.ttl || 60 * 1000,
            });
        }
    }

    private getCacheKey(modelId: string): string {
        return `json:${modelId}`;
    }

    private getModelTTL(modelId: string): number {
        return this.options.modelTTL?.[modelId] || this.options.ttl || 0;
    }

    async load(modelId: string): Promise<IJSONLoaderResult<TData>> {
        const cacheKey = this.getCacheKey(modelId);

        if (this.options.cache && this.cache) {
            const cached = await this.cache.get<IJSONLoaderResult<TData>>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        try {
            // Model config'i cache'den veya yükle
            let modelConfig = this.modelConfigs.get(modelId);
            if (!modelConfig) {
                modelConfig = await this.loadModelConfig(modelId);
                this.modelConfigs.set(modelId, modelConfig);
            }

            const locales = await this.getModelLocales(modelId);
            const content: { [locale: string]: TData[] } = {};
            if (modelConfig.metadata.localization) {
                for (const locale of locales) {
                    try {
                        const file = await this.loadModelContent<TData>(modelId, locale);
                        content[locale] = file.data;
                    }
                    catch (error: any) {
                        logger.warn('Failed to load content for locale:', {
                            locale,
                            modelId,
                            error: error?.message || 'Unknown error',
                            stack: error?.stack,
                        });
                        if (locale === this.options.defaultLocale) {
                            throw error;
                        }
                    }
                }
            }
            else {
                const file = await this.loadModelContent<TData>(modelId);
                content.default = file.data;
            }

            const assets = await this.loadAssets();

            const result: IJSONLoaderResult<TData> = {
                model: modelConfig,
                content,
                assets,
            };

            if (this.options.cache && this.cache) {
                const ttl = this.getModelTTL(modelId);
                await this.cache.set(cacheKey, result, ttl);
            }

            return result;
        }
        catch (error: any) {
            logger.error('Load error:', {
                modelId,
                error: error?.message || 'Unknown error',
                stack: error?.stack,
                context: {
                    options: this.options,
                    operation: 'load',
                },
            });
            throw error;
        }
    }

    async resolveRelations<TRelation extends IBaseJSONRecord>(
        modelId: string,
        relationKey: keyof TData,
        data: TData[],
    ): Promise<TRelation[]> {
        try {
            return await this.relationManager.resolveRelation<TData, TRelation>(
                modelId,
                relationKey,
                data,
                this.options.defaultLocale,
            );
        }
        catch (error: any) {
            logger.error('Resolve relations error:', {
                modelId,
                relationKey: String(relationKey),
                error: error?.message || 'Unknown error',
                stack: error?.stack,
                context: {
                    options: this.options,
                    operation: 'resolveRelations',
                },
            });
            throw error;
        }
    }

    async clearCache(): Promise<void> {
        if (this.cache) {
            await this.cache.clear();
            this.modelConfigs.clear();
            await this.relationManager.clearCache();
        }
    }

    async refreshCache(modelId: string): Promise<void> {
        const cacheKey = this.getCacheKey(modelId);
        if (this.cache) {
            await this.cache.delete(cacheKey);
            this.modelConfigs.delete(modelId);
            await this.load(modelId);
        }
    }

    override getCacheStats(): ICacheStats {
        const { modelConfigs, contents } = super.getCacheStats();
        return {
            modelConfigs,
            contents,
            cache: this.cache?.getStats() || {
                size: 0,
                hits: 0,
                misses: 0,
                lastCleanup: 0,
            },
        };
    }
}
