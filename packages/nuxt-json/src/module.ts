import type { ModelMetadata } from './types';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
    addImportsDir,
    addServerHandler,
    addTypeTemplate,
    createResolver,
    defineNuxtModule,
} from '@nuxt/kit';
import { defu } from 'defu';
import { ContentrainTypeGenerator } from './runtime/server/services/type-generator';

async function buildContentrainAssets(
    contentDir: string,
    buildDir: string,
    options: ContentrainOptions,
) {
    if (!contentDir) {
        console.warn('[Contentrain Module] Content directory is not configured; skipping asset build');
        return [];
    }

    await fs.mkdir(buildDir, { recursive: true });

    try {
        const metadataPath = join(contentDir, 'models', 'metadata.json');
        const metadataExists = await fs.stat(metadataPath).then(() => true).catch(() => false);

        if (!metadataExists) {
            console.warn('[Contentrain Module] Metadata file not found; skipping asset build');
            return [];
        }

        const metadata: ModelMetadata[] = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        await Promise.all(metadata.map(async (model: ModelMetadata) => {
            const modelDir = join(buildDir, model.modelId);
            await fs.mkdir(modelDir, { recursive: true });

            await fs.copyFile(
                join(contentDir, 'models', `${model.modelId}.json`),
                join(modelDir, 'definition.json'),
            );

            if (model.localization) {
                const modelContentPath = join(contentDir, model.modelId);
                let langFiles: string[] = [];

                try {
                    const files = await fs.readdir(modelContentPath);
                    langFiles = files
                        .filter(file => file.endsWith('.json'))
                        .map(file => file.replace('.json', ''));
                }
                catch {
                    langFiles = [options.defaultLocale || 'en'];
                }

                // locales alanını doldur
                model.locales = langFiles.length ? langFiles : [options.defaultLocale || 'en'];

                await Promise.all(langFiles.map(async (lang) => {
                    const sourcePath = join(contentDir, model.modelId, `${lang}.json`);
                    const targetPath = join(modelDir, `${lang}.json`);

                    try {
                        await fs.access(sourcePath);
                        await fs.copyFile(sourcePath, targetPath);
                    }
                    catch {
                        await fs.writeFile(targetPath, '[]');
                    }
                }));
            }
            else {
                const sourcePath = join(contentDir, model.modelId, `${model.modelId}.json`);
                const targetPath = join(modelDir, 'content.json');

                try {
                    await fs.access(sourcePath);
                    await fs.copyFile(sourcePath, targetPath);
                }
                catch {
                    await fs.writeFile(targetPath, '[]');
                }
            }
        }));

        // Yazılmış (mutated) metadata'yı build dizinine kaydet
        await fs.writeFile(join(buildDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');

        const assetsPath = join(contentDir, 'assets.json');
        if (await fs.stat(assetsPath).catch(() => false)) {
            await fs.copyFile(assetsPath, join(buildDir, 'assets.json'));
        }

        console.info('[Contentrain Module] Assets built successfully');
        return metadata;
    }
    catch (error) {
        console.error('[Contentrain Module] Error building assets:', error);
        throw error;
    }
}

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
// Export module with relaxed any annotation to avoid TS2742 d.ts portability issues across multiple Nuxt schema versions.
export default defineNuxtModule<ContentrainOptions>({
    meta: {
        name: '@contentrain/nuxt-json',
        configKey: 'contentrain',
        compatibility: {
            nuxt: '^3.0.0 || ^4.0.0',
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
        const hasContentDir = Boolean(options.path && options.path.trim().length > 0);

        console.info('[Contentrain Module] Initializing module', {
            path: options.path,
            defaultLocale: options.defaultLocale,
            storageDriver: options.storage?.driver,
            storageBase: options.storage?.base,
        });

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
        nuxt.hooks.hook('nitro:config', async (nitroConfig) => {
            console.info('[Contentrain Module] Configuring Nitro');

            let metadata: ModelMetadata[] = [];
            let buildDir: string | undefined;

            if (hasContentDir) {
                buildDir = join(options.path, '.contentrain-build');
                metadata = await buildContentrainAssets(options.path, buildDir, options);
            }

            nitroConfig.storage = nitroConfig.storage || {};
            nitroConfig.storage.data = {
                driver: options.storage?.driver || 'memory',
                base: options.storage?.base || '.contentrain',
            };

            if (buildDir) {
                nitroConfig.serverAssets = nitroConfig.serverAssets || [];
                nitroConfig.serverAssets.push({
                    baseName: 'contentrain',
                    dir: buildDir,
                });
            }

            if (hasContentDir) {
                const publicAssetsDir = join(options.path, 'public');
                nitroConfig.publicAssets = nitroConfig.publicAssets || [];
                nitroConfig.publicAssets.push({
                    baseURL: '/contentrain',
                    dir: publicAssetsDir,
                });
            }

            nitroConfig.prerender = nitroConfig.prerender || {};
            nitroConfig.prerender.routes = nitroConfig.prerender.routes || [];

            if (hasContentDir && metadata.length) {
                for (const model of metadata) {
                    const route = `/_contentrain/api/query?modelId=${model.modelId}`;
                    nitroConfig.prerender.routes.push(route);
                }
            }
            else if (!hasContentDir) {
                console.warn('[Contentrain Module] Skipping prerender configuration because content path is missing');
            }

            nitroConfig.externals = nitroConfig.externals || {};
            nitroConfig.externals.inline = nitroConfig.externals.inline || [];
            if (hasContentDir) {
                nitroConfig.externals.inline.push(options.path);
            }

            nitroConfig.imports = {
                ...nitroConfig.imports,
                presets: [
                    {
                        from: 'unstorage',
                        imports: ['createStorage'],
                    },
                ],
            };
        });

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

        const composablePath = resolve('./runtime/composables');
        addImportsDir(composablePath);

        const typeGenerator = new ContentrainTypeGenerator(options);

        addTypeTemplate({
            filename: 'types/contentrain.d.ts',
            getContents: async () => {
                if (!hasContentDir) {
                    return `// Contentrain types are unavailable because the content directory is not configured.
export {};
`;
                }

                try {
                    const typeDefinitions = await typeGenerator.generateTypes();
                    console.info('[Contentrain Module] Type definitions generated successfully');
                    return typeDefinitions;
                }
                catch (error) {
                    console.error('[Contentrain Module] Error generating types:', error);
                    return `// Error generating types
// Please check your model schemas and try again
import type { Content, LocalizedContent, QueryResult, SingleQueryResult, ApiResponse } from '@contentrain/nuxt-json';
`;
                }
            },
        });
    },
}) as any;
