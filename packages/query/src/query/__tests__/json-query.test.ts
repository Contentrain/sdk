import type { IBaseJSONRecord } from '../../loader/types/json';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JSONLoader } from '../../loader/json/json.loader';
import { JSONQueryBuilder } from '../json/json-builder';

interface TestJSONRecord extends IBaseJSONRecord {
  title?: string
  description?: string
  order?: number
  category?: string | string[]
  reference?: string
  icon?: string
  link?: string
  source_model?: string
  target_model?: string
  type?: string
  work?: string
  testimonial?: string
  _relations?: {
    category?: TestJSONRecord | TestJSONRecord[]
    reference?: TestJSONRecord
    work?: TestJSONRecord
    testimonial?: TestJSONRecord
  }
}

describe('jSONQueryBuilder', () => {
  let loader: JSONLoader<TestJSONRecord>;
  let builder: JSONQueryBuilder<TestJSONRecord>;
  const contentDir = join(__dirname, '../../../../../playground/contentrain');

  beforeEach(() => {
    loader = new JSONLoader({
      contentDir,
      cache: true,
      maxCacheSize: 100,
      defaultLocale: 'en',
    });

    builder = new JSONQueryBuilder<TestJSONRecord>('workitems', loader);
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
        expect(item.description?.toLowerCase()).toContain('platform');
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
        const prevOrder = result.data[i - 1].order || 0;
        const currOrder = result.data[i].order || 0;
        expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
      }
    });

    it('should sort by order descending', async () => {
      const result = await builder
        .orderBy('order', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prevOrder = result.data[i - 1].order || 0;
        const currOrder = result.data[i].order || 0;
        expect(currOrder).toBeLessThanOrEqual(prevOrder);
      }
    });

    it('should support multiple sort fields', async () => {
      const result = await builder
        .orderBy('status', 'asc')
        .orderBy('order', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1];
        const curr = result.data[i];

        if (prev.status === curr.status) {
          const prevOrder = prev.order || 0;
          const currOrder = curr.order || 0;
          expect(currOrder).toBeLessThanOrEqual(prevOrder);
        }
      }
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
      const builder = new JSONQueryBuilder('workitems', loader);
      const result = await builder
        .where('ID', 'eq', '8a8044e883e8')
        .include('category')
        .get();

      expect(result.data[0]._relations?.category).toBeDefined();
      expect((result.data[0]._relations?.category as TestJSONRecord).ID).toBe('bcc834108adc');
      expect((result.data[0]._relations?.category as TestJSONRecord).category).toBe('Product Development');
    });

    it('should handle multiple relations', async () => {
      const builder = new JSONQueryBuilder('project-details', loader);
      const result = await builder
        .where('ID', 'eq', 'pd001')
        .include(['work', 'testimonial'])
        .get();

      expect(result.data[0]._relations?.work).toBeDefined();
      expect((result.data[0]._relations?.work as TestJSONRecord).ID).toBe('8a8044e883e8');
      expect((result.data[0]._relations?.testimonial as TestJSONRecord).ID).toBe('89ae53eb8370');
    });
  });

  describe('localization', () => {
    it('should load content in specified locale', async () => {
      const result = await builder
        .locale('tr')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title).toBeDefined();
        expect(item.description).toBeDefined();
      });
    });

    it('should load relations in specified locale', async () => {
      const result = await builder
        .locale('tr')
        .include('category')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        if (item.category) {
          expect(item._relations?.category).toBeDefined();
        }
      });
    });
  });

  describe('cache', () => {
    it('should use cache by default', async () => {
      // First query
      await builder.get();
      const stats1 = loader.getCacheStats();

      // Second query (should come from cache)
      await builder.get();
      const stats2 = loader.getCacheStats();

      expect(stats2.cache?.hits).toBeGreaterThan(stats1.cache?.hits || 0);
    });

    it('should respect custom TTL', async () => {
      // Query with short TTL
      await builder.cache(100).get();

      // Wait for TTL
      await new Promise(resolve => setTimeout(resolve, 150));

      // Query again (should be cache miss)
      await builder.get();
      const stats = loader.getCacheStats();
      expect(stats.cache?.misses).toBeGreaterThan(0);
    });
  });

  describe('advanced Filtering', () => {
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
      const validStatuses = ['publish', 'draft', 'changed'];
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

    it('should handle empty result sets gracefully', async () => {
      const result = await builder
        .where('title', 'eq', 'NonExistentTitle')
        .get();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle case-sensitive string operations', async () => {
      const result = await builder
        .where('title', 'contains', 'content')
        .get();

      const caseSensitiveResult = await builder
        .where('title', 'eq', 'Contentrain')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      expect(caseSensitiveResult.data.length).toBe(1);
      caseSensitiveResult.data.forEach((item) => {
        expect(item.title).toBe('Contentrain');
      });

      const caseInsensitiveResult = await builder
        .where('title', 'contains', 'CONTENT')
        .get();

      expect(caseInsensitiveResult.data.length).toBeGreaterThan(0);
    });
  });

  describe('error Handling', () => {
    it('should handle invalid model gracefully', async () => {
      const invalidBuilder = new JSONQueryBuilder('invalid-model', loader);
      await expect(invalidBuilder.get()).rejects.toThrow();
    });

    it('should handle invalid relation field', async () => {
      await expect(
        builder.include('invalidRelation' as any).get(),
      ).rejects.toThrow();
    });

    it('should handle invalid sort field', async () => {
      await expect(
        builder
          .where('status', 'eq', 'publish')
          .orderBy('nonexistentField' as any, 'asc')
          .get(),
      ).rejects.toThrow();
    });
  });

  describe('utility Methods', () => {
    it('should get first item correctly', async () => {
      const item = await builder
        .where('status', 'eq', 'publish')
        .orderBy('order', 'asc')
        .first();

      expect(item).toBeDefined();
      if (item) {
        expect(item.status).toBe('publish');
      }
    });

    it('should return null for first() when no results', async () => {
      const item = await builder
        .where('title', 'eq', 'NonExistent')
        .first();

      expect(item).toBeNull();
    });

    it('should count results correctly', async () => {
      const total = await builder
        .where('status', 'eq', 'publish')
        .count();

      const result = await builder
        .where('status', 'eq', 'publish')
        .get();

      expect(total).toBe(result.total);
    });

    it('should serialize query to JSON correctly', () => {
      const query = builder
        .where('status', 'eq', 'publish')
        .include('category')
        .orderBy('order', 'desc')
        .limit(5)
        .offset(2)
        .locale('en')
        .cache(1000);

      const json = query.toJSON();

      expect(json).toMatchObject({
        model: 'workitems',
        filters: [{ field: 'status', operator: 'eq', value: 'publish' }],
        includes: { category: {} },
        sorting: [{ field: 'order', direction: 'desc' }],
        pagination: { limit: 5, offset: 2 },
        options: { locale: 'en', cache: true, ttl: 1000 },
      });
    });
  });
});
