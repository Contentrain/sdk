import type {
  ContentrainConfig,
  ContentrainError,
  ContentrainFileSystem,
  ContentrainModelMetadata,
  RequiredConfig,
} from '@contentrain/types';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

class ContentrainErrorImpl extends Error implements ContentrainError {
  code: string;
  path?: string;

  constructor(message: string, options: { code: string, path?: string }) {
    super(message);
    this.name = 'ContentrainError';
    this.code = options.code;
    this.path = options.path;
  }
}

export class ContentrainCore {
  private config: RequiredConfig;
  private fs: ContentrainFileSystem;

  constructor(config: ContentrainConfig = {}, customFs?: ContentrainFileSystem) {
    this.config = {
      contentPath: config.contentPath ?? 'contentrain',
      modelsPath: config.modelsPath ?? 'contentrain/models',
      assetsPath: config.assetsPath ?? 'contentrain/assets',
      locale: config.locale ?? undefined,
    } as RequiredConfig;

    this.fs = customFs ?? {
      readJSON: async <T>(path: string) => {
        try {
          const content = await fs.readFile(path, 'utf-8');
          return JSON.parse(content) as T;
        }
        catch {
          throw new ContentrainErrorImpl(`Failed to read JSON file: ${path}`, {
            code: 'CONTENTRAIN_READ_ERROR',
            path,
          });
        }
      },
      exists: async (path: string) => {
        try {
          await fs.access(path);
          return true;
        }
        catch {
          return false;
        }
      },
      readdir: async (path: string) => {
        try {
          return await fs.readdir(path);
        }
        catch {
          throw new ContentrainErrorImpl(`Failed to read directory: ${path}`, {
            code: 'CONTENTRAIN_READ_ERROR',
            path,
          });
        }
      },
    };
  }

  private getModelPath(collection: string, locale?: string): string {
    const modelPath = join(this.config.modelsPath, `${collection}.model.json`);
    if (locale) {
      return join(this.config.modelsPath, locale, `${collection}.model.json`);
    }
    return modelPath;
  }

  private getContentPath(collection: string, locale?: string): string {
    const contentPath = join(this.config.contentPath, collection);
    if (locale) {
      return join(this.config.contentPath, locale, collection);
    }
    return contentPath;
  }

  async getModelMetadata(collection: string): Promise<ContentrainModelMetadata> {
    const modelPath = this.getModelPath(collection, this.config.locale);
    return this.fs.readJSON<ContentrainModelMetadata>(modelPath);
  }

  async getAvailableCollections(): Promise<string[]> {
    const modelPath = this.config.locale
      ? join(this.config.modelsPath, this.config.locale)
      : this.config.modelsPath;

    const files = await this.fs.readdir(modelPath);
    return files
      .filter(file => file.endsWith('.model.json'))
      .map(file => file.replace('.model.json', ''));
  }

  async getContent<T>(collection: string): Promise<T[]> {
    const contentPath = this.getContentPath(collection, this.config.locale);
    const exists = await this.fs.exists(contentPath);

    if (!exists) {
      return [];
    }

    const files = await this.fs.readdir(contentPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const contents = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = join(contentPath, file);
        return this.fs.readJSON<T>(filePath);
      }),
    );

    return contents;
  }

  async getContentById<T>(collection: string, id: string): Promise<T> {
    const contentPath = this.getContentPath(collection, this.config.locale);
    const filePath = join(contentPath, `${id}.json`);

    return this.fs.readJSON<T>(filePath);
  }
}
