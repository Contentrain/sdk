import type { ICacheStats } from '../../cache/types';
import type { IDBRecord, IDBTranslationRecord, ISQLiteLoaderOptions, ISQLiteLoaderResult } from '../types/sqlite';
import { MemoryCache } from '../../cache/memory';
import { LoaderError } from '../../errors';
import { SQLiteContentManager } from './managers/content.manager';
import { SQLiteRelationManager } from './managers/relation.manager';
import { SQLiteTranslationManager } from './managers/translation.manager';

export class SQLiteLoader<TData extends IDBRecord = IDBRecord> {
  public readonly contentManager: SQLiteContentManager;
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
  ) {
    this.contentManager = new SQLiteContentManager(options.databasePath);
    this.relationManager = new SQLiteRelationManager(options.databasePath);
    this.translationManager = new SQLiteTranslationManager(options.databasePath);

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
    return this.contentManager.query<T>(sql, params);
  }

  async findById<T extends IDBRecord>(model: string, id: string): Promise<T | undefined> {
    return this.contentManager.findById<T>(model, id);
  }

  async findAll<T extends IDBRecord>(model: string, conditions: Partial<T> = {}): Promise<T[]> {
    return this.contentManager.findAll<T>(model, conditions);
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

  private async getModelFields(model: string): Promise<Array<{
    name: string
    fieldId: string
    type: string
  }>> {
    const systemFields = await this.translationManager.getMainColumns(model);
    const relationFields = await this.relationManager.getRelationFields(model);
    const hasTranslations = await this.translationManager.hasTranslations(model);
    const translationFields = hasTranslations
      ? await this.translationManager.getTranslationColumns(model)
      : [];

    return [
      ...this.mapSystemFields(systemFields),
      ...this.mapRelationFields(relationFields),
      ...this.mapTranslationFields(translationFields),
    ];
  }

  private mapSystemFields(fields: string[]): Array<{ name: string, fieldId: string, type: string }> {
    return fields.map(field => ({
      name: field,
      fieldId: field,
      type: this.getFieldType(field),
    }));
  }

  private mapRelationFields(fields: string[]): Array<{ name: string, fieldId: string, type: string }> {
    return fields.map(field => ({
      name: field,
      fieldId: field,
      type: 'relation',
    }));
  }

  private mapTranslationFields(fields: string[]): Array<{ name: string, fieldId: string, type: string }> {
    return fields.map(field => ({
      name: field,
      fieldId: field,
      type: this.getFieldType(field),
    }));
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

  async resolveRelations<TRelation extends IDBRecord>(
    modelId: string,
    fieldId: string,
    data: TData[],
  ): Promise<TRelation[]> {
    const relations = await this.relationManager.loadRelations(
      modelId,
      data.map(item => item.id),
      fieldId,
    );

    return this.relationManager.loadRelatedContent<TRelation>(
      relations,
      this.options.defaultLocale,
    );
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

  async getCacheStats(): Promise<ICacheStats> {
    return {
      modelConfigs: this.modelConfigs.size,
      contents: await this.contentManager.getTableCount(),
      cache: this.cache?.getStats() || undefined,
    };
  }

  async close(): Promise<void> {
    await this.contentManager.close();
    await this.relationManager.close();
    await this.translationManager.close();
  }
}
