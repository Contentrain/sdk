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

    const response = await fetch(this.getModelUrl(model, context));
    if (!response.ok) {
      throw new Error(`Failed to load model: ${model}`);
    }

    const data = await response.json();
    const result: RuntimeResult<T> = {
      data,
      metadata: {
        total: data.length,
        cached: false,
        buildInfo: {
          timestamp: Date.now(),
          version: '1.0.0', // TODO: Versiyon bilgisi eklenecek
        },
      },
    };

    await this.setCachedData(cacheKey, {
      data: result.data,
      buildInfo: result.metadata.buildInfo,
    });

    return result;
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
      await this.indexedDB.cleanup();
      this.indexedDB = null;
    }
    this.options = null;
  }

  private getModelUrl(model: string, context?: RuntimeContext): string {
    const base = this.options?.basePath || '';
    const buildOutput = context?.buildOutput || '';
    return `${base}/${buildOutput}/${model}.json`;
  }

  private getCacheKey(model: string, context?: RuntimeContext): string {
    const parts = [model];
    if (context?.locale)
      parts.push(`locale:${context.locale}`);
    if (context?.namespace)
      parts.push(`ns:${context.namespace}`);
    return parts.join(':');
  }

  private async getCachedData<T>(key: string): Promise<{
    data: T[]
    buildInfo?: { timestamp: number, version: string }
  } | null> {
    if (this.options?.cache?.strategy === 'memory') {
      const cached = this.cache.get(key);
      if (cached && this.isValidCache(cached.timestamp)) {
        return cached.data;
      }
    }
    else if (this.options?.cache?.strategy === 'indexeddb' && this.indexedDB) {
      return this.indexedDB.get(key);
    }
    return null;
  }

  private async setCachedData(
    key: string,
    data: { data: any, buildInfo?: { timestamp: number, version: string } },
  ): Promise<void> {
    if (this.options?.cache?.strategy === 'memory') {
      this.cache.set(key, { data, timestamp: Date.now() });
    }
    else if (this.options?.cache?.strategy === 'indexeddb' && this.indexedDB) {
      await this.indexedDB.set(key, data, {
        ttl: this.options.cache?.ttl,
        namespace: this.options.cache?.namespace,
      });
    }
  }

  private isValidCache(timestamp: number): boolean {
    const ttl = this.options?.cache?.ttl || 300000; // 5 dakika varsayılan
    return Date.now() - timestamp < ttl;
  }
}
