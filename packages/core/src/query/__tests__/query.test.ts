import type { BaseContentrainType } from '../../types/model';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentLoader } from '../../loader/content';
import { ContentrainQueryBuilder } from '../builder';
import { QueryExecutor } from '../executor';

interface WorkCategory extends BaseContentrainType {
  category: string
  order: number
}

interface WorkItem extends BaseContentrainType {
  title: string
  description: string
  category: string
  _relations: {
    category: WorkCategory
  }
  image: string
  link: string
  order: number
}

describe('query', () => {
  let loader: ContentLoader;
  let executor: QueryExecutor;
  let builder: ContentrainQueryBuilder<WorkItem>;

  beforeEach(() => {
    loader = new ContentLoader({
      contentDir: join(__dirname, '../../../../../__mocks__/contentrain'),
      defaultLocale: 'en',
      cache: true,
      ttl: 60 * 1000,
      maxCacheSize: 100,
    });

    executor = new QueryExecutor(loader);
    builder = new ContentrainQueryBuilder<WorkItem>('workitems', executor, loader);
  });

  afterEach(async () => {
    await loader.clearCache();
  });

  describe('filtering', () => {
    it('should filter by exact match', async () => {
      const result = await builder
        .where('title', 'eq', 'Contentrain')
        .get();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Contentrain');
    });

    it('should filter by contains', async () => {
      const result = await builder
        .where('description', 'contains', 'platform')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.description.toLowerCase()).toContain('platform');
      });
    });

    it('should combine multiple filters', async () => {
      const result = await builder
        .where('status', 'eq', 'publish')
        .where('order', 'lt', 3)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.order).toBeLessThan(3);
      });
    });
  });

  describe('sorting', () => {
    it('should sort by order ascending', async () => {
      const result = await builder
        .orderBy('order', 'asc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].order).toBeGreaterThanOrEqual(result.data[i - 1].order);
      }
    });

    it('should sort by order descending', async () => {
      const result = await builder
        .orderBy('order', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].order).toBeLessThanOrEqual(result.data[i - 1].order);
      }
    });

    it('should support multiple sort fields', async () => {
      const result = await builder
        .orderBy('status', 'asc')
        .orderBy('order', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
    });
  });

  describe('pagination', () => {
    it('should limit results', async () => {
      const limit = 2;
      const result = await builder
        .limit(limit)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
    });

    it('should offset results', async () => {
      const offset = 1;
      const allResults = await builder.get();
      const offsetResults = await builder
        .offset(offset)
        .get();

      expect(offsetResults.data[0]).toEqual(allResults.data[offset]);
    });

    it('should handle limit and offset together', async () => {
      const limit = 2;
      const offset = 1;
      const result = await builder
        .limit(limit)
        .offset(offset)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
      expect(result.pagination?.offset).toBe(offset);
    });
  });

  describe('relations', () => {
    it('should load one-to-one relation', async () => {
      const result = await builder
        .include('category')
        .where('title', 'eq', 'Contentrain')
        .get();

      expect(result.data.length).toBe(1);
      expect(result.data[0]._relations?.category).toBeDefined();
      expect(result.data[0]._relations?.category.ID).toBe('bcc834108adc');
      expect(result.data[0]._relations?.category.category).toBe('Product Development');
    });

    it('should handle multiple relations', async () => {
      const result = await builder
        .include(['category'])
        .where('title', 'eq', 'Contentrain')
        .get();

      expect(result.data.length).toBe(1);
      expect(result.data[0]._relations?.category).toBeDefined();
      expect(result.data[0]._relations?.category.ID).toBe('bcc834108adc');
      expect(result.data[0]._relations?.category.category).toBe('Product Development');
    });
  });

  describe('localization', () => {
    it('should load content in specified locale', async () => {
      const result = await builder
        .locale('tr')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should load relations in specified locale', async () => {
      const result = await builder
        .locale('tr')
        .include('category')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.category).toBeDefined();
      });
    });
  });

  describe('cache', () => {
    it('should use cache by default', async () => {
      // İlk sorgu
      await builder.get();
      const stats1 = loader.getCacheStats();

      // İkinci sorgu (cache'den gelmeli)
      await builder.get();
      const stats2 = loader.getCacheStats();

      expect(stats2.hits).toBeGreaterThan(stats1.hits);
    });

    it('should respect custom TTL', async () => {
      // Kısa TTL ile sorgu
      await builder.cache(100).get();

      // TTL süresini bekle
      await new Promise(resolve => setTimeout(resolve, 150));

      // Tekrar sorgu (cache miss olmalı)
      await builder.get();
      const stats = loader.getCacheStats();
      expect(stats.misses).toBeGreaterThan(0);
    });
  });

  describe('advanced filtering', () => {
    it('should handle multiple AND conditions', async () => {
      const result = await builder
        .where('status', 'eq', 'publish')
        .where('order', 'lt', 3)
        .where('title', 'contains', 'Content')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.order).toBeLessThan(3);
        expect(item.title).toContain('Content');
      });
    });

    it('should handle array operations with "in" operator', async () => {
      const validStatuses = ['publish', 'draft'];
      const result = await builder
        .where('status', 'in', validStatuses)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(validStatuses).toContain(item.status);
      });
    });

    it('should handle string operations correctly', async () => {
      const result = await builder
        .where('title', 'startsWith', 'Content')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title).toMatch(/^Content/);
      });
    });

    it('should handle numeric comparisons correctly', async () => {
      const result = await builder
        .where('order', 'gte', 1)
        .where('order', 'lte', 5)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.order).toBeGreaterThanOrEqual(1);
        expect(item.order).toBeLessThanOrEqual(5);
      });
    });

    it('should throw error for invalid operator', async () => {
      // @ts-expect-error: Testing invalid operator
      await expect(builder.where('title', 'invalid', 'test').get())
        .rejects
        .toThrow();
    });

    it('should handle empty result sets gracefully', async () => {
      const result = await builder
        .where('title', 'eq', 'NonExistentTitle')
        .get();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
