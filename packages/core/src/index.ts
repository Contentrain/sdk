import type {
  ContentrainConfig,
  ContentrainError,
  ContentrainFileSystem,
  ContentrainModelMetadata,
  RequiredConfig,
} from '@contentrain/types';

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
      readJSON: fetchJSON,
      exists: async (path: string) => {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          return response.ok;
        }
        catch {
          return false;
        }
      },
      readdir: async (path: string) => {
        throw new ContentrainErrorImpl('readdir is not supported in the browser', {
          code: 'CONTENTRAIN_UNSUPPORTED_OPERATION',
          path,
        });
      },
    };
  }

  getLocale(): string | undefined {
    return this.config.locale;
  }

  private getModelPath(collection: string): string {
    return joinPaths(this.config.modelsPath, `${collection}.model.json`);
  }

  private getContentPath(collection: string): string {
    return joinPaths(this.config.contentPath, collection);
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
        const filePath = joinPaths(contentPath, file);
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
    const filePath = joinPaths(contentPath, `${id}.json`);
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

// Tarayıcı uyumlu dosya okuma fonksiyonu
async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new ContentrainErrorImpl('Failed to fetch JSON file', {
      code: 'CONTENTRAIN_FETCH_ERROR',
      path,
    });
  }
  return response.json() as Promise<T>;
}

function joinPaths(...paths: string[]): string {
  return paths.map(path => path.replace(/^\/|\/$/g, '')).join('/');
}
