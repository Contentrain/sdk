import type { IBaseCacheStats, ICacheEntry, IMemoryCacheOptions } from './types';
import { lru } from 'tiny-lru';

export class MemoryCache {
    private cache;
    private options: Required<IMemoryCacheOptions>;
    private stats: IBaseCacheStats = {
        hits: 0,
        misses: 0,
        size: 0,
        lastCleanup: Date.now(),
    };

    constructor(options: IMemoryCacheOptions = {}) {
        this.options = {
            maxSize: 100, // 100 MB
            defaultTTL: 60 * 1000, // 1 dakika
            ...options,
        };

        // maxSize en az 1 MB olmalı ve maxItems en az 1 olmalı
        const maxItems = Math.max(1, Math.floor((Math.max(1, this.options.maxSize) * 1024 * 1024) / 1000));
        this.cache = lru(maxItems);
    }

    private calculateSize(data: unknown): number {
        const str = JSON.stringify(data);
        return new TextEncoder().encode(str).length;
    }

    async set<T>(key: string, data: T, ttl?: number): Promise<void> {
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

        const entry: ICacheEntry<T> = {
            data,
            expireAt,
            size,
            createdAt: now,
        };

        // Delete old entry first
        const oldEntry = this.cache.get(key) as ICacheEntry<unknown> | undefined;
        if (oldEntry) {
            this.stats.size -= oldEntry.size;
        }

        // Add new entry
        this.cache.set(key, entry);
        this.stats.size += size;
    }

    private findOldestKey(): string | null {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const key of this.cache.keys()) {
            const entry = this.cache.get(key) as ICacheEntry<unknown>;
            if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
            }
        }

        return oldestKey;
    }

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key) as ICacheEntry<T> | undefined;

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // TTL check
        if (Date.now() >= entry.expireAt) {
            await this.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.data;
    }

    async delete(key: string): Promise<void> {
        const entry = this.cache.get(key) as ICacheEntry<unknown> | undefined;
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
        // Find expired entries
        for (const key of this.cache.keys()) {
            const entry = this.cache.get(key) as ICacheEntry<unknown>;
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
            const entry = this.cache.get(oldestKey) as ICacheEntry<unknown>;
            await this.delete(oldestKey);
            totalSize -= entry.size;
        }

        this.stats.lastCleanup = now;
    }

    getStats(): IBaseCacheStats {
        return { ...this.stats };
    }
}
