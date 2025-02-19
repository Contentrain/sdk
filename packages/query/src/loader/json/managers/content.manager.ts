import type { IBaseJSONRecord, IJSONContentFile, IJSONModelConfig } from '../../types/json';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loggers } from '../../../utils/logger';

const logger = loggers.loader;

export class JSONContentManager {
  private readonly modelConfigCache = new Map<string, IJSONModelConfig>();
  private readonly contentCache = new Map<string, IJSONContentFile<any>>();

  constructor(
    protected readonly contentDir: string,
    protected readonly defaultLocale?: string,
  ) {}

  private getContentCacheKey(modelId: string, locale: string): string {
    return `${modelId}:${locale}`;
  }

  public async loadModelConfig(modelId: string): Promise<IJSONModelConfig> {
    // Cache kontrolü
    const cached = this.modelConfigCache.get(modelId);
    if (cached) {
      return cached;
    }

    try {
      const metadataPath = join(this.contentDir, 'models', 'metadata.json');
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const allMetadata = JSON.parse(metadataContent);

      const modelMetadata = allMetadata.find((m: any) => m.modelId === modelId);
      if (!modelMetadata) {
        logger.error('Model metadata not found:', {
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
        logger.error('Failed to parse model fields:', {
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
      const config = {
        metadata: modelMetadata,
        fields: modelFields,
      };

      // Cache'e kaydet
      this.modelConfigCache.set(modelId, config);

      return config;
    }
    catch (error: any) {
      logger.error('Failed to load model config:', {
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
      return cached;
    }

    try {
      const modelConfig = await this.loadModelConfig(modelId);
      let contentPath: string;
      let effectiveLocale = locale;

      if (modelConfig.metadata.localization) {
        if (locale === 'default') {
          if (!this.defaultLocale) {
            logger.error('Default locale required:', {
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
      const content = await readFile(contentPath, 'utf-8');
      let data: T[];

      try {
        data = JSON.parse(content);

        if (!Array.isArray(data)) {
          throw new TypeError('Content must be an array');
        }
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
        logger.error('JSON parse error:', {
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
      logger.error('Content load error:', {
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
      return assets;
    }
    catch (error: any) {
      logger.warn('Assets file not found or cannot be read:', {
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
        return ['default'];
      }

      const modelDir = join(this.contentDir, modelId);
      const files = await readdir(modelDir);

      const locales = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .filter(locale => locale !== modelId);

      if (locales.length === 0) {
        logger.error('No locale files found:', {
          modelId,
          modelDir,
          files,
        });
        throw new Error(`No locale files found for localized model "${modelId}"`);
      }
      return locales;
    }
    catch (error: any) {
      logger.error('Failed to read locales:', {
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
  }

  getCacheStats(): { modelConfigs: number, contents: number } {
    return {
      modelConfigs: this.modelConfigCache.size,
      contents: this.contentCache.size,
    };
  }
}
