import type { ContentFile, ContentLoaderOptions, LoaderResult, ModelConfig, RelationConfig } from '../types/loader';
import type { BaseContentrainType, FieldMetadata, ModelMetadata } from '../types/model';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MemoryCache } from '../cache/memory';
import { logger } from '../utils/logger';

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
    locale: string = 'default',
  ): Promise<ContentFile<T>> {
    try {
      const modelConfig = await this.loadModelConfig(model);
      let contentPath: string;

      if (modelConfig.metadata.localization) {
        if (!locale || locale === 'default') {
          if (!this.options.defaultLocale) {
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

  private async getModelLocales(model: string, modelConfig: ModelConfig): Promise<string[]> {
    try {
      if (!modelConfig.metadata.localization) {
        return ['default'];
      }

      const modelDir = join(this.options.contentDir, model);
      const files = await readdir(modelDir);

      // .json uzantılı dosyaları filtrele ve uzantıyı kaldır
      const locales = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .filter(locale => locale !== model); // model.json dosyasını hariç tut

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

    // Cache kontrolü
    if (this.options.cache) {
      const cached = await this.cache.get<LoaderResult<T>>(cacheKey);
      if (cached)
        return cached;
    }

    // Model konfigürasyonunu yükle
    const modelConfig = await this.loadModelConfig(model);
    this.modelConfigs.set(model, modelConfig);

    // İlişkileri yükle
    const relations = await this.loadRelations(model);
    this.relations.set(model, relations);

    // İçeriği yükle
    const content: { [locale: string]: T[] } = {};

    if (modelConfig.metadata.localization) {
      // Dil listesini dizinden al
      const locales = await this.getModelLocales(model, modelConfig);

      for (const locale of locales) {
        try {
          const file = await this.loadContentFile<T>(model, locale);
          content[locale] = file.data;
        }
        catch (error: any) {
          console.warn(`Failed to load content for locale ${locale}: ${error?.message}`);
          // Eğer default locale yüklenemezse hata fırlat
          if (locale === this.options.defaultLocale) {
            throw error;
          }
        }
      }
    }
    else {
      // Tek dosyayı yükle
      const file = await this.loadContentFile<T>(model);
      content.default = file.data;
    }

    // Assets dosyasını yükle
    let assets;
    try {
      const assetsPath = join(this.options.contentDir, 'assets.json');
      const assetsContent = await readFile(assetsPath, 'utf-8');
      assets = JSON.parse(assetsContent);
    }
    catch (error) {
      // Assets dosyası yoksa veya okunamazsa boş geç
      console.warn('Assets file not found or cannot be read:', error);
    }

    const result: LoaderResult<T> = {
      model: modelConfig,
      content,
      assets,
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
      logger.debug('Debug - resolveRelation başladı:', {
        model,
        relationField,
        dataLength: data.length,
        locale,
      });

      const relations = this.relations.get(model);
      logger.debug('Debug - İlişkiler:', relations);

      if (!relations)
        throw new Error(`No relations found for model: ${model}`);

      const relation = relations.find(r => r.foreignKey === relationField);
      logger.debug('Debug - Bulunan ilişki:', relation);

      if (!relation)
        throw new Error(`No relation found for field: ${String(relationField)}`);

      // İlişkili modeli yükle
      logger.debug('Debug - İlişkili model yükleniyor:', relation.model);
      const relatedContent = await this.load<R>(relation.model);
      logger.debug('Debug - İlişkili model yüklendi:', {
        model: relation.model,
        metadata: relatedContent.model.metadata,
        contentKeys: Object.keys(relatedContent.content),
      });

      let relatedData: R[];

      // Lokalizasyonsuz modeller için doğrudan content'i kullan
      if (relatedContent.model.metadata.localization) {
        logger.debug('Debug - Lokalizasyonlu model işleniyor');
        const localizedContent = locale ? relatedContent.content[locale] : relatedContent.content.en;
        logger.debug('Debug - Lokalize içerik:', {
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
        logger.debug('Debug - Lokalizasyonsuz model işleniyor');
        const nonLocalizedContent = relatedContent.content.default;
        logger.debug('Debug - Ham içerik:', {
          contentType: typeof nonLocalizedContent,
          isArray: Array.isArray(nonLocalizedContent),
          content: nonLocalizedContent,
        });

        if (!Array.isArray(nonLocalizedContent)) {
          throw new TypeError(`Invalid content format for non-localized model ${relation.model}`);
        }
        relatedData = nonLocalizedContent;
      }

      logger.debug('Debug - İlişkili veri hazır:', {
        dataLength: relatedData.length,
        firstItem: relatedData[0],
      });

      if (!relatedData) {
        throw new Error(`Failed to resolve relation: No data found for model ${relation.model}`);
      }

      if (relation.type === 'one-to-one') {
        logger.debug('Debug - Bire-bir ilişki işleniyor');
        // Birebir ilişki - sadece ilişki alanı olan öğeleri işle
        const itemsWithRelation = data.filter(item => item[relationField] !== undefined);
        logger.debug('Debug - İlişkisi olan öğe sayısı:', itemsWithRelation.length);

        return itemsWithRelation.map((item) => {
          const relatedItem = relatedData.find((r: R) => r.ID === item[relationField]);
          if (!relatedItem) {
            throw new Error(`Failed to resolve relation: No matching item found for ID ${String(item[relationField])}`);
          }
          return relatedItem;
        });
      }
      else {
        logger.debug('Debug - Çoka-bir ilişki işleniyor');
        // Çoka bir ilişki - tekrarlanan öğeleri önle ve undefined değerleri filtrele
        const uniqueIds = new Set(
          data.flatMap(item =>
            item[relationField] !== undefined
              ? (Array.isArray(item[relationField])
                  ? item[relationField]
                  : [item[relationField]])
              : [],
          ),
        );

        logger.debug('Debug - Benzersiz ID\'ler:', Array.from(uniqueIds));

        const items = Array.from(uniqueIds)
          .map(id => relatedData.find((r: R) => r.ID === id))
          .filter(Boolean) as R[];

        logger.debug('Debug - Eşleşen öğeler:', items.length);

        if (items.length !== uniqueIds.size) {
          throw new Error('Failed to resolve relation: Some related items not found');
        }

        return items;
      }
    }
    catch (error: any) {
      logger.error('Debug - Hata oluştu:', error);
      throw new Error(`Failed to resolve relation: ${error.message}`);
    }
  }
}
