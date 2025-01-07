import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryCacheManager } from '../index';

describe('memoryCacheManager', () => {
  let cacheManager: MemoryCacheManager;

  beforeEach(() => {
    cacheManager = new MemoryCacheManager();
  });

  it('should store and retrieve values', async () => {
    const key = 'test-key';
    const value = { data: 'test-value' };

    await cacheManager.set(key, value);
    const retrieved = await cacheManager.get(key);

    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent keys', async () => {
    const key = 'non-existent-key';
    const value = await cacheManager.get(key);

    expect(value).toBeNull();
  });

  it('should handle expiration of cached values', async () => {
    const key = 'expiring-key';
    const value = { data: 'expiring-value' };
    const ttl = 100; // 100ms

    await cacheManager.set(key, value, { ttl });

    // Value should exist immediately
    expect(await cacheManager.get(key)).toEqual(value);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, ttl + 50));

    // Value should be expired
    expect(await cacheManager.get(key)).toBeNull();
  });

  it('should clear all cached values', async () => {
    const keys = ['key1', 'key2', 'key3'];
    const value = { data: 'test' };

    await Promise.all(keys.map(async key => cacheManager.set(key, value)));
    await Promise.all(keys.map(async (key) => {
      expect(await cacheManager.get(key)).toEqual(value);
    }));

    await cacheManager.clear();

    await Promise.all(keys.map(async (key) => {
      expect(await cacheManager.get(key)).toBeNull();
    }));
  });

  it('should delete specific cached value', async () => {
    const key = 'delete-test';
    const value = { data: 'to-be-deleted' };

    await cacheManager.set(key, value);
    expect(await cacheManager.get(key)).toEqual(value);

    await cacheManager.delete(key);
    expect(await cacheManager.get(key)).toBeNull();
  });

  it('should check if key exists', async () => {
    const key = 'exists-test';
    const value = { data: 'test-value' };

    expect(await cacheManager.has(key)).toBe(false);
    await cacheManager.set(key, value);
    expect(await cacheManager.has(key)).toBe(true);
  });
});
