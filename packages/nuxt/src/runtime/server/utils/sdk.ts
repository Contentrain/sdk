import type { SQLiteLoader } from '@contentrain/query';
import type { RuntimeConfig } from '@nuxt/schema';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { QueryFactory, SQLiteLoader as SQLiteLoaderImpl } from '@contentrain/query';

let _sdk: SQLiteLoader | null = null;

function resolveDatabasePath(config: RuntimeConfig): string {
  if (!config.contentrain?.databasePath) {
    throw new Error('databasePath is required for SQLite loader');
  }

  const dbPath = config.contentrain.databasePath;

  // Development ortamında public/ ile başlayan path'i kullan
  if (process.env.NODE_ENV === 'development' && dbPath.includes('.output/public/')) {
    return dbPath.replace('.output/public/', 'public/');
  }

  return resolve(process.cwd(), dbPath);
}

export function getSDK(config: RuntimeConfig): SQLiteLoader {
  if (!config.contentrain) {
    throw new Error('Contentrain config is missing');
  }

  if (!_sdk) {
    // Database path'i çözümle
    const dbPath = resolveDatabasePath(config);

    // Check if database file exists
    const dbExists = existsSync(dbPath);
    console.log('Contentrain DB Path:', dbPath);
    console.log('DB File Exists:', dbExists);
    console.log('Environment:', process.env.NODE_ENV);

    if (!dbExists) {
      console.warn('Database file not found at path:', dbPath);
      if (dbPath.includes('public/')) {
        console.warn('Make sure the database file exists in the public directory');
      }
    }

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
