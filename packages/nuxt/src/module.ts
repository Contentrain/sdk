import { addImportsDir, addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit';
import defu from 'defu';

export interface ModuleOptions {
  contentDir: string
  defaultLocale?: string
  cache: boolean
  ttl: number
  maxCacheSize: number
  modelTTL?: {
    [model: string]: number
  }
}

declare module '@nuxt/schema' {
  interface ConfigSchema {
    contentrain?: ModuleOptions
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@contentrain/nuxt',
    configKey: 'contentrain',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  defaults: {
    contentDir: 'contentrain',
    cache: true,
    ttl: 60 * 1000,
    maxCacheSize: 1000,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const resolve = resolver.resolve.bind(resolver);

    // Runtime config
    nuxt.options.runtimeConfig.contentrain = defu(
      nuxt.options.runtimeConfig.contentrain || {},
      {
        contentDir: options.contentDir,
        defaultLocale: options.defaultLocale,
        cache: options.cache,
        ttl: options.ttl,
        maxCacheSize: options.maxCacheSize,
        modelTTL: options.modelTTL,
      },
    );

    nuxt.options.runtimeConfig.public.contentrain = defu(
      nuxt.options.runtimeConfig.public.contentrain || {},
      {
        defaultLocale: options.defaultLocale,
      },
    );

    // Add composables
    addImportsDir(resolve('./runtime/composables'));

    // Add API handlers
    addServerHandler({
      route: '/api/_contentrain/query',
      handler: resolve('./runtime/server/api/query'),
    });

    addServerHandler({
      route: '/api/_contentrain/load',
      handler: resolve('./runtime/server/api/load'),
    });

    addServerHandler({
      route: '/api/_contentrain/cache/clear',
      handler: resolve('./runtime/server/api/cache/clear'),
    });

    // Add types
    nuxt.hook('prepare:types', (options) => {
      options.references.push({ types: '@contentrain/nuxt' });
    });
  },
});
