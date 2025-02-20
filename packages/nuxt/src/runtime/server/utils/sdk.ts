import type { SQLiteLoader } from '@contentrain/query';
import type { RuntimeConfig } from '@nuxt/schema';
import { QueryFactory, SQLiteLoader as SQLiteLoaderImpl } from '@contentrain/query';

let _sdk: SQLiteLoader | null = null;

export function getSDK(config: RuntimeConfig): SQLiteLoader {
  if (!config.contentrain) {
    throw new Error('Contentrain config is missing');
  }

  if (!_sdk) {
    if (!config.contentrain.databasePath) {
      throw new Error('databasePath is required for SQLite loader');
    }

    const loader = new SQLiteLoaderImpl({
      databasePath: config.contentrain.databasePath,
      cache: config.contentrain.cache !== false,
      maxCacheSize: config.contentrain.maxCacheSize || 100,
      defaultLocale: config.contentrain.defaultLocale,
      modelTTL: config.contentrain.modelTTL || {},
    });

    QueryFactory.setLoader(loader);
    _sdk = loader;
  }

  if (!_sdk) {
    throw new Error('Failed to initialize SDK');
  }

  return _sdk;
}
