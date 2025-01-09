import type {
  BaseContentrainType,
  ContentrainModelMetadata,
  ContentrainTypes,
  FieldSelection,
  QueryBuilder as IQueryBuilder,
  QueryConfig,
  QueryOperator,
  QueryOptions,
  RelationConfig,
  RelationOptions,
  SortDirection,
  WhereCondition,
} from '../types/query';
import { MemoryCache, StorageCache } from '../cache/strategies';
import { QueryDebugger } from '../utils/debug';
import { ContentLoader } from '../utils/loader';
import { QueryValidator } from '../utils/validator';
import { ContentrainValidationError } from './errors';
import { operators } from './operators';

// Custom error sınıfları
class ContentrainQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentrainQueryError';
  }
}

class ModelNotFoundError extends ContentrainQueryError {
  constructor(modelId: string) {
    super(`Model not found: ${modelId}`);
  }
}

class RelationLoadError extends ContentrainQueryError {
  constructor(relationKey: string, modelId: string, cause?: Error) {
    super(`Failed to load relation "${relationKey}" for model "${modelId}"${cause ? `: ${cause.message}` : ''}`);
    this.name = 'RelationLoadError';
  }
}

interface RelationData<T extends BaseContentrainType> {
  model: string
  type: 'one-to-one' | 'one-to-many'
  data?: T[]
  options?: RelationOptions
}

export class QueryBuilder<
  T extends BaseContentrainType,
  Types extends ContentrainTypes = ContentrainTypes,
  K extends keyof Types['models'] = keyof Types['models'],
