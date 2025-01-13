import type { CacheEntry, CacheStats } from '../types/loader';
import { lru } from 'tiny-lru';

export interface MemoryCacheOptions {
  maxSize?: number // MB cinsinden
  defaultTTL?: number // ms cinsinden
}

export class MemoryCache {
  private cache;
  private options: Required<MemoryCacheOptions>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    lastCleanup: Date.now(),
  };

  constructor(options: MemoryCacheOptions = {}) {
    this.options = {
      maxSize: 100, // 100 MB
      defaultTTL: 60 * 1000, // 1 dakika
      ...options,
    };

    const maxItems = Math.floor(this.options.maxSize * 1024 * 1024 / 1000); // Yaklaşık item sayısı
    this.cache = lru(maxItems);
  }

  private calculateSize(data: unknown): number {
    const str = JSON.stringify(data);
    return new TextEncoder().encode(str).length;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // Önce temizlik yap
    await this.cleanupCache();

    const size = this.calculateSize(data);
    const now = Date.now();
    const expireAt = now + (ttl || this.options.defaultTTL);

    // Yeni girişin boyutu limiti aşıyorsa, eski girişleri temizle
    while (size + this.stats.size > this.options.maxSize * 1024 * 1024) {
      const oldestKey = this.findOldestKey();
      if (!oldestKey)
        break;
      await this.delete(oldestKey);
    }

    const entry: CacheEntry<T> = {
      data,
      expireAt,
      size,
      createdAt: now,
    };

    // Önce eski girişi sil
    const oldEntry = this.cache.get(key) as CacheEntry<unknown> | undefined;
    if (oldEntry) {
      this.stats.size -= oldEntry.size;
    }

    // Yeni girişi ekle
    this.cache.set(key, entry);
    this.stats.size += size;
  }

  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const key of this.cache.keys()) {
      const entry = this.cache.get(key) as CacheEntry<unknown>;
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // TTL kontrolü
    if (Date.now() >= entry.expireAt) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key) as CacheEntry<unknown> | undefined;
    if (entry) {
      this.stats.size -= entry.size;
      this.cache.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now(),
    };
  }

  private async cleanupCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];
    let totalSize = 0;

    // Süresi dolmuş girişleri bul
    for (const key of this.cache.keys()) {
      const entry = this.cache.get(key) as CacheEntry<unknown>;
      if (entry.expireAt <= now) {
        expiredKeys.push(key);
      }
      else {
        totalSize += entry.size;
      }
    }

    // Süresi dolmuş girişleri sil
    for (const key of expiredKeys) {
      await this.delete(key);
    }

    // Boyut hala limiti aşıyorsa, en eski girişleri sil
    while (totalSize > this.options.maxSize * 1024 * 1024) {
      const oldestKey = this.findOldestKey();
      if (!oldestKey)
        break;
      const entry = this.cache.get(oldestKey) as CacheEntry<unknown>;
      await this.delete(oldestKey);
      totalSize -= entry.size;
    }

    this.stats.lastCleanup = now;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }
}
