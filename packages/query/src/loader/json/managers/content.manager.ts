import type { ILogger } from '../../types/common';
import type { IBaseJSONRecord, IJSONContentFile, IJSONModelConfig } from '../../types/json';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export class JSONContentManager {
  private readonly modelConfigCache = new Map<string, IJSONModelConfig>();
  private readonly contentCache = new Map<string, IJSONContentFile<any>>();

  constructor(
    protected readonly contentDir: string,
    protected readonly logger: ILogger,
    protected readonly defaultLocale?: string,
  ) {}

  private getContentCacheKey(modelId: string, locale: string): string {
    return `${modelId}:${locale}`;
  }

  public async loadModelConfig(modelId: string): Promise<IJSONModelConfig> {
    // Cache kontrolü
    const cached = this.modelConfigCache.get(modelId);
    if (cached) {
      this.logger.debug('Model config loaded from cache:', {
        modelId,
        metadata: cached.metadata,
      });
      return cached;
    }

    try {
      const metadataPath = join(this.contentDir, 'models', 'metadata.json');
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const allMetadata = JSON.parse(metadataContent);

      const modelMetadata = allMetadata.find((m: any) => m.modelId === modelId);
      if (!modelMetadata) {
        this.logger.error('Model metadata not found:', {
          modelId,
          metadataPath,
          availableModels: allMetadata.map((m: any) => m.modelId),
          context: {
            contentDir: this.contentDir,
            operation: 'loadModelConfig',
          },
        });
        throw new Error(`Model metadata not found for ${modelId}`);
      }

      const modelPath = join(this.contentDir, 'models', `${modelId}.json`);
      const modelContent = await readFile(modelPath, 'utf-8');

      let modelFields;
      try {
        modelFields = JSON.parse(modelContent);
      }
      catch (parseError: any) {
        this.logger.error('Failed to parse model fields:', {
          modelId,
          modelPath,
          error: parseError?.message || 'Unknown error',
          content: modelContent.slice(0, 100),
          context: {
            contentDir: this.contentDir,
            operation: 'loadModelConfig',
          },
        });
        throw new Error(`Invalid JSON format in model fields: ${modelPath}`);
      }

      this.logger.debug('Model config loaded:', {
        modelId,
        metadata: modelMetadata,
        fieldsCount: modelFields.length,
      });

      const config = {
        metadata: modelMetadata,
        fields: modelFields,
      };

      // Cache'e kaydet
      this.modelConfigCache.set(modelId, config);

      return config;
    }
    catch (error: any) {
      this.logger.error('Failed to load model config:', {
        modelId,
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        context: {
          contentDir: this.contentDir,
          operation: 'loadModelConfig',
        },
      });
      throw error;
    }
  }

  async loadModelContent<T extends IBaseJSONRecord>(
    modelId: string,
    locale: string = 'default',
  ): Promise<IJSONContentFile<T>> {
    const cacheKey = this.getContentCacheKey(modelId, locale);
    const cached = this.contentCache.get(cacheKey) as IJSONContentFile<T> | undefined;

    if (cached) {
      this.logger.debug('Content loaded from cache:', {
        modelId,
        locale,
        cacheKey,
      });
      return cached;
    }

    try {
      const modelConfig = await this.loadModelConfig(modelId);
      let contentPath: string;
      let effectiveLocale = locale;

      if (modelConfig.metadata.localization) {
        if (locale === 'default') {
          if (!this.defaultLocale) {
            this.logger.error('Default locale required:', {
              modelId,
              locale,
              isLocalized: true,
              context: {
                contentDir: this.contentDir,
                operation: 'loadModelContent',
              },
            });
            throw new Error(`Default locale is required for localized model "${modelId}"`);
          }
          effectiveLocale = this.defaultLocale;
        }
        contentPath = join(this.contentDir, modelId, `${effectiveLocale}.json`);
      }
      else {
        contentPath = join(this.contentDir, modelId, `${modelId}.json`);
      }

      this.logger.debug('Loading content file:', {
        modelId,
        locale: effectiveLocale,
        contentPath,
        isLocalized: modelConfig.metadata.localization,
      });

      const content = await readFile(contentPath, 'utf-8');
      let data: T[];

      try {
        data = JSON.parse(content);

        if (!Array.isArray(data)) {
          throw new TypeError('Content must be an array');
        }

        this.logger.debug('Content loaded successfully:', {
          modelId,
          locale: effectiveLocale,
          recordCount: data.length,
        });

        const result = {
          model: modelId,
          locale: modelConfig.metadata.localization ? effectiveLocale : undefined,
          data,
        };

        // Cache'e kaydet
        this.contentCache.set(cacheKey, result);

        return result;
      }
      catch (parseError: any) {
        this.logger.error('JSON parse error:', {
          modelId,
          locale: effectiveLocale,
          contentPath,
          error: parseError?.message || 'Unknown error',
          content: content.slice(0, 100),
          context: {
            contentDir: this.contentDir,
            operation: 'loadModelContent',
          },
        });
        throw new Error(`Failed to load content: Invalid JSON format in ${contentPath}`);
      }
    }
    catch (error: any) {
      if (error.message.includes('Invalid JSON format')) {
        throw error;
      }
      this.logger.error('Content load error:', {
        modelId,
        locale,
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        context: {
          contentDir: this.contentDir,
          operation: 'loadModelContent',
        },
      });
      throw error;
    }
  }

  async loadAssets(): Promise<any[]> {
    try {
      const assetsPath = join(this.contentDir, 'assets.json');
      const assetsContent = await readFile(assetsPath, 'utf-8');
      const assets = JSON.parse(assetsContent);

      this.logger.debug('Assets loaded:', {
        count: assets.length,
        path: assetsPath,
      });

      return assets;
    }
    catch (error: any) {
      this.logger.warn('Assets file not found or cannot be read:', {
        error: error?.message || 'Unknown error',
        path: join(this.contentDir, 'assets.json'),
        context: {
          contentDir: this.contentDir,
          operation: 'loadAssets',
        },
      });
      return [];
    }
  }

  async getModelLocales(modelId: string): Promise<string[]> {
    try {
      const modelConfig = await this.loadModelConfig(modelId);

      if (!modelConfig.metadata.localization) {
        this.logger.debug('Non-localized model:', { modelId });
        return ['default'];
      }

      const modelDir = join(this.contentDir, modelId);
      const files = await readdir(modelDir);

      const locales = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .filter(locale => locale !== modelId);

      if (locales.length === 0) {
        this.logger.error('No locale files found:', {
          modelId,
          modelDir,
          files,
        });
        throw new Error(`No locale files found for localized model "${modelId}"`);
      }

      this.logger.debug('Locales found:', {
        modelId,
        locales,
        count: locales.length,
      });

      return locales;
    }
    catch (error: any) {
      this.logger.error('Failed to read locales:', {
        modelId,
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        context: {
          contentDir: this.contentDir,
          operation: 'getModelLocales',
        },
      });
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    this.modelConfigCache.clear();
    this.contentCache.clear();
    this.logger.debug('All caches cleared');
  }

  getCacheStats(): { modelConfigs: number, contents: number } {
    return {
      modelConfigs: this.modelConfigCache.size,
      contents: this.contentCache.size,
    };
  }
}
