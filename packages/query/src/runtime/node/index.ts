import type { ContentrainBaseModel } from '@contentrain/types';
import type {
  RuntimeAdapter,
  RuntimeContext,
  RuntimeOptions,
  RuntimeResult,
} from '../types';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export class NodeRuntime implements RuntimeAdapter {
  private options: RuntimeOptions | null = null;
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private fsCache: Map<string, { data: any, timestamp: number }> = new Map();

  async initialize(options: RuntimeOptions): Promise<void> {
    this.options = options;

    // Filesystem cache stratejisi için cache dizinini oluştur
    if (options.cache?.strategy === 'filesystem') {
      const cacheDir = path.join(process.cwd(), '.contentrain', 'cache');
      await fs.mkdir(cacheDir, { recursive: true });
    }
  }

  private getModelPath(model: string, context?: RuntimeContext): string {
    if (!this.options?.basePath) {
      throw new Error('Base path not configured');
    }
    return path.join(this.options.basePath, model, `${context?.locale || 'en'}.json`);
  }

  private getCacheKey(model: string, context?: RuntimeContext): string {
    return `${model}:${context?.locale || 'en'}`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    }
    catch {
      return false;
    }
  }

  private async getCachedData<T>(key: string): Promise<{ data: T[], buildInfo: any } | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 dakika cache süresi
      return cached.data;
    }
    return null;
  }

  private async setCachedData<T>(key: string, data: { data: T[], buildInfo: any }): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
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

    const modelPath = this.getModelPath(model, context);
    const exists = await this.fileExists(modelPath);

    if (!exists) {
      return {
        data: [],
        metadata: {
          total: 0,
          cached: false,
          buildInfo: {
            timestamp: Date.now(),
            version: '1.0.0',
          },
        },
      };
    }

    try {
      const content = await fs.readFile(modelPath, 'utf-8');
      const data = JSON.parse(content) as T[];

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

      if (this.options?.cache?.strategy === 'filesystem') {
        await this.clearFilesystemCache(model);
      }
    }
    else {
      // Tüm cache'i temizle
      this.cache.clear();
      if (this.options?.cache?.strategy === 'filesystem') {
        await this.clearFilesystemCache();
      }
    }
  }

  private async clearFilesystemCache(model?: string): Promise<void> {
    const cacheDir = path.join(process.cwd(), '.contentrain', 'cache');
    if (model) {
      const modelCacheDir = path.join(cacheDir, model);
      await fs.rm(modelCacheDir, { recursive: true, force: true });
    }
    else {
      await fs.rm(cacheDir, { recursive: true, force: true });
    }
  }

  async cleanup(): Promise<void> {
    this.cache.clear();
    this.fsCache.clear();
  }
}
