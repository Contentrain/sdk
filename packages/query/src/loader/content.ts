import type { AssetMetadata, ContentFile, ContentLoaderOptions, LoaderResult, ModelConfig, RelationConfig } from '../types/loader';
import type { BaseContentrainType, FieldMetadata, ModelMetadata } from '../types/model';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MemoryCache } from '../cache/memory';
import { loggers } from '../utils/logger';

const logger = loggers.loader;

export class ContentLoader {
  private options: ContentLoaderOptions;
  private modelConfigs: Map<string, ModelConfig> = new Map();
  private relations: Map<string, RelationConfig[]> = new Map();
  private cache: MemoryCache;

  constructor(options: ContentLoaderOptions) {
    this.options = {
      defaultLocale: 'en',
      cache: true,
      ttl: 60 * 1000, // 1 minute
      maxCacheSize: 100, // 100 MB
      ...options,
    };

    this.cache = new MemoryCache({
      maxSize: this.options.maxCacheSize,
      defaultTTL: this.options.ttl,
    });
  }

  private getCacheKey(model: string): string {
    return `${model}`;
  }

  private getModelTTL(model: string): number {
    return this.options.modelTTL?.[model] || this.options.ttl || 0;
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  async refreshCache(model: string): Promise<void> {
    const cacheKey = this.getCacheKey(model);
    await this.cache.delete(cacheKey);
    await this.load(model);
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  private async loadModelConfig(model: string): Promise<ModelConfig> {
    try {
      // First read general metadata
      const metadataPath = join(this.options.contentDir, 'models', 'metadata.json');
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const allMetadata = JSON.parse(metadataContent);

      // Find model specific metadata
      const modelMetadata = allMetadata.find((m: ModelMetadata) => m.modelId === model);
      if (!modelMetadata) {
        logger.error('Model metadata not found:', {
          model,
          metadataPath,
        });
        throw new Error(`Model metadata not found for ${model}`);
      }

      // Read model fields
      const modelPath = join(this.options.contentDir, 'models', `${model}.json`);
      const modelContent = await readFile(modelPath, 'utf-8');
      const modelFields = JSON.parse(modelContent) as FieldMetadata[];

      return {
        metadata: modelMetadata,
        fields: modelFields,
      };
    }
    catch (error: any) {
      logger.error('Failed to load model config:', {
        model,
        error: error?.message || 'Unknown error',
      });
      throw new Error(`Failed to load model config for ${model}: ${error?.message || 'Unknown error'}`);
    }
  }

  private async loadContentFile<T extends BaseContentrainType>(
    model: string,
    locale: string = 'default',
  ): Promise<ContentFile<T>> {
    try {
      const modelConfig = await this.loadModelConfig(model);
      let contentPath: string;

      if (modelConfig.metadata.localization) {
        if (!locale || locale === 'default') {
          if (!this.options.defaultLocale) {
            logger.error('Default locale is required for localized model:', {
              model,
            });
            throw new Error(`Default locale is required for localized model "${model}"`);
          }
          locale = this.options.defaultLocale;
        }
        contentPath = join(this.options.contentDir, model, `${locale}.json`);
      }
      else {
        if (locale !== 'default') {
          console.warn(`Locale "${locale}" specified for non-localized model "${model}". This parameter will be ignored.`);
        }
        contentPath = join(this.options.contentDir, model, `${model}.json`);
      }

      const content = await readFile(contentPath, 'utf-8');
      try {
        const data = JSON.parse(content) as T[];
        return {
          model,
          locale: modelConfig.metadata.localization ? locale : undefined,
          data,
        };
      }
      catch {
        logger.error('Failed to load content:', {
          model,
          locale,
          contentPath,
        });
        throw new Error(`Failed to load content: Invalid JSON format in ${contentPath}`);
      }
    }
    catch (error: any) {
      if (error.message.includes('Invalid JSON format')) {
        logger.error('Failed to load content:', {
          model,
          locale,
        });
        throw error;
      }
      throw new Error(
        `Failed to load content file for ${model}${locale ? ` (${locale})` : ''}: ${
          error?.message || 'Unknown error'
        }`,
      );
    }
  }

  private async loadRelations(model: string): Promise<RelationConfig[]> {
    try {
      // Get model config
      const modelConfig = this.modelConfigs.get(model);
      if (!modelConfig) {
        throw new Error(`Model config not found for ${model}`);
      }

      // Find relation fields
      const relationFields = modelConfig.fields.filter((field) => {
        return field.fieldType === 'relation';
      });

      // Create relation configs
      return relationFields.map((field) => {
        const options = field.options;
        const reference = options?.reference?.form?.reference?.value;

        if (!reference) {
          throw new Error(`Reference not found for relation field: ${field.name}`);
        }

        return {
          model: reference,
          type: field.componentId === 'one-to-one' ? 'one-to-one' : 'one-to-many',
          foreignKey: field.fieldId,
        };
      });
    }
    catch (error: any) {
      throw new Error(`Failed to load relations for ${model}: ${error?.message || 'Unknown error'}`);
    }
  }

  private async getModelLocales(model: string, modelConfig: ModelConfig): Promise<string[]> {
    try {
      if (!modelConfig.metadata.localization) {
        return ['default'];
      }

      const modelDir = join(this.options.contentDir, model);
      const files = await readdir(modelDir);

      // Filter .json files and remove extension
      const locales = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .filter(locale => locale !== model); // exclude model.json file

      if (locales.length === 0) {
        if (!this.options.defaultLocale) {
          throw new Error(`No locale files found for localized model "${model}" and no default locale specified`);
        }
        return [this.options.defaultLocale];
      }

      return locales;
    }
    catch (error: any) {
      if (!this.options.defaultLocale) {
        throw new Error(`Failed to read locales for model ${model} and no default locale specified: ${error?.message}`);
      }
      console.warn(`Failed to read locales for model ${model}: ${error?.message}`);
      return [this.options.defaultLocale];
    }
  }

  async load<T extends BaseContentrainType>(model: string): Promise<LoaderResult<T>> {
    const cacheKey = `${model}`;

    // Check cache
    if (this.options.cache) {
      const cached = await this.cache.get<LoaderResult<T>>(cacheKey);
      if (cached)
        return cached;
    }

    // Load model configuration
    const modelConfig = await this.loadModelConfig(model);
    this.modelConfigs.set(model, modelConfig);

    // Load relations
    const relations = await this.loadRelations(model);
    this.relations.set(model, relations);

    // Load content
    const content: { [locale: string]: T[] } = {};

    if (modelConfig.metadata.localization) {
      // Get locale list from directory
      const locales = await this.getModelLocales(model, modelConfig);

      for (const locale of locales) {
        try {
          const file = await this.loadContentFile<T>(model, locale);
          content[locale] = file.data;
        }
        catch (error: any) {
          console.warn(`Failed to load content for locale ${locale}: ${error?.message}`);
          // Throw error if default locale fails to load
          if (locale === this.options.defaultLocale) {
            throw error;
          }
        }
      }
    }
    else {
      // Load single file
      const file = await this.loadContentFile<T>(model);
      content.default = file.data;
    }

    // Load assets file
    let assets: AssetMetadata[] = [];
    try {
      const assetsPath = join(this.options.contentDir, 'assets.json');
      const assetsContent = await readFile(assetsPath, 'utf-8');
      assets = JSON.parse(assetsContent);
    }
    catch (error) {
      // Skip if assets file doesn't exist or can't be read
      console.warn('Assets file not found or cannot be read:', error);
    }

    const result: LoaderResult<T> = {
      model: modelConfig,
      content,
      assets,
    };

    // Save to cache
    if (this.options.cache) {
      const ttl = this.getModelTTL(model);
      await this.cache.set(cacheKey, result, ttl);
    }

    return result;
  }

  async resolveRelation<T extends BaseContentrainType, R extends BaseContentrainType>(
    model: string,
    relationField: keyof T,
    data: T[],
    locale?: string,
  ): Promise<R[]> {
    try {
      logger.debug('Debug - Starting relation resolution:', {
        model,
        relationField,
        dataLength: data.length,
        locale,
      });

      const relations = this.relations.get(model);
      logger.debug('Debug - Relations:', { relations: relations || {} });

      if (!relations)
        throw new Error(`No relations found for model: ${model}`);

      const relation = relations.find(r => r.foreignKey === relationField);
      logger.debug('Debug - Found relation:', { relation: relation || {} });

      if (!relation)
        throw new Error(`No relation found for field: ${String(relationField)}`);

      // İlişkili modeli yükle
      logger.debug('Debug - Related model loading:', { model: relation.model });
      const relatedContent = await this.load<R>(relation.model);
      logger.debug('Debug - İlişkili model yüklendi:', {
        model: relation.model,
        metadata: relatedContent.model.metadata,
        contentKeys: Object.keys(relatedContent.content),
      });

      let relatedData: R[];

      // Process content based on localization
      if (relatedContent.model.metadata.localization) {
        logger.debug('Debug - Processing localized model');
        const localizedContent = locale ? relatedContent.content[locale] : relatedContent.content.en;
        logger.debug('Debug - Localized content:', {
          locale: locale || 'en',
          contentType: typeof localizedContent,
          isArray: Array.isArray(localizedContent),
        });

        if (!Array.isArray(localizedContent)) {
          throw new TypeError(`Invalid content format for localized model ${relation.model}`);
        }
        relatedData = localizedContent;
      }
      else {
        logger.debug('Debug - Processing non-localized model');
        const nonLocalizedContent = relatedContent.content.default;
        logger.debug('Debug - Raw content:', {
          contentType: typeof nonLocalizedContent,
          isArray: Array.isArray(nonLocalizedContent),
          content: nonLocalizedContent,
        });

        if (!Array.isArray(nonLocalizedContent)) {
          throw new TypeError(`Invalid content format for non-localized model ${relation.model}`);
        }
        relatedData = nonLocalizedContent;
      }

      logger.debug('Debug - Related data ready:', {
        dataLength: relatedData.length,
        firstItem: relatedData[0],
      });

      if (!relatedData) {
        throw new Error(`Failed to resolve relation: No data found for model ${relation.model}`);
      }

      // Process relation type
      if (relation.type === 'one-to-one') {
        logger.debug('Debug - Processing one-to-one relation');
        // For one-to-one relations, process only items with relation field
        const itemsWithRelation = data.filter(item => item[relationField] !== undefined);
        logger.debug('Debug - Items with relations:', { count: itemsWithRelation.length });

        return itemsWithRelation.map((item) => {
          const relatedItem = relatedData.find((r: R) => r.ID === item[relationField]);
          if (!relatedItem) {
            throw new Error(`Failed to resolve relation: No matching item found for ID ${String(item[relationField])}`);
          }
          return relatedItem;
        });
      }
      else {
        logger.debug('Debug - Processing one-to-many relation');
        // For one-to-many relations, prevent duplicates and filter undefined values
        const uniqueIds = new Set(
          data.flatMap(item =>
            item[relationField] !== undefined
              ? (Array.isArray(item[relationField])
                  ? item[relationField]
                  : [item[relationField]])
              : [],
          ),
        );

        logger.debug('Debug - Total count:', { total: uniqueIds.size });

        const items = Array.from(uniqueIds)
          .map(id => relatedData.find((r: R) => r.ID === id))
          .filter(Boolean) as R[];

        logger.debug('Debug - Unique IDs:', { ids: Array.from(uniqueIds) });

        logger.debug('Debug - Matching items:', { count: items.length });

        if (items.length !== uniqueIds.size) {
          throw new Error('Failed to resolve relation: Some related items not found');
        }

        return items;
      }
    }
    catch (error: any) {
      logger.error('Debug - Error occurred:', error);
      throw new Error(`Failed to resolve relation: ${error.message}`);
    }
  }
}
