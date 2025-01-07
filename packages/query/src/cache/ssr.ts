import type { CacheManager, CacheOptions } from '../types';

interface SSRCacheEntry {
  value: any
  expiresAt?: number
}

interface SSRCacheState {
  [key: string]: SSRCacheEntry
}

export class SSRCache implements CacheManager {
  private cache: Map<string, SSRCacheEntry>;
  private static state: SSRCacheState = {};

  constructor(initialState?: SSRCacheState) {
    this.cache = new Map();
    if (initialState) {
      Object.entries(initialState).forEach(([key, entry]) => {
        if (!this.isExpired(entry))
          this.cache.set(key, entry);
      });
    }
  }

  private getNamespacedKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private isExpired(item: SSRCacheEntry): boolean {
    return item.expiresAt !== undefined && item.expiresAt < Date.now();
  }

  private cleanExpiredEntries(): void {
    // Memory cache'den temizle
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }

    // State'den temizle
    for (const [key, entry] of Object.entries(SSRCache.state)) {
      if (this.isExpired(entry)) {
        delete SSRCache.state[key];
      }
    }
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    this.cleanExpiredEntries();

    const namespacedKey = this.getNamespacedKey(key, options?.namespace);
    const item = this.cache.get(namespacedKey) || SSRCache.state[namespacedKey];

    if (!item)
      return null;

    if (this.isExpired(item)) {
      await this.delete(key, options);
      return null;
    }

    return item.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    this.cleanExpiredEntries();

    const namespacedKey = this.getNamespacedKey(key, options?.namespace);
    const entry: SSRCacheEntry = {
      value,
      expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
    };
    this.cache.set(namespacedKey, entry);
    SSRCache.state[namespacedKey] = entry;
  }

  async has(key: string, options?: CacheOptions): Promise<boolean> {
    this.cleanExpiredEntries();

    const namespacedKey = this.getNamespacedKey(key, options?.namespace);
    const item = this.cache.get(namespacedKey) || SSRCache.state[namespacedKey];

    if (!item)
      return false;

    if (this.isExpired(item)) {
      await this.delete(key, options);
      return false;
    }

    return true;
  }

  async delete(key: string, options?: CacheOptions): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key, options?.namespace);
    this.cache.delete(namespacedKey);
    delete SSRCache.state[namespacedKey];
  }

  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      const prefix = `${namespace}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
          delete SSRCache.state[key];
        }
      }
    }
    else {
      this.cache.clear();
      SSRCache.state = {};
    }
  }

  // SSR Özel Metodları
  getState(): SSRCacheState {
    this.cleanExpiredEntries();
    return { ...SSRCache.state };
  }

  static dehydrate(): SSRCacheState {
    return SSRCache.state;
  }

  static hydrate(state: SSRCacheState): void {
    SSRCache.state = state;
  }
}
