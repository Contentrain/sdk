import type { CacheManager, CacheOptions } from '../types';

export class MemoryCache implements CacheManager {
  private cache: Map<string, { value: any, expires?: number }> = new Map();
  private namespaces: Map<string, Set<string>> = new Map();

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const namespacedKey = this.getNamespacedKey(key, options?.namespace);
    const item = this.cache.get(namespacedKey);

    if (!item)
      return null;
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(namespacedKey);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key, options?.namespace);
    const expires = options?.ttl ? Date.now() + options.ttl : undefined;

    this.cache.set(namespacedKey, { value, expires });

    if (options?.namespace) {
      let keys = this.namespaces.get(options.namespace);
      if (!keys) {
        keys = new Set();
        this.namespaces.set(options.namespace, keys);
      }
      keys.add(key);
    }
  }

  async has(key: string, options?: CacheOptions): Promise<boolean> {
    const namespacedKey = this.getNamespacedKey(key, options?.namespace);
    const item = this.cache.get(namespacedKey);
    if (!item)
      return false;
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(namespacedKey);
      return false;
    }
    return true;
  }

  async delete(key: string, options?: CacheOptions): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key, options?.namespace);
    this.cache.delete(namespacedKey);
  }

  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      const keys = this.namespaces.get(namespace);
      if (keys) {
        for (const key of keys) {
          const namespacedKey = this.getNamespacedKey(key, namespace);
          this.cache.delete(namespacedKey);
        }
        this.namespaces.delete(namespace);
      }
    }
    else {
      this.cache.clear();
      this.namespaces.clear();
    }
  }

  private getNamespacedKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }
}

// Default cache instance
export const defaultCache = new MemoryCache();

// Re-export SSRCache from ssr.ts
export { SSRCache } from './ssr';
