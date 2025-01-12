import type { ContentLoaderOptions } from '@contentrain/core';
import type { RuntimeConfig } from 'nuxt/schema';
import { ContentrainSDK } from '@contentrain/core';

let _sdk: ContentrainSDK | null = null;

export function getSDK(config: RuntimeConfig & {
  contentrain: ContentLoaderOptions
}) {
  if (!_sdk) {
    _sdk = new ContentrainSDK({
      contentDir: config.contentrain.contentDir,
      defaultLocale: config.contentrain.defaultLocale,
      cache: config.contentrain.cache,
      ttl: config.contentrain.ttl,
    });
  }
  return _sdk;
}
