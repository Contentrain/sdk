import type {
    Content,
    LocalizedContent,
    ModelData,
    ModelMetadata,
} from '../../../types';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { useRuntimeConfig, useStorage } from '#imports';
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin';
import { STORAGE_KEYS, StorageManager } from '../utils/storage';

export default defineNitroPlugin(async (nitroApp) => {
    const storage = useStorage('data');
    const config = useRuntimeConfig();

    // Model verilerini yükle
    async function loadModelData() {
        try {
            // Cache kontrolü
            if (await StorageManager.isCacheValid()) {
                console.debug('[Contentrain] Using cached data');
                return;
            }

            // Storage'ı hazırla
            await StorageManager.prepare();

            const modelsDir = join(config.public.contentrain.path, 'models');

            // Models dizini kontrolü
            try {
                await fs.access(modelsDir);
            }
            catch (error) {
                console.error('[Contentrain] Models directory not found:', modelsDir);
                throw error;
            }

            // metadata.json kontrolü
            const metadataPath = join(modelsDir, 'metadata.json');
            let metadata;
            try {
                const metadataContent = await fs.readFile(metadataPath, 'utf-8');
                metadata = JSON.parse(metadataContent);
            }
            catch (error) {
                console.error('[Contentrain] metadata.json not found or invalid');
                throw error;
            }

            // Modelleri paralel olarak yükle
            const modelPromises = metadata.map(async (model: ModelMetadata) => {
                try {
                    // Model field tanımlarını yükle
                    const fieldsPath = join(modelsDir, `${model.modelId}.json`);
                    const fieldsContent = await fs.readFile(fieldsPath, 'utf-8');
                    const fields = JSON.parse(fieldsContent);

                    // Model içeriğini yükle
                    const modelPath = join(config.public.contentrain.path, model.modelId);
                    let content: (Content | LocalizedContent)[] = [];

                    if (model.localization) {
                        // Dil dosyalarını bul ve yükle
                        const files = await fs.readdir(modelPath);
                        const langFiles = files.filter(f => f.endsWith('.json'));

                        const langContents = await Promise.all(
                            langFiles.map(async (file) => {
                                const lang = file.replace('.json', '');
                                const content = await fs.readFile(join(modelPath, file), 'utf-8');
                                return JSON.parse(content).map((item: Content) => ({
                                    ...item,
                                    _lang: lang,
                                }));
                            }),
                        );

                        content = langContents.flat();
                    }
                    else {
                        // Tek dosyayı yükle
                        const contentPath = join(modelPath, `${model.modelId}.json`);
                        const contentData = await fs.readFile(contentPath, 'utf-8');
                        content = JSON.parse(contentData);
                    }

                    // Model verisini oluştur
                    const modelData: ModelData = {
                        metadata: model,
                        fields,
                        content,
                    };

                    // Storage'a kaydet
                    await storage.setItem(STORAGE_KEYS.MODEL_DATA(model.modelId), modelData);
                    return modelData;
                }
                catch (error) {
                    console.error(`[Contentrain] Error loading model ${model.modelId}:`, error);
                    return null;
                }
            });

            // Tüm modelleri bekle ve geçerli olanları kaydet
            const models = (await Promise.all(modelPromises)).filter(Boolean);
            await storage.setItem(STORAGE_KEYS.MODEL_LIST, models);

            // Storage'ı tamamla
            await StorageManager.complete();

            console.info('[Contentrain] Storage initialized successfully');
        }
        catch (error) {
            console.error('[Contentrain] Storage initialization failed:', error);
            await StorageManager.setError();
            throw error;
        }
    }

    // Nitro hooks
    nitroApp.hooks.hook('request', async () => {
        const isReady = await StorageManager.isReady();
        if (!isReady) {
            await loadModelData();
        }
    });
});
