import type { SQLiteLoader } from '@contentrain/query';
import type { RuntimeConfig } from '@nuxt/schema';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
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

    // Resolve absolute path
    const dbPath = resolve(process.cwd(), config.contentrain.databasePath);

    // Check if database file exists
    const dbExists = existsSync(dbPath);
    console.log('Contentrain DB Path:', dbPath);
    console.log('DB File Exists:', dbExists);
    console.log('Current Working Directory:', process.cwd());

    const loader = new SQLiteLoaderImpl({
      databasePath: dbPath,
      cache: config.contentrain.cache !== false,
      maxCacheSize: config.contentrain.maxCacheSize || 100,
    });

    QueryFactory.setLoader(loader);
    _sdk = loader;
  }

  if (!_sdk) {
    throw new Error('Failed to initialize SDK');
  }

  return _sdk;
}
