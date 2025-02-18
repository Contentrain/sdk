// Core Types
import type { ILogger, LoaderType } from './loader/types/common';
import type { IBaseJSONRecord } from './loader/types/json';
import type { IDBRecord } from './loader/types/sqlite';
import type { IJSONQuery, ISQLiteQuery } from './query/types';

// Loaders
import { JSONLoader } from './loader/json/json.loader';
import { SQLiteLoader } from './loader/sqlite/sqlite.loader';

// Query Factory

import { QueryFactory } from './query/factory';
// Utils
import { loggers } from './utils/logger';

export * from './cache';
// Type Exports
export * from './loader/types/common';
export * from './loader/types/json';
export * from './loader/types/sqlite';
export * from './query/types';

// Loader Exports
export { JSONLoader, SQLiteLoader };

// Query Factory Export
export { QueryFactory };

// Logger Export
export { loggers };

// SDK Options Type
export interface ContentrainSDKOptions {
  contentDir?: string
  databasePath?: string
  cache?: boolean
  ttl?: number
  maxCacheSize?: number
  defaultLocale?: string
  modelTTL?: Record<string, number>
  logger?: ILogger
}

// SDK Class
export class ContentrainSDK {
  private static loader: JSONLoader<IBaseJSONRecord> | SQLiteLoader<IDBRecord>;
  private readonly logger: ILogger;
  private readonly options: ContentrainSDKOptions;
  private readonly type: LoaderType;

  constructor(type: LoaderType, options: ContentrainSDKOptions) {
    this.logger = options.logger || loggers.default;
    this.options = options;
    this.type = type;

    if (!ContentrainSDK.loader) {
      if (type === 'json') {
        if (!options.contentDir)
          throw new Error('contentDir is required for JSON loader');

        ContentrainSDK.loader = new JSONLoader({
          contentDir: options.contentDir,
          cache: options.cache,
          ttl: options.ttl,
          maxCacheSize: options.maxCacheSize,
          defaultLocale: options.defaultLocale,
          modelTTL: options.modelTTL,
        }, this.logger);
      }
      else {
        if (!options.databasePath)
          throw new Error('databasePath is required for SQLite loader');

        ContentrainSDK.loader = new SQLiteLoader({
          databasePath: options.databasePath,
          cache: options.cache,
          maxCacheSize: options.maxCacheSize,
          defaultLocale: options.defaultLocale,
          modelTTL: options.modelTTL,
        }, this.logger);
      }

      // Loader'ı QueryFactory'ye set et
      QueryFactory.setLoader(ContentrainSDK.loader);
    }
  }

  query<TData extends IDBRecord | IBaseJSONRecord>(model: string): TData extends IDBRecord
    ? ISQLiteQuery<TData & IDBRecord>
    : IJSONQuery<TData & IBaseJSONRecord> {
    return QueryFactory.createBuilder(model, ContentrainSDK.loader) as any;
  }

  async load<TData extends IDBRecord | IBaseJSONRecord>(model: string) {
    const result = await ContentrainSDK.loader.load(model);
    const defaultLocale = this.type === 'json' ? 'default' : 'en';
    const locale = this.options.defaultLocale || defaultLocale;

    if (this.type === 'json') {
      const content = result.content as Record<string, TData[]>;
      return content[locale][0];
    }

    const content = result.content as { default: TData[], translations?: Record<string, TData[]> };
    if (content.translations && locale !== defaultLocale) {
      return content.translations[locale][0];
    }
    return content.default[0];
  }

  async clearCache(): Promise<void> {
    return ContentrainSDK.loader.clearCache();
  }

  async refreshCache(model: string): Promise<void> {
    return ContentrainSDK.loader.refreshCache(model);
  }

  async getCacheStats() {
    return ContentrainSDK.loader.getCacheStats();
  }
}
