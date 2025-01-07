import type { ContentrainBaseModel } from '@contentrain/types';
import type {
  RuntimeAdapter,
  RuntimeContext,
  RuntimeOptions,
  RuntimeResult,
} from '../types';
import { IndexedDBCache } from './indexeddb';

export class BrowserRuntime implements RuntimeAdapter {
  private options: RuntimeOptions | null = null;
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private indexedDB: IndexedDBCache | null = null;

  async initialize(options: RuntimeOptions): Promise<void> {
    this.options = options;

    // IndexedDB cache stratejisi için cache'i başlat
    if (options.cache?.strategy === 'indexeddb') {
      this.indexedDB = new IndexedDBCache();
      await this.indexedDB.initialize();
    }
  }

  private getModelUrl(model: string, context?: RuntimeContext): string {
    if (!this.options?.basePath) {
      throw new Error('Base path not configured');
    }
    return `${this.options.basePath}/${model}/${context?.locale || 'en'}.json`;
  }

  private getCacheKey(model: string, context?: RuntimeContext): string {
    return `${model}:${context?.locale || 'en'}`;
  }

  private async getCachedData<T>(key: string): Promise<{ data: T[], buildInfo: any } | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 dakika cache süresi
      return cached.data;
    }

    if (this.indexedDB) {
      const data = await this.indexedDB.get(key);
      if (data) {
        return data as { data: T[], buildInfo: any };
      }
    }

    return null;
  }

  private async setCachedData<T>(key: string, data: { data: T[], buildInfo: any }): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    if (this.indexedDB) {
      await this.indexedDB.set(key, data);
    }
  }

  async loadModel<T extends ContentrainBaseModel>(
    model: string,
    context?: RuntimeContext,
  ): Promise<RuntimeResult<T>> {
    if (!this.options) {
      throw new Error('Runtime not initialized');
    }

    const cacheKey = this.getCacheKey(model, context);
    const cachedData = await this.getCachedData<T>(cacheKey);

    if (cachedData) {
      return {
        data: cachedData.data,
        metadata: {
          total: cachedData.data.length,
          cached: true,
          buildInfo: cachedData.buildInfo,
        },
      };
    }

    try {
      const response = await fetch(this.getModelUrl(model, context));
      if (!response.ok) {
        return {
          data: [],
          metadata: {
            total: 0,
            cached: false,
            buildInfo: {
              timestamp: Date.now(),
              version: '1.0.0',
              error: `HTTP error! status: ${response.status}`,
            },
          },
        };
      }

      const data = await response.json() as T[];
      const result: RuntimeResult<T> = {
        data,
        metadata: {
          total: data.length,
          cached: false,
          buildInfo: {
            timestamp: Date.now(),
            version: '1.0.0',
          },
        },
      };

      await this.setCachedData(cacheKey, {
        data: result.data,
        buildInfo: result.metadata.buildInfo,
      });

      return result;
    }
    catch (error) {
      return {
        data: [],
        metadata: {
          total: 0,
          cached: false,
          buildInfo: {
            timestamp: Date.now(),
            version: '1.0.0',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      };
    }
  }

  async loadRelation<T extends ContentrainBaseModel>(
    model: string,
    id: string,
    context?: RuntimeContext,
  ): Promise<T | null> {
    const result = await this.loadModel<T>(model, context);
    return result.data.find(item => item.ID === id) || null;
  }

  async invalidateCache(model?: string): Promise<void> {
    if (model) {
      // Belirli bir model için cache'i temizle
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${model}:`)) {
          this.cache.delete(key);
        }
      }

      if (this.indexedDB) {
        await this.indexedDB.clear(model);
      }
    }
    else {
      // Tüm cache'i temizle
      this.cache.clear();
      if (this.indexedDB) {
        await this.indexedDB.clear();
      }
    }
  }

  async cleanup(): Promise<void> {
    this.cache.clear();
    if (this.indexedDB) {
      await this.indexedDB.clear();
      await this.indexedDB.close();
    }
    this.indexedDB = null;
  }
}
