import type { Content, LocalizedContent, ModelData, ModelMetadata } from './types';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
    addImportsDir,
    addTypeTemplate,
    createResolver,
    defineNuxtModule,
} from '@nuxt/kit';
import { defu } from 'defu';
import { ContentrainTypeGenerator } from './runtime/server/services/type-generator';

export interface ContentrainOptions {
    /**
     * Contentrain içerik klasörünün yolu
     * @default 'contentrain'
     */
    path?: string
    /**
     * Varsayılan dil
     * @default 'en'
     */
    defaultLocale?: string
    /**
     * Prerender edilmiş dosyaların çıktı dizini
     * @default '_contentrain'
     */
    outputDir?: string
}

// Hata kodları
const ERROR_CODES = {
    MODELS_DIR_NOT_FOUND: 'MODELS_DIR_NOT_FOUND',
    METADATA_NOT_FOUND: 'METADATA_NOT_FOUND',
    PRERENDER_FAILED: 'PRERENDER_FAILED',
};

// ContentrainError sınıfı
class ContentrainError extends Error {
    code: string;
    details?: unknown;

    constructor({ code, message, details }: { code: string, message: string, details?: unknown }) {
        super(message);
        this.name = 'ContentrainError';
        this.code = code;
        this.details = details;
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
        path: 'contentrain',
        defaultLocale: 'en',
        outputDir: '_contentrain',
    },
    setup(options, nuxt) {
        const resolver = createResolver(import.meta.url);
        const runtimeDir = resolver.resolve('./runtime');

        // Runtime config
        nuxt.options.runtimeConfig.public.contentrain = defu(
            nuxt.options.runtimeConfig.public.contentrain || {},
            {
                path: options.path,
                defaultLocale: options.defaultLocale,
                outputDir: options.outputDir,
            },
        );

        // Transpile runtime
        nuxt.options.build.transpile.push(runtimeDir);

        // Composables ekle
        const composablePath = resolver.resolve('./runtime/composables');
        addImportsDir(composablePath);

        // Contentrain dosyaları için routeRules ve Nitro yapılandırması
        const outputDir = options.outputDir || '_contentrain';

        // Nitro yapılandırması
        nuxt.options.nitro = defu(nuxt.options.nitro, {
            prerender: {
                crawlLinks: true,
                routes: [`/${outputDir}/**`],
                ignore: ['/api/**'],
            },
            routeRules: {
                [`/${outputDir}/**`]: {
                    prerender: true,
                    static: true,
                    cors: true,
                    headers: {
                        'cache-control': 'public, max-age=3600',
                        'access-control-allow-origin': '*',
                        'access-control-allow-methods': 'GET',
                    },
                },
            },
            storage: {
                contentrain: {
                    driver: 'fs',
                    base: `./${outputDir}`,
                },
            },
        });

        // Experimental özellikler
        nuxt.options.experimental = defu(nuxt.options.experimental, {
            payloadExtraction: true,
            asyncContext: true,
        });

        // Type generator
        const typeGenerator = new ContentrainTypeGenerator(options);

        // Types - Use addTypeTemplate to add type definitions
        addTypeTemplate({
            filename: 'types/contentrain.d.ts',
            getContents: async () => {
                try {
                    // Generate types and get the content
                    const typeDefinitions = await typeGenerator.generateTypes();
                    return typeDefinitions;
                }
                catch (error) {
                    console.error('[Contentrain] Error generating types:', error);
                    return `// Error generating types
// Please check your model schemas and try again
import type { Content, LocalizedContent, QueryResult, SingleQueryResult } from '@contentrain/nuxt-json';
`;
                }
            },
        });

        // JSON dosyalarını prerender et
        async function prerenderModelData() {
            try {
                console.info('[Contentrain] Prerendering model data...');

                const modelsDir = join(options.path || 'contentrain', 'models');
                // Yapılandırmadan outputDir'i kullan
                const outputDir = options.outputDir || '_contentrain';

                // Nuxt'ın public/static dizinini kullan
                // Nuxt 3'te public dizini yerine static dizini kullanılabilir
                const publicDirName = nuxt.options.dir.public || nuxt.options.dir.static || 'public';

                // Geliştirme modunda veya SSR modunda public dizinini kullan
                // SSG (generate) modunda ise generate.dir dizinini kullan
                let targetDir;
                if (nuxt.options._generate) {
                    // SSG modu
                    targetDir = join(nuxt.options.generate && typeof nuxt.options.generate === 'object' && 'dir' in nuxt.options.generate
                        ? nuxt.options.generate.dir as string
                        : 'dist', outputDir);
                    console.info('[Contentrain] Using SSG mode with generate directory');
                }
                else {
                    // SSR veya development modu
                    targetDir = join(nuxt.options.rootDir, publicDirName, outputDir);
                    console.info('[Contentrain] Using SSR/development mode with public directory');
                }

                console.info(`[Contentrain] Target directory: ${targetDir}`);

                // Hedef dizini oluştur
                await fs.mkdir(targetDir, { recursive: true });

                // Models dizini kontrolü
                try {
                    await fs.access(modelsDir);
                }
                catch (error) {
                    console.error('[Contentrain] Models directory not found:', modelsDir);
                    throw new ContentrainError({
                        code: ERROR_CODES.MODELS_DIR_NOT_FOUND,
                        message: `Models directory not found: ${modelsDir}`,
                        details: error,
                    });
                }

                // metadata.json kontrolü
                const metadataPath = join(modelsDir, 'metadata.json');
                let metadata;
                try {
                    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
                    metadata = JSON.parse(metadataContent);

                    // metadata.json dosyasını public dizinine kopyala
                    await fs.writeFile(
                        join(targetDir, 'metadata.json'),
                        metadataContent,
                        'utf-8',
                    );
                }
                catch (error) {
                    console.error('[Contentrain] metadata.json not found or invalid');
                    throw new ContentrainError({
                        code: ERROR_CODES.METADATA_NOT_FOUND,
                        message: 'metadata.json not found or invalid',
                        details: error,
                    });
                }

                // Modelleri paralel olarak işle
                const modelPromises = metadata.map(async (model: ModelMetadata) => {
                    try {
                        // Model dizinini oluştur
                        const modelPublicDir = join(targetDir, model.modelId);
                        await fs.mkdir(modelPublicDir, { recursive: true });

                        // Model field tanımlarını yükle ve kopyala
                        const fieldsPath = join(modelsDir, `${model.modelId}.json`);
                        const fieldsContent = await fs.readFile(fieldsPath, 'utf-8');
                        const fields = JSON.parse(fieldsContent);

                        // Fields dosyasını public dizinine kopyala
                        await fs.writeFile(
                            join(targetDir, `${model.modelId}.json`),
                            fieldsContent,
                            'utf-8',
                        );

                        // Model içeriğini yükle ve kopyala
                        const modelPath = join(options.path || 'contentrain', model.modelId);
                        let content: (Content | LocalizedContent)[] = [];

                        if (model.localization) {
                            // Dil dosyalarını bul ve yükle
                            const files = await fs.readdir(modelPath);
                            const langFiles = files.filter(f => f.endsWith('.json'));

                            // Her dil dosyasını kopyala
                            for (const file of langFiles) {
                                const filePath = join(modelPath, file);
                                const fileContent = await fs.readFile(filePath, 'utf-8');

                                // Dil dosyasını public dizinine kopyala
                                await fs.writeFile(
                                    join(modelPublicDir, file),
                                    fileContent,
                                    'utf-8',
                                );

                                // İçeriği birleştir
                                const lang = file.replace('.json', '');
                                const langContent = JSON.parse(fileContent).map((item: Content) => ({
                                    ...item,
                                    _lang: lang,
                                }));
                                content = [...content, ...langContent];
                            }
                        }
                        else {
                            // Tek dosyayı yükle ve kopyala
                            const contentPath = join(modelPath, `${model.modelId}.json`);
                            const contentData = await fs.readFile(contentPath, 'utf-8');
                            content = JSON.parse(contentData);

                            // İçerik dosyasını public dizinine kopyala
                            await fs.writeFile(
                                join(modelPublicDir, `${model.modelId}.json`),
                                contentData,
                                'utf-8',
                            );
                        }

                        // Model verisini oluştur
                        const modelData: ModelData = {
                            metadata: model,
                            fields,
                            content,
                        };

                        // Tam model verisini de public dizinine kaydet
                        await fs.writeFile(
                            join(targetDir, `model-${model.modelId}.json`),
                            JSON.stringify(modelData),
                            'utf-8',
                        );

                        return modelData;
                    }
                    catch (error) {
                        console.error(`[Contentrain] Error prerendering model ${model.modelId}:`, error);
                        return null;
                    }
                });

                // Tüm modelleri bekle ve geçerli olanları kaydet
                const models = (await Promise.all(modelPromises)).filter(Boolean) as ModelData[];

                if (models.length === 0) {
                    console.warn('[Contentrain] No valid models found');
                }
                else {
                    console.info(`[Contentrain] Prerendered ${models.length} models successfully`);

                    // Model listesini public dizinine kaydet
                    await fs.writeFile(
                        join(targetDir, 'models.json'),
                        JSON.stringify(models),
                        'utf-8',
                    );
                }

                console.info('[Contentrain] Prerendering completed successfully');
            }
            catch (error) {
                console.error('[Contentrain] Prerendering failed:', error);

                if (!(error instanceof ContentrainError)) {
                    throw new ContentrainError({
                        code: ERROR_CODES.PRERENDER_FAILED,
                        message: 'Prerendering failed',
                        details: error,
                    });
                }
                throw error;
            }
        }

        // Prerender işlemini build:before hook'unda çalıştır
        // Bu, build işlemi başlamadan önce prerender işleminin tamamlanmasını sağlar
        if (options.outputDir) {
            nuxt.hooks.hook('build:before', async () => {
                await prerenderModelData();
            });
        }

        // Development modunda da prerender işlemini çalıştır
        if (options.outputDir && nuxt.options.dev) {
            nuxt.hooks.hook('ready', async () => {
                await prerenderModelData();
            });
        }
    },
});
