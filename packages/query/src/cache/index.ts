import type { CacheOptions } from '../types';

export interface CacheManager {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, value: T, options?: CacheOptions) => Promise<void>
  has: (key: string) => Promise<boolean>
  delete: (key: string) => Promise<void>
  clear: () => Promise<void>
}

export class MemoryCacheManager implements CacheManager {
  private cache = new Map<string, { value: any, expires: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item)
      return null;

    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const expires = options?.ttl ? Date.now() + options.ttl : 0;
    this.cache.set(key, { value, expires });
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

export function createCacheManager(strategy: 'memory' | 'none'): CacheManager {
  switch (strategy) {
    case 'memory':
      return new MemoryCacheManager();
    case 'none':
    default:
      return {
        get: async () => null,
        set: async () => {},
        has: async () => false,
        delete: async () => {},
        clear: async () => {},
      };
  }
}
