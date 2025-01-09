import type { CacheEntry, CacheOptions } from '../types/query';
import { CacheError } from '../core/errors';

export abstract class BaseCache {
  protected prefix: string = 'contentrain_query_';
  protected version: string = '1.0.0';

  constructor(options: CacheOptions = {}) {
    if (options.version) {
      this.version = options.version;
    }
  }

  protected getCacheKey(key: string): string {
    return `${this.prefix}${this.version}_${key}`;
  }

  protected validateEntry<T>(entry: CacheEntry<T>): boolean {
    if (!entry || !entry.data || !entry.timestamp || !entry.expiresAt) {
      return false;
    }

    if (entry.version && entry.version !== this.version) {
      return false;
    }

    return Date.now() <= entry.expiresAt;
  }

  protected createEntry<T>(data: T, ttl: number): CacheEntry<T> {
    const timestamp = Date.now();
    return {
      data,
      timestamp,
      expiresAt: timestamp + ttl,
      version: this.version,
    };
  }

  abstract set<T>(key: string, data: T, ttl: number): void;
  abstract get<T>(key: string): T | null;
  abstract has(key: string): boolean;
  abstract delete(key: string): void;
  abstract clear(): void;
}

export class MemoryCache extends BaseCache {
  private static instance: MemoryCache;
  private cache: Map<string, CacheEntry<any>>;

  private constructor(options: CacheOptions = {}) {
    super(options);
    this.cache = new Map();
  }

  static getInstance(options: CacheOptions = {}): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache(options);
    }
    return MemoryCache.instance;
  }

  set<T>(key: string, data: T, ttl: number): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry = this.createEntry(data, ttl);
      this.cache.set(cacheKey, entry);
    }
    catch (error) {
      throw new CacheError('set', error instanceof Error ? error : undefined);
    }
  }

  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry = this.cache.get(cacheKey) as CacheEntry<T>;

      if (!entry || !this.validateEntry(entry)) {
        this.delete(key);
        return null;
      }

      return entry.data;
    }
    catch (error) {
      throw new CacheError('get', error instanceof Error ? error : undefined);
    }
  }

  has(key: string): boolean {
    const cacheKey = this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);
    return entry !== undefined && this.validateEntry(entry);
  }

  delete(key: string): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.delete(cacheKey);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class StorageCache extends BaseCache {
  constructor(options: CacheOptions = {}) {
    super(options);
  }

  set<T>(key: string, data: T, ttl: number): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry = this.createEntry(data, ttl);
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    }
    catch (error) {
      throw new CacheError('set', error instanceof Error ? error : undefined);
    }
  }

  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const item = localStorage.getItem(cacheKey);

      if (!item) {
        return null;
      }

      const entry = JSON.parse(item) as CacheEntry<T>;

      if (!this.validateEntry(entry)) {
        this.delete(key);
        return null;
      }

      return entry.data;
    }
    catch (error) {
      throw new CacheError('get', error instanceof Error ? error : undefined);
    }
  }

  has(key: string): boolean {
    const cacheKey = this.getCacheKey(key);
    const item = localStorage.getItem(cacheKey);

    if (!item) {
      return false;
    }

    try {
      const entry = JSON.parse(item);
      return this.validateEntry(entry);
    }
    catch {
      return false;
    }
  }

  delete(key: string): void {
    const cacheKey = this.getCacheKey(key);
    localStorage.removeItem(cacheKey);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}
