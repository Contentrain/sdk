import type { CacheEntry, CacheStats, MemoryCacheOptions } from '../types/loader';
import { lru } from 'tiny-lru';
import { loggers } from '../utils/logger';

const logger = loggers.cache;

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
    logger.debug('Saving data to cache:', {
      key,
      ttl,
    });

    // Cleanup first
    await this.cleanupCache();

    const size = this.calculateSize(data);
    const now = Date.now();
    const expireAt = now + (ttl || this.options.defaultTTL);

    // Clear old entries if new entry size exceeds limit
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

    // Delete old entry first
    const oldEntry = this.cache.get(key) as CacheEntry<unknown> | undefined;
    if (oldEntry) {
      this.stats.size -= oldEntry.size;
    }

    // Add new entry
    this.cache.set(key, entry);
    this.stats.size += size;

    logger.debug('Data saved to cache:', {
      key,
      expiry: expireAt ? new Date(expireAt).toISOString() : 'no expiry',
    });
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
    logger.debug('Getting data from cache:', { key });
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      logger.debug('Data not found in cache:', { key });
      this.stats.misses++;
      return null;
    }

    // TTL check
    if (Date.now() >= entry.expireAt) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    logger.debug('Data retrieved from cache:', {
      key,
      expiry: entry.expireAt ? new Date(entry.expireAt).toISOString() : 'no expiry',
    });
    this.stats.hits++;
    return entry.data;
  }

  async delete(key: string): Promise<void> {
    logger.debug('Deleting data from cache:', { key });
    const entry = this.cache.get(key) as CacheEntry<unknown> | undefined;
    if (entry) {
      this.stats.size -= entry.size;
      this.cache.delete(key);
    }
    logger.debug('Data deleted from cache:', { key });
  }

  async clear(): Promise<void> {
    logger.debug('Clearing cache');
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now(),
    };
    logger.debug('Cache cleared');
  }

  private async cleanupCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];
    let totalSize = 0;

    // Find expired entries
    for (const key of this.cache.keys()) {
      const entry = this.cache.get(key) as CacheEntry<unknown>;
      if (entry.expireAt <= now) {
        expiredKeys.push(key);
      }
      else {
        totalSize += entry.size;
      }
    }

    // Delete expired entries
    for (const key of expiredKeys) {
      await this.delete(key);
    }

    // Size limit check if it exceeds default oldest entry
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
