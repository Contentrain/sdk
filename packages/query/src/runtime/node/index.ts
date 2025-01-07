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
    const exists = await fs.stat(modelPath).catch(() => false);

    if (!exists) {
      throw new Error(`Model not found: ${model}`);
    }

    const content = await fs.readFile(modelPath, 'utf-8');
    const data = JSON.parse(content) as T[];

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

  async cleanup(): Promise<void> {
    this.cache.clear();
    if (this.options?.cache?.strategy === 'filesystem') {
      await this.clearFilesystemCache();
    }
    this.options = null;
  }

  private getModelPath(model: string, context?: RuntimeContext): string {
    const base = this.options?.basePath || process.cwd();
    const buildOutput = context?.buildOutput || '.contentrain/dist';
    return path.join(base, buildOutput, `${model}.json`);
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
    else if (this.options?.cache?.strategy === 'filesystem') {
      return this.getFromFilesystem(key);
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
    else if (this.options?.cache?.strategy === 'filesystem') {
      await this.setToFilesystem(key, data);
    }
  }

  private isValidCache(timestamp: number): boolean {
    const ttl = this.options?.cache?.ttl || 300000; // 5 dakika varsayılan
    return Date.now() - timestamp < ttl;
  }

  // Filesystem cache işlemleri
  private async getFromFilesystem(key: string): Promise<any> {
    const cached = this.fsCache.get(key);
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.data;
    }

    const cacheFile = this.getCacheFilePath(key);
    try {
      const content = await fs.readFile(cacheFile, 'utf-8');
      const data = JSON.parse(content);
      this.fsCache.set(key, { data, timestamp: Date.now() });
      return data;
    }
    catch {
      return null;
    }
  }

  private async setToFilesystem(key: string, data: any): Promise<void> {
    const cacheFile = this.getCacheFilePath(key);
    await fs.writeFile(cacheFile, JSON.stringify(data));
    this.fsCache.set(key, { data, timestamp: Date.now() });
  }

  private async clearFilesystemCache(model?: string): Promise<void> {
    const cacheDir = path.join(process.cwd(), '.contentrain', 'cache');

    if (model) {
      const pattern = `${model}-*.json`;
      const files = await fs.readdir(cacheDir);
      for (const file of files) {
        if (file.match(pattern)) {
          await fs.unlink(path.join(cacheDir, file));
        }
      }
    }
    else {
      await fs.rm(cacheDir, { recursive: true, force: true });
      await fs.mkdir(cacheDir, { recursive: true });
    }

    this.fsCache.clear();
  }

  private getCacheFilePath(key: string): string {
    const sanitizedKey = key.replace(/[^a-z0-9-]/gi, '-');
    return path.join(process.cwd(), '.contentrain', 'cache', `${sanitizedKey}.json`);
  }
}
