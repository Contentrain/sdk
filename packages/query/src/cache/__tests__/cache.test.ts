import type { ContentrainBaseModel } from '@contentrain/types';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MemoryCache, SSRCache } from '../index';

interface FAQ extends ContentrainBaseModel {
  question: string
  answer: string
  order: number
  categoryId?: string
  category?: any
}

async function loadMockData(modelId: string, locale?: string): Promise<any[]> {
  try {
    const filePath = path.join(process.cwd(), '__mocks__/contentrain', modelId, `${locale || 'en'}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
  catch {
    return [];
  }
}

describe('cache Implementations', () => {
  describe('memoryCache', () => {
    const cache = new MemoryCache();

    it('should store and retrieve data', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData);
      const result = await cache.get<FAQ[]>(key);

      expect(result).toBeDefined();
      expect(result).toHaveLength(mockData.length);
      expect(result?.[0].question).toBe(mockData[0].question);
    });

    it('should handle namespaced keys', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const namespace = 'test';
      const key = 'faqitems:en';

      await cache.set(key, mockData, { namespace });
      const result = await cache.get<FAQ[]>(key, { namespace });

      expect(result).toBeDefined();
      expect(result).toHaveLength(mockData.length);
    });

    it('should handle TTL expiration', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData, { ttl: 1 }); // 1ms TTL
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for TTL to expire
      const result = await cache.get<FAQ[]>(key);

      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData);
      const exists = await cache.has(key);
      expect(exists).toBe(true);

      await cache.delete(key);
      const notExists = await cache.has(key);
      expect(notExists).toBe(false);
    });

    it('should delete specific keys', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData);
      await cache.delete(key);
      const result = await cache.get<FAQ[]>(key);

      expect(result).toBeNull();
    });

    it('should clear all data', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key1 = 'faqitems:en';
      const key2 = 'faqitems:tr';

      await cache.set(key1, mockData);
      await cache.set(key2, mockData);
      await cache.clear();

      const result1 = await cache.get<FAQ[]>(key1);
      const result2 = await cache.get<FAQ[]>(key2);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should clear namespace data', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const namespace = 'test';
      const key1 = 'faqitems:en';
      const key2 = 'faqitems:tr';

      await cache.set(key1, mockData, { namespace });
      await cache.set(key2, mockData, { namespace });
      await cache.clear(namespace);

      const result1 = await cache.get<FAQ[]>(key1, { namespace });
      const result2 = await cache.get<FAQ[]>(key2, { namespace });

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('sSRCache', () => {
    const cache = new SSRCache();

    it('should store and retrieve data', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData);
      const result = await cache.get<FAQ[]>(key);

      expect(result).toBeDefined();
      expect(result).toHaveLength(mockData.length);
      expect(result?.[0].question).toBe(mockData[0].question);
    });

    it('should handle namespaced keys', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const namespace = 'test';
      const key = 'faqitems:en';

      await cache.set(key, mockData, { namespace });
      const result = await cache.get<FAQ[]>(key, { namespace });

      expect(result).toBeDefined();
      expect(result).toHaveLength(mockData.length);
    });

    it('should handle TTL expiration', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData, { ttl: 1 }); // 1ms TTL
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for TTL to expire
      const result = await cache.get<FAQ[]>(key);

      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData);
      const exists = await cache.has(key);
      expect(exists).toBe(true);

      await cache.delete(key);
      const notExists = await cache.has(key);
      expect(notExists).toBe(false);
    });

    it('should delete specific keys', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData);
      await cache.delete(key);
      const result = await cache.get<FAQ[]>(key);

      expect(result).toBeNull();
    });

    it('should clear all data', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key1 = 'faqitems:en';
      const key2 = 'faqitems:tr';

      await cache.set(key1, mockData);
      await cache.set(key2, mockData);
      await cache.clear();

      const result1 = await cache.get<FAQ[]>(key1);
      const result2 = await cache.get<FAQ[]>(key2);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should serialize data for SSR', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';

      await cache.set(key, mockData);
      const state = cache.getState();

      expect(state).toBeDefined();
      expect(state[key]).toBeDefined();
      expect(state[key].value).toHaveLength(mockData.length);
    });

    it('should hydrate from serialized data', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const key = 'faqitems:en';
      const originalCache = new SSRCache();

      await originalCache.set(key, mockData);
      const state = originalCache.getState();

      const newCache = new SSRCache();
      SSRCache.hydrate(state);

      const result = await newCache.get<FAQ[]>(key);
      expect(result).toBeDefined();
      expect(result).toHaveLength(mockData.length);
    });
  });
});
