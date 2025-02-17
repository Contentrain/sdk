import type { ICacheStats } from '../../cache/types';
import type { ILogger } from '../types/common';
import type { IDBRecord, IDBTranslationRecord, ISQLiteLoaderOptions, ISQLiteLoaderResult } from '../types/sqlite';
import { MemoryCache } from '../../cache/memory';
import { LoaderError } from '../../errors';
import { SQLiteContentManager } from './managers/content.manager';
import { SQLiteRelationManager } from './managers/relation.manager';
import { SQLiteTranslationManager } from './managers/translation.manager';

export class SQLiteLoader<TData extends IDBRecord> extends SQLiteContentManager {
  public readonly relationManager: SQLiteRelationManager;
  public readonly translationManager: SQLiteTranslationManager;
  private readonly cache?: MemoryCache;
  private readonly modelTTL: Record<string, number> = {};
  private readonly modelConfigs = new Map<string, {
    metadata: {
      modelId: string
      name: string
      type: string
      localization: boolean
      isServerless: boolean
    }
    fields: Array<{
      name: string
      fieldId: string
      type: string
    }>
  }>();

  constructor(
    private readonly options: ISQLiteLoaderOptions,
    logger: ILogger,
  ) {
    super(options.databasePath, logger);

    this.relationManager = new SQLiteRelationManager(options.databasePath, logger);
    this.translationManager = new SQLiteTranslationManager(options.databasePath, logger);

    if (options.cache) {
      this.cache = new MemoryCache({
        maxSize: options.maxCacheSize,
        defaultTTL: typeof options.modelTTL === 'number' ? options.modelTTL : undefined,
      });
    }

    if (options.modelTTL) {
      Object.assign(this.modelTTL, options.modelTTL);
    }
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      return await this.connection.query<T>(sql, params);
    }
    catch (error: any) {
      this.logger.error('Query error:', {
        sql,
        params,
        error: error?.message || 'Unknown error',
        stack: error?.stack,
      });
      throw error;
    }
  }

  private getCacheKey(modelId: string): string {
    return `sqlite:${modelId}`;
  }

  private getModelTTL(modelId: string): number {
    return this.modelTTL[modelId] || 0;
  }

  private async loadWithTranslations(
    model: string,
    data: TData[],
  ): Promise<ISQLiteLoaderResult<TData>> {
    try {
      const hasTranslations = await this.translationManager.hasTranslations(model);
      const modelFields = await this.getModelFields(model);

      if (!hasTranslations) {
        return {
          model: {
            metadata: {
              modelId: model,
              name: model,
              type: 'SQLite',
              localization: false,
              isServerless: false,
            },
            fields: modelFields,
          },
          content: {
            default: data,
            translations: {},
          },
        };
      }

      const locales = await this.translationManager.getLocales(model);
      const translations: Record<string, IDBTranslationRecord[]> = {};

      for (const locale of locales) {
        const translatedData = await this.translationManager.loadTranslations(
          model,
          data.map(item => item.id),
          locale,
        );
        translations[locale] = Object.values(translatedData);
      }

      return {
        model: {
          metadata: {
            modelId: model,
            name: model,
            type: 'SQLite',
            localization: true,
            isServerless: false,
          },
          fields: modelFields,
        },
        content: {
          default: data,
          translations,
        },
      };
    }
    catch (error: any) {
      throw new LoaderError(
        'Failed to load translations',
        'translate',
        {
          model,
          dataCount: data.length,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  private getFieldType(fieldName: string): string {
    if (fieldName === 'id' || fieldName.endsWith('_id'))
      return 'string';
    if (fieldName === 'created_at' || fieldName === 'updated_at')
      return 'date';
    if (fieldName === 'status')
      return 'string';
    if (fieldName === 'field_order')
      return 'number';
    return 'string';
  }

  private async getModelFields(modelId: string): Promise<Array<{
    name: string
    fieldId: string
    type: string
  }>> {
    try {
      const systemFields = await this.translationManager.getMainColumns(modelId);
      const systemFieldTypes = systemFields.map(field => ({
        name: field,
        fieldId: field,
        type: this.getFieldType(field),
      }));

      const relationFields = await this.relationManager.getRelationFields(modelId);
      const relationFieldTypes = relationFields.map(field => ({
        name: field,
        fieldId: field,
        type: 'relation',
      }));

      const hasTranslations = await this.translationManager.hasTranslations(modelId);
      const translationFields = hasTranslations
        ? await this.translationManager.getTranslationColumns(modelId)
        : [];
      const translationFieldTypes = translationFields.map(field => ({
        name: field,
        fieldId: field,
        type: this.getFieldType(field),
      }));

      return [...systemFieldTypes, ...relationFieldTypes, ...translationFieldTypes];
    }
    catch (error: any) {
      this.logger.error('Get model fields error:', {
        modelId,
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        context: {
          operation: 'getModelFields',
        },
      });
      throw error;
    }
  }

  async resolveRelations<TRelation extends IDBRecord>(
    modelId: string,
    fieldId: string,
    data: TData[],
  ): Promise<TRelation[]> {
    try {
      const relations = await this.relationManager.loadRelations(
        modelId,
        data.map(item => item.id),
        fieldId,
      );

      if (!relations.length) {
        throw new Error(`No relations found for field: ${fieldId}`);
      }

      return await this.relationManager.loadRelatedContent<TRelation>(
        relations,
        this.options.defaultLocale,
      );
    }
    catch (error: any) {
      this.logger.error('Resolve relations error:', {
        modelId,
        fieldId,
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

  async load(model: string): Promise<ISQLiteLoaderResult<TData>> {
    const cacheKey = this.getCacheKey(model);

    if (this.options.cache && this.cache) {
      const cached = await this.cache.get<ISQLiteLoaderResult<TData>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const data = await this.findAll<TData>(model);
      const result = await this.loadWithTranslations(model, data);

      if (this.options.cache && this.cache) {
        const ttl = this.getModelTTL(model);
        await this.cache.set(cacheKey, result, ttl);
      }

      return result;
    }
    catch (error: any) {
      throw new LoaderError(
        'Failed to load content',
        'load',
        {
          model,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async clearCache(): Promise<void> {
    if (this.cache) {
      await this.cache.clear();
    }
  }

  async refreshCache(modelId: string): Promise<void> {
    const cacheKey = this.getCacheKey(modelId);
    if (this.cache) {
      await this.cache.delete(cacheKey);
      await this.load(modelId);
    }
  }

  private async getTableCount(): Promise<number> {
    try {
      const tables = await this.connection.query<{ name: string }>(
        'SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\'',
      );
      return tables.length;
    }
    catch (error: any) {
      this.logger.error('Get table count error:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
      });
      return 0;
    }
  }

  async getCacheStats(): Promise<ICacheStats> {
    return {
      modelConfigs: this.modelConfigs.size,
      contents: await this.getTableCount(),
      cache: this.cache?.getStats() || undefined,
    };
  }

  async close(): Promise<void> {
    await super.close();
    await this.relationManager.close();
    await this.translationManager.close();
  }
}
