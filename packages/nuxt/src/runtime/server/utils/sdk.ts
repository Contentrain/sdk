import type { RuntimeConfig } from '@nuxt/schema';
import { ContentrainSDK } from '@contentrain/query';

let _sdk: ContentrainSDK | null = null;

export function getSDK(config: RuntimeConfig) {
  if (!_sdk) {
    if (!config.contentrain?.contentDir) {
      throw new Error('contentDir is required in contentrain config');
    }

    _sdk = new ContentrainSDK({
      contentDir: config.contentrain.contentDir,
      defaultLocale: config.contentrain.defaultLocale || 'en',
      cache: config.contentrain.cache !== false,
      ttl: config.contentrain.ttl || 60 * 1000, // default 1 minute
      maxCacheSize: config.contentrain.maxCacheSize || 100, // default 100MB
      modelTTL: config.contentrain.modelTTL || {},
    });
  }
  return _sdk;
}
