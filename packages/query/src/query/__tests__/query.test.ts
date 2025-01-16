import type { BaseContentrainType, ContentrainStatus } from '../../types/model';
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
      contentDir: join(__dirname, '../../../../../playground/contentrain'),
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
        .where('status', 'eq', 'publish' as ContentrainStatus)
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
      // First query
      await builder.get();
      const stats1 = loader.getCacheStats();

      // Second query (should come from cache)
      await builder.get();
      const stats2 = loader.getCacheStats();

      expect(stats2.hits).toBeGreaterThan(stats1.hits);
    });

    it('should respect custom TTL', async () => {
      // Query with short TTL
      await builder.cache(100).get();

      // Wait for TTL
      await new Promise(resolve => setTimeout(resolve, 150));

      // Query again (should be cache miss)
      await builder.get();
      const stats = loader.getCacheStats();
      expect(stats.misses).toBeGreaterThan(0);
    });
  });

  describe('advanced filtering', () => {
    it('should handle multiple AND conditions', async () => {
      const result = await builder
        .where('status', 'eq', 'publish' as ContentrainStatus)
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
      const validStatuses: ContentrainStatus[] = ['publish', 'draft', 'changed'];
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
      // Case-sensitive eşleşme kontrolü
      caseSensitiveResult.data.forEach((item) => {
        expect(item.title).toBe('Contentrain');
      });

      // Büyük/küçük harf duyarsız aramada daha fazla sonuç olmalı
      const caseInsensitiveResult = await builder
        .where('title', 'contains', 'CONTENT')
        .get();

      expect(caseInsensitiveResult.data.length).toBeGreaterThan(0);
    });

    it('should handle multiple conditions on same field', async () => {
      const result = await builder
        .where('order', 'gt', 2)
        .where('order', 'lt', 5)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.order).toBeGreaterThan(2);
        expect(item.order).toBeLessThan(5);
      });
    });
  });

  describe('relation filtering', () => {
    it('should filter by related field value', async () => {
      const result = await builder
        .include('category')
        .where('category', 'eq', 'cab37361e7e6')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item._relations?.category).toBeDefined();
        expect(item._relations?.category.ID).toBe('cab37361e7e6');
      });
    });

    it('should handle multiple relation includes', async () => {
      interface ExtendedWorkItem extends WorkItem {
        category: string
        _relations: {
          category: WorkCategory
        }
      }

      const extendedBuilder = new ContentrainQueryBuilder<ExtendedWorkItem>('workitems', executor, loader);
      const result = await extendedBuilder
        .include('category')
        .where('category', 'eq', 'cab37361e7e6')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item._relations.category).toBeDefined();
        expect(item._relations.category.ID).toBe('cab37361e7e6');
      });
    });

    it('should handle nested relation filtering', async () => {
      interface CategoryWithOrder extends WorkCategory {
        order: number
      }

      const categoryBuilder = new ContentrainQueryBuilder<CategoryWithOrder>('workcategories', executor, loader);
      const result = await categoryBuilder
        .where('order', 'gt', 1)
        .orderBy('order', 'asc')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item, index) => {
        expect(item.order).toBeGreaterThan(1);
        if (index > 0) {
          expect(item.order).toBeGreaterThanOrEqual(result.data[index - 1].order);
        }
      });
    });
  });

  describe('localization and cache behavior', () => {
    it('should handle fallback locale', async () => {
      const result = await builder
        .locale('invalid-locale' as any)
        .get()
        .catch(() => null);

      expect(result).toBeNull();
    });

    it('should maintain cache for different locales separately', async () => {
      // Cache'i temizle
      await loader.clearCache();

      // EN sorgusu
      await builder.locale('en').get();

      // Cache'i temizle
      await loader.clearCache();

      // TR sorgusu - farklı bir sorgu yap
      await builder
        .locale('tr')
        .where('order', 'gt', 1)
        .where('order', 'lt', 5)
        .get();
      const statsAfterTr = loader.getCacheStats();

      expect(statsAfterTr.hits).toBe(0);
      expect(statsAfterTr.misses).toBeGreaterThan(0);
    });

    it('should bypass cache when explicitly requested', async () => {
      // Cache'i temizle
      await loader.clearCache();

      // İlk sorgu - cache'e yaz
      await builder.get();

      // Cache'i temizle
      await loader.clearCache();

      // Cache'i bypass et ve farklı bir sorgu yap
      await builder
        .bypassCache()
        .where('order', 'gt', 1)
        .where('order', 'lt', 5)
        .get();
      const statsAfterBypass = loader.getCacheStats();

      expect(statsAfterBypass.hits).toBe(0);
      expect(statsAfterBypass.misses).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid model gracefully', async () => {
      const invalidBuilder = new ContentrainQueryBuilder('invalid-model', executor, loader);
      await expect(invalidBuilder.get()).rejects.toThrow();
    });

    it('should handle invalid relation field', async () => {
      await expect(
        builder.include('invalidRelation' as any).get(),
      ).rejects.toThrow();
    });

    it('should handle invalid filter operator', async () => {
      // @ts-expect-error: Testing invalid operator
      await expect(builder.where('title', 'invalid', 'test').get())
        .rejects
        .toThrow();
    });

    it('should handle invalid sort field', async () => {
      await expect(
        builder
          .where('status', 'eq', 'publish' as ContentrainStatus)
          .orderBy('nonexistentField' as any, 'asc')
          .get(),
      ).rejects.toThrow('Invalid sort field');
    });
  });

  describe('utility methods', () => {
    it('should get first item correctly', async () => {
      const item = await builder
        .where('status', 'eq', 'publish' as ContentrainStatus)
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
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .count();

      const result = await builder
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .get();

      expect(total).toBe(result.total);
    });

    it('should serialize query to JSON correctly', () => {
      const query = builder
        .where('status', 'eq', 'publish' as ContentrainStatus)
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
