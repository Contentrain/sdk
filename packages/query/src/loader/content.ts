import type { ContentFile, ContentLoaderOptions, LoaderResult, ModelConfig, RelationConfig } from '../types/loader';
import type { BaseContentrainType, FieldMetadata, ModelMetadata } from '../types/model';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MemoryCache } from '../cache';

export class ContentLoader {
  private options: ContentLoaderOptions;
  private modelConfigs: Map<string, ModelConfig> = new Map();
  private relations: Map<string, RelationConfig[]> = new Map();
  private cache: MemoryCache;

  constructor(options: ContentLoaderOptions) {
    this.options = {
      defaultLocale: 'en',
      cache: true,
      ttl: 60 * 1000, // 1 dakika
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
      // Önce genel metadata'yı oku
      const metadataPath = join(this.options.contentDir, 'models', 'metadata.json');
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const allMetadata = JSON.parse(metadataContent);

      // Model özel metadata'sını bul
      const modelMetadata = allMetadata.find((m: ModelMetadata) => m.modelId === model);
      if (!modelMetadata) {
        throw new Error(`Model metadata not found for ${model}`);
      }

      // Model field'larını oku
      const modelPath = join(this.options.contentDir, 'models', `${model}.json`);
      const modelContent = await readFile(modelPath, 'utf-8');
      const modelFields = JSON.parse(modelContent) as FieldMetadata[];

      // Field'ların geçerli olduğunu kontrol et
      if (!Array.isArray(modelFields)) {
        throw new TypeError(`Invalid field configuration for model ${model}: Expected an array of fields`);
      }

      // Field'ların tiplerini kontrol et
      modelFields.forEach((field, index) => {
        if (!field.fieldId || !field.fieldType || !field.componentId) {
          throw new Error(`Invalid field at index ${index} for model ${model}: Missing required properties`);
        }
      });

      return {
        metadata: modelMetadata,
        fields: modelFields,
      };
    }
    catch (error: any) {
      throw new Error(`Failed to load model config for ${model}: ${error?.message || 'Unknown error'}`);
    }
  }

  private async loadContentFile<T extends BaseContentrainType>(
    model: string,
    locale?: string,
  ): Promise<ContentFile<T>> {
    try {
      // İçerik dosyasının yolunu belirle
      let contentPath: string;
      if (locale) {
        contentPath = join(this.options.contentDir, model, `${locale}.json`);
      }
      else {
        // Non-lokalize içerikler için modelId.json formatını kullan
        contentPath = join(this.options.contentDir, model, `${model}.json`);
      }

      // Dosyayı oku ve parse et
      const content = await readFile(contentPath, 'utf-8');
      try {
        const data = JSON.parse(content) as T[];
        return {
          model,
          locale,
          data,
        };
      }
      catch {
        throw new Error(`Failed to load content: Invalid JSON format in ${contentPath}`);
      }
    }
    catch (error: any) {
      if (error.message.includes('Invalid JSON format')) {
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
      // Model config'i al
      const modelConfig = this.modelConfigs.get(model);
      if (!modelConfig) {
        throw new Error(`Model config not found for ${model}`);
      }

      // İlişki field'larını bul
      const relationFields = modelConfig.fields.filter((field) => {
        return field.fieldType === 'relation';
      });

      // İlişki config'lerini oluştur
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

  async load<T extends BaseContentrainType>(model: string): Promise<LoaderResult<T>> {
    const cacheKey = this.getCacheKey(model);

    // Cache kontrolü
    if (this.options.cache) {
      const cached = await this.cache.get<LoaderResult<T>>(cacheKey);
      if (cached)
        return cached;
    }

    // Model config'i yükle
    const modelConfig = await this.loadModelConfig(model);
    this.modelConfigs.set(model, modelConfig);

    // İlişkileri yükle
    const relations = await this.loadRelations(model);
    this.relations.set(model, relations);

    // İçeriği yükle
    const content: { [locale: string]: T[] } = {};

    if (modelConfig.metadata.localization) {
      // Tüm dilleri yükle
      // TODO: Dil listesini al
      const locales = ['en', 'tr'];

      for (const locale of locales) {
        const file = await this.loadContentFile<T>(model, locale);
        content[locale] = file.data;
      }
    }
    else {
      // Tek dosyayı yükle
      const file = await this.loadContentFile<T>(model);
      content.default = file.data;
    }

    const result: LoaderResult<T> = {
      model: modelConfig,
      content,
    };

    // Cache'e kaydet
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
      const relations = this.relations.get(model);
      if (!relations)
        throw new Error(`No relations found for model: ${model}`);

      const relation = relations.find(r => r.foreignKey === relationField);
      if (!relation)
        throw new Error(`No relation found for field: ${String(relationField)}`);

      // İlişkili modeli yükle
      const relatedContent = await this.load<R>(relation.model);
      const relatedData = locale ? relatedContent.content[locale] : relatedContent.content.en;

      if (!relatedData) {
        throw new Error(`Failed to resolve relation: No data found for model ${relation.model}`);
      }

      if (relation.type === 'one-to-one') {
        // Birebir ilişki
        return data.map((item) => {
          const relatedItem = relatedData.find(r => r.ID === item[relationField]);
          if (!relatedItem) {
            throw new Error(`Failed to resolve relation: No matching item found for ID ${String(item[relationField])}`);
          }
          return relatedItem;
        });
      }
      else {
        // Çoka bir ilişki
        return data.flatMap((item) => {
          const ids = Array.isArray(item[relationField])
            ? item[relationField]
            : [item[relationField]];

          const items = ids
            .map(id => relatedData.find(r => r.ID === id))
            .filter(Boolean) as R[];

          if (items.length !== ids.length) {
            throw new Error('Failed to resolve relation: Some related items not found');
          }

          return items;
        });
      }
    }
    catch (error: any) {
      throw new Error(`Failed to resolve relation: ${error.message}`);
    }
  }
}
