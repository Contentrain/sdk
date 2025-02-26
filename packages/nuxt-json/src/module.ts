import {
    addImportsDir,
    addServerHandler,
    createResolver,
    defineNuxtModule,
} from '@nuxt/kit';
import { defu } from 'defu';

export interface ContentrainOptions {
    /**
     * Content dizininin yolu
     */
    path: string

    /**
     * Varsayılan dil
     * @default 'en'
     */
    defaultLocale?: string

    /**
     * Storage yapılandırması
     */
    storage?: {
        /**
         * Storage driver'ı
         * @default 'memory'
         */
        driver?: 'memory' | 'fs'

        /**
         * Storage base dizini
         * @default '.contentrain'
         */
        base?: string
    }
}
export type * from './types';
export default defineNuxtModule<ContentrainOptions>({
    meta: {
        name: '@contentrain/nuxt-json',
        configKey: 'contentrain',
        compatibility: {
            nuxt: '^3.0.0',
        },
    },

    defaults: {
        path: '',
        defaultLocale: 'en',
        storage: {
            driver: 'memory',
            base: '.contentrain',
        },
    },

    setup(options, nuxt) {
        const resolver = createResolver(import.meta.url);
        const resolve = resolver.resolve.bind(resolver);

        // Runtime config
        const privateConfig: ContentrainOptions = {
            path: options.path,
            defaultLocale: options.defaultLocale,
            storage: options.storage,
        };

        nuxt.options.runtimeConfig.contentrain = defu(
            nuxt.options.runtimeConfig.contentrain || {},
            privateConfig,
        );

        // Public config
        const publicConfig: Partial<ContentrainOptions> = {
            path: options.path,
            defaultLocale: options.defaultLocale,
        };

        nuxt.options.runtimeConfig.public.contentrain = defu(
            nuxt.options.runtimeConfig.public.contentrain || {},
            publicConfig,
        );

        // Storage yapılandırması
        nuxt.hooks.hook('nitro:config', (nitroConfig) => {
            // Storage ayarları
            nitroConfig.storage = nitroConfig.storage || {};
            nitroConfig.storage.data = {
                driver: options.storage?.driver || 'memory',
                base: options.storage?.base || '.contentrain',
            };

            // Virtual imports
            nitroConfig.imports = {
                ...nitroConfig.imports,
                presets: [
                    {
                        from: 'unstorage',
                        imports: ['createStorage'],
                    },
                ],
            };

            // Storage plugin'i ekle
            nitroConfig.plugins = nitroConfig.plugins || [];
            nitroConfig.plugins.push(resolve('./runtime/server/plugins/contentrain'));
        });

        // API handlers
        addServerHandler({
            route: '/_contentrain/api/models',
            handler: resolve('./runtime/server/api/models/index.get'),
            method: 'get',
        });

        addServerHandler({
            route: '/_contentrain/api/models/:id',
            handler: resolve('./runtime/server/api/models/[id].get'),
            method: 'get',
        });

        addServerHandler({
            route: '/_contentrain/api/query',
            handler: resolve('./runtime/server/api/query.get'),
            method: 'get',
        });

        // Composables ekle
        const composablePath = resolve('./runtime/composables');
        addImportsDir(composablePath);

        // Types
        nuxt.hooks.hook('prepare:types', (options) => {
            options.references.push({
                path: resolve('./runtime/types/index.d.ts'),
            });
        });

        // Build hooks
        nuxt.hooks.hook('build:before', () => {
            console.info('[Contentrain] Initializing module...');
        });

        // Error handling
        nuxt.hooks.hook('build:error', (error) => {
            console.error('[Contentrain] Build error:', error);
        });

        // Close hooks
        nuxt.hooks.hook('close', async () => {
            console.info('[Contentrain] Cleaning up...');
        });
    },
});