> implements IQueryBuilder<T, Types, K> {
  private conditions: WhereCondition[] = [];
  private relations: Map<keyof Types['relations'], RelationData<Types['models'][keyof Types['models']]>> = new Map();
  private sortField?: keyof T;
  private sortDirection?: SortDirection;
  private limitCount?: number;
  private skipCount: number = 0;
  private data: T[] = [];
  private memoryCache: MemoryCache;
  private storageCache: StorageCache;
  private options: QueryOptions;
  private loader: ContentLoader;
  private modelId?: K;
  private currentLocale?: Types['locales'];
  private metadata?: ContentrainModelMetadata;
  private debugger: QueryDebugger;
  private validator: QueryValidator;

  constructor(config: QueryConfig = {}, options: QueryOptions = {}) {
    this.options = {
      cache: true,
      cacheTime: config.defaultCacheTime || 5 * 60 * 1000,
      loading: 'eager',
      validation: {
        validateSchema: true,
        validateRelations: true,
        strict: false,
      },
      debug: {
        level: 'none',
      },
      ...options,
    };

    this.memoryCache = MemoryCache.getInstance();
    this.storageCache = new StorageCache();
    this.loader = new ContentLoader(config);
    this.debugger = QueryDebugger.getInstance();
    this.validator = QueryValidator.getInstance();

    if (config.defaultLocale) {
      this.currentLocale = config.defaultLocale as Types['locales'];
    }

    if (this.options.debug) {
      this.debugger.configure(this.options.debug);
    }
  }

  private getCacheKey(): string {
    const key = {
      modelId: this.modelId ? String(this.modelId) : undefined,
      conditions: this.conditions,
      relations: Array.from(this.relations.entries()).map(([key, value]) => [String(key), value]),
      sort: { field: this.sortField ? String(this.sortField) : undefined, direction: this.sortDirection },
      limit: this.limitCount,
      skip: this.skipCount,
      locale: this.currentLocale,
    };
    return JSON.stringify(key);
  }

  private async loadModelMetadata(modelId: K): Promise<ContentrainModelMetadata> {
    const cacheKey = `metadata:${String(modelId)}`;

    const cachedData = this.memoryCache.get<ContentrainModelMetadata>(cacheKey);
    if (cachedData)
      return cachedData;

    try {
      const metadata = await this.loader.loadModelMetadata(String(modelId));
      const fullMetadata: ContentrainModelMetadata = {
        name: metadata.name || String(modelId),
        modelId: String(modelId),
        localization: metadata.localization || false,
        type: metadata.type || 'content',
        createdBy: metadata.createdBy || 'system',
        isServerless: metadata.isServerless || false,
        relations: metadata.relations || {},
      };

      if (this.options.cache && this.options.cacheTime) {
        this.memoryCache.set(cacheKey, fullMetadata, this.options.cacheTime);
      }

      return fullMetadata;
    }
    catch (error) {
      console.error(error);
      throw new ModelNotFoundError(String(modelId));
    }
  }

  private async loadModelData(): Promise<void> {
    if (!this.modelId) {
      throw new ContentrainQueryError('Model ID is required');
    }

    this.debugger.info('Loading model data', {
      modelId: this.modelId,
      locale: this.currentLocale,
    });

    if (!this.metadata) {
      this.metadata = await this.loadModelMetadata(this.modelId);
    }

    const shouldUseLocale = this.metadata.localization && this.currentLocale;
    const cacheKey = `model:${String(this.modelId)}:${shouldUseLocale ? this.currentLocale : 'default'}`;

    const cachedData = this.memoryCache.get<T[]>(cacheKey);
    if (cachedData) {
      this.debugger.debug('Using cached model data', { cacheKey });
      this.data = cachedData;
      return;
    }

    try {
      this.data = await this.loader.loadModel(
        String(this.modelId),
        shouldUseLocale ? String(this.currentLocale) : undefined,
      ) as T[];

      // Model validasyonu
      if (this.options.validation) {
        this.validator.validateModel(
          String(this.modelId),
          this.data,
          this.options.validation,
        );
      }

      if (this.options.fields) {
        this.debugger.debug('Applying field selection', this.options.fields);
        this.data = this.applyFieldSelection(this.data, this.options.fields);
      }

      if (this.options.cache && this.options.cacheTime) {
        this.memoryCache.set(cacheKey, this.data, this.options.cacheTime);
      }
    }
    catch (err) {
      this.debugger.error('Failed to load model data', err);
      throw new ContentrainQueryError(
        `Failed to load model data: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  private async loadRelationData<R extends keyof Types['relations']>(
    relationKey: R,
    relationData: RelationData<Types['models'][Types['relations'][R]['model']]>,
  ): Promise<void> {
    this.debugger.info('Loading relation data', {
      relationKey,
      model: relationData.model,
      options: relationData.options,
    });

    try {
      // Relation validasyonu
      if (this.options.validation) {
        this.validator.validateRelation(
          relationKey,
          this.modelId as keyof Types['models'],
          relationData.model as keyof Types['models'],
          this.options.validation,
        );
      }

      const metadata = await this.loadModelMetadata(relationData.model as K);
      const shouldUseLocale = metadata.localization && this.currentLocale;
      const cacheKey = `relation:${relationData.model}:${shouldUseLocale ? this.currentLocale : 'default'}`;

      const cachedData = this.memoryCache.get<Types['models'][Types['relations'][R]['model']][]>(cacheKey);
      if (cachedData) {
        this.debugger.debug('Using cached relation data', { cacheKey });
        relationData.data = cachedData;
        return;
      }

      const data = await this.loader.loadModel(
        relationData.model,
        shouldUseLocale ? String(this.currentLocale) : undefined,
      );
      relationData.data = Array.isArray(data) ? data : [];

      // Field selection
      if (relationData.options?.fields) {
        this.debugger.debug('Applying field selection to relation', {
          fields: relationData.options.fields,
        });
        relationData.data = this.applyFieldSelection(relationData.data, {
          select: relationData.options.fields,
        });
      }

      if (this.options.cache && this.options.cacheTime) {
        this.memoryCache.set(cacheKey, relationData.data, this.options.cacheTime);
      }
    }
    catch (err) {
      this.debugger.error('Failed to load relation data', err);
      throw new RelationLoadError(
        String(relationKey),
        String(this.modelId),
        err instanceof Error ? err : undefined,
      );
    }
  }

  private applyFieldSelection<T extends object>(data: T[], selection: FieldSelection): T[] {
    if (!selection.select && !selection.exclude) {
      return data;
    }

    return data.map((item) => {
      const result: Partial<T> = {};

      if (selection.select) {
        selection.select.forEach((field: string) => {
          if (field in item) {
            result[field as keyof T] = item[field as keyof T];
          }
        });
      }
      else if (selection.exclude) {
        Object.keys(item as object).forEach((field) => {
          if (!selection.exclude!.includes(field)) {
            result[field as keyof T] = item[field as keyof T];
          }
        });
      }

      return result as T;
    });
  }

  private async loadAllRelations(): Promise<void> {
    if (this.relations.size === 0)
      return;

    const relationPromises: Promise<void>[] = [];

    for (const [key, relationData] of this.relations) {
      relationPromises.push(
        this.loadRelationData(key, relationData as RelationData<Types['models'][Types['relations'][keyof Types['relations']]['model']]>).catch((err) => {
          console.warn(err);
          relationData.data = [];
        }),
      );
    }

    await Promise.all(relationPromises);
  }

  from<M extends K>(modelId: M): QueryBuilder<Types['models'][M], Types, M> {
    this.modelId = modelId;
    return this as unknown as QueryBuilder<Types['models'][M], Types, M>;
  }

  locale(locale: Types['locales']): QueryBuilder<T, Types, K> {
    this.currentLocale = locale;
    return this;
  }

  where(field: keyof T, operator: QueryOperator, value: any): QueryBuilder<T, Types, K>;
  where(field: keyof T, value: any): QueryBuilder<T, Types, K>;
  where(conditions: WhereCondition[]): QueryBuilder<T, Types, K>;
  where(
    fieldOrConditions: keyof T | WhereCondition[],
    operatorOrValue?: QueryOperator | any,
    value?: any,
  ): QueryBuilder<T, Types, K> {
    if (Array.isArray(fieldOrConditions)) {
      this.conditions.push(...fieldOrConditions);
    }
    else if (value === undefined) {
      this.conditions.push([fieldOrConditions as string, operatorOrValue]);
    }
    else {
      this.conditions.push([fieldOrConditions as string, operatorOrValue as QueryOperator, value]);
    }
    return this;
  }

  include<R extends keyof Types['relations']>(
    relationOrConfig: R | R[] | RelationConfig,
  ): QueryBuilder<T, Types, K> {
    if (typeof relationOrConfig === 'string') {
      this.relations.set(relationOrConfig, {
        model: this.getRelationModel(relationOrConfig),
        type: this.getRelationType(relationOrConfig),
      });
    }
    else if (Array.isArray(relationOrConfig)) {
      relationOrConfig.forEach((relation) => {
        this.relations.set(relation, {
          model: this.getRelationModel(relation),
          type: this.getRelationType(relation),
        });
      });
    }
    else {
      Object.entries(relationOrConfig).forEach(([key, options]) => {
        const relationKey = key as R;
        if (typeof options === 'string') {
          this.relations.set(relationKey, {
            model: options,
            type: this.getRelationType(relationKey),
          });
        }
        else if (Array.isArray(options)) {
          this.relations.set(relationKey, {
            model: this.getRelationModel(relationKey),
            type: this.getRelationType(relationKey),
            options: { fields: options },
          });
        }
        else {
          this.relations.set(relationKey, {
            model: this.getRelationModel(relationKey),
            type: this.getRelationType(relationKey),
            options,
          });
        }
      });
    }
    return this;
  }

  private getRelationModel<R extends keyof Types['relations']>(relation: R): string {
    const relationConfig = this.metadata?.relations?.[String(relation)];
    if (!relationConfig) {
      throw new ContentrainValidationError(
        'relation',
        `Relation "${String(relation)}" is not defined in model metadata`,
      );
    }
    return relationConfig.model;
  }

  private getRelationType<R extends keyof Types['relations']>(relation: R): 'one-to-one' | 'one-to-many' {
    const relationConfig = this.metadata?.relations?.[String(relation)];
    if (!relationConfig) {
      throw new ContentrainValidationError(
        'relation',
        `Relation "${String(relation)}" is not defined in model metadata`,
      );
    }
    return relationConfig.type;
  }

  orderBy(field: keyof T, direction: SortDirection = 'asc'): QueryBuilder<T, Types, K> {
    this.sortField = field;
    this.sortDirection = direction;
    return this;
  }

  limit(count: number): QueryBuilder<T, Types, K> {
    this.limitCount = count;
    return this;
  }

  skip(count: number): QueryBuilder<T, Types, K> {
    this.skipCount = count;
    return this;
  }

  private async setCache<T>(key: string, data: T): Promise<void> {
    if (!this.options.cache || !this.options.cacheTime)
      return;

    const cacheTime = this.options.cacheTime;
    this.memoryCache.set(key, data, cacheTime);
    this.storageCache.set(key, data, cacheTime);
  }

  async get(): Promise<T[]> {
    if (this.data.length === 0) {
      await this.loadModelData();
    }

    const cacheKey = this.getCacheKey();

    if (this.options.cache) {
      const memoryResult = this.memoryCache.get<T[]>(cacheKey);
      if (memoryResult)
        return memoryResult;

      const storageResult = this.storageCache.get<T[]>(cacheKey);
      if (storageResult) {
        await this.setCache(cacheKey, storageResult);
        return storageResult;
      }
    }

    let result = [...this.data];

    if (this.conditions.length > 0) {
      result = result.filter(item => operators.evaluateConditions(item, this.conditions));
    }

    if (this.relations.size > 0) {
      await this.loadAllRelations();

      for (const [key, relationData] of this.relations) {
        if (relationData.data && relationData.options) {
          if (relationData.options.where) {
            relationData.data = relationData.data.filter(item =>
              operators.evaluateConditions(item, relationData.options!.where!),
            );
          }

          if (relationData.options.orderBy) {
            const { field, direction = 'asc' } = relationData.options.orderBy;
            relationData.data.sort((a, b) => {
              const aValue = a[field as keyof typeof a];
              const bValue = b[field as keyof typeof b];
              const modifier = direction === 'desc' ? -1 : 1;

              if (aValue < bValue)
                return -1 * modifier;
              if (aValue > bValue)
                return 1 * modifier;
              return 0;
            });
          }

          if (relationData.options.limit) {
            relationData.data = relationData.data.slice(0, relationData.options.limit);
          }

          if (relationData.options.fields) {
            relationData.data = relationData.data.map((item) => {
              const filtered: Partial<typeof item> = {};
              relationData.options!.fields!.forEach((field) => {
                filtered[field as keyof typeof item] = item[field as keyof typeof item];
              });
              return filtered as typeof item;
            });
          }
        }

        result = result.map(item => ({
          ...item,
          [key]: relationData.data?.find(relItem =>
            relItem.ID === (item as any)[`${key as string}Id`],
          ),
        }));
      }
    }

    if (this.sortField) {
      result.sort((a, b) => {
        const aValue = a[this.sortField!];
        const bValue = b[this.sortField!];
        const modifier = this.sortDirection === 'desc' ? -1 : 1;

        if (aValue < bValue)
          return -1 * modifier;
        if (aValue > bValue)
          return 1 * modifier;
        return 0;
      });
    }

    if (this.skipCount > 0) {
      result = result.slice(this.skipCount);
    }

    if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    await this.setCache(cacheKey, result);

    return result;
  }

  async first(): Promise<T | null> {
    const results = await this.limit(1).get();
    return results[0] || null;
  }

  /**
   * İçeriği yeniden yükle ve cache'i temizle
   */
  async reload(): Promise<void> {
    // Cache'i temizle
    if (this.modelId) {
      const cacheKey = `model:${String(this.modelId)}:${this.currentLocale || 'default'}`;
      this.memoryCache.delete(cacheKey);
      this.storageCache.delete(cacheKey);
    }

    // İlişkilerin cache'ini temizle
    for (const [_, relationData] of this.relations) {
      const cacheKey = `relation:${relationData.model}:${this.currentLocale || 'default'}`;
      this.memoryCache.delete(cacheKey);
      this.storageCache.delete(cacheKey);
    }

    // Data'yı sıfırla
    this.data = [];

    // Yeniden yükle
    await this.loadModelData();
  }
}
