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

export interface IContentrainCore {
  getModelMetadata: (collection: string) => Promise<ContentrainModelMetadata>
  getContent: <T>(collection: string) => Promise<T[]>
  getContentById: <T>(collection: string, id: string) => Promise<T>
  getAvailableCollections: () => Promise<string[]>
  getLocale: () => string | undefined
}

export class ContentrainCore implements IContentrainCore {
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
          throw new ContentrainErrorImpl('Failed to read JSON file', {
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

  getLocale(): string | undefined {
    return this.config.locale;
  }

  private getModelPath(collection: string): string {
    return join(this.config.modelsPath, `${collection}.model.json`);
  }

  private getContentPath(collection: string): string {
    return join(this.config.contentPath, collection);
  }

  async getModelMetadata(collection: string): Promise<ContentrainModelMetadata> {
    const modelPath = this.getModelPath(collection);
    return this.fs.readJSON<ContentrainModelMetadata>(modelPath);
  }

  async getAvailableCollections(): Promise<string[]> {
    const files = await this.fs.readdir(this.config.modelsPath);
    return files
      .filter(file => file.endsWith('.model.json'))
      .map(file => file.replace('.model.json', ''));
  }

  async getContent<T>(collection: string): Promise<T[]> {
    const contentPath = this.getContentPath(collection);
    const exists = await this.fs.exists(contentPath);

    if (!exists) {
      return [];
    }

    const files = await this.fs.readdir(contentPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const contents = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = join(contentPath, file);
        const content = await this.fs.readJSON<T | Record<string, T>>(filePath);
        if (this.config.locale && typeof content === 'object' && content !== null && !Array.isArray(content)) {
          const localizedContent = (content as Record<string, T>)[this.config.locale];
          if (localizedContent) {
            return localizedContent;
          }
        }
        return content as T;
      }),
    );

    return contents;
  }

  async getContentById<T>(collection: string, id: string): Promise<T> {
    const contentPath = this.getContentPath(collection);
    const filePath = join(contentPath, `${id}.json`);
    const content = await this.fs.readJSON<T | Record<string, T>>(filePath);

    if (this.config.locale && typeof content === 'object' && content !== null && !Array.isArray(content)) {
      const localizedContent = (content as Record<string, T>)[this.config.locale];
      if (localizedContent) {
        return localizedContent;
      }
    }

    return content as T;
  }
}
