import { addImportsDir, addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit';
import defu from 'defu';

export interface ModuleOptions {
    databasePath?: string
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
        databasePath: 'contentrain.db',
        cache: true,
        ttl: 60 * 1000,
        maxCacheSize: 1000,
    },
    async setup(options, nuxt) {
        const resolver = createResolver(import.meta.url);
        const resolve = resolver.resolve.bind(resolver);

        // Build sonrası için path'i güncelle
        if (options.databasePath?.startsWith('public/')) {
            // Development'ta public/ ile başlayan path'i kullan
            // Build sonrasında .output/public/ ile değiştir
            const runtimePath = options.databasePath.replace('public/', '.output/public/');

            console.log('Contentrain: Database in public directory');
            console.log('Development path:', options.databasePath);
            console.log('Runtime path:', runtimePath);

            // Runtime config için path'i güncelle
            options.databasePath = runtimePath;
        }

        // Runtime config
        const privateConfig: Record<string, any> = {
            cache: options.cache,
            ttl: options.ttl,
            maxCacheSize: options.maxCacheSize,
        };

        if (options.databasePath)
            privateConfig.databasePath = options.databasePath;

        if (options.modelTTL)
            privateConfig.modelTTL = options.modelTTL;

        nuxt.options.runtimeConfig.contentrain = defu(
            nuxt.options.runtimeConfig.contentrain || {},
            privateConfig,
        );

        // Public config
        const publicConfig: Record<string, any> = {};

        nuxt.options.runtimeConfig.public.contentrain = defu(
            nuxt.options.runtimeConfig.public.contentrain || {},
            publicConfig,
        );

        // Add composables
        const composablePath = resolve('./runtime/composables');
        addImportsDir(composablePath);

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
