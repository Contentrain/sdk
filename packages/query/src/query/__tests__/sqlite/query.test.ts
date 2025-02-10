import type { DBRecord } from '../../../types/database';
import type { ContentrainStatus } from '../../../types/model';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaseSQLiteLoader } from '../../../loader/base-sqlite';
import { SQLiteQueryBuilder } from '../../sqlite-builder';

interface Reference extends DBRecord {
  logo: string
  status: ContentrainStatus
}

interface WorkItem extends DBRecord {
  category_id: string
  title?: string
  description?: string
  image?: string
  field_order?: number
  _relations?: {
    category?: Reference
  }
}

describe('sQLiteQueryBuilder', () => {
  let loader: BaseSQLiteLoader;
  let builder: SQLiteQueryBuilder<WorkItem>;
  const dbPath = join(__dirname, '../../../../../../playground/node/src/outputs/db/contentrain.db');

  beforeEach(() => {
    loader = new BaseSQLiteLoader(dbPath);
    builder = new SQLiteQueryBuilder<WorkItem>('workitems', loader);
  });

  afterEach(async () => {
    await loader.close();
  });

  describe('filtering', () => {
    it('should filter by exact match', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
      });
    });

    it('should filter by contains', async () => {
      const result = await builder
        .locale('en')
        .where('description', 'contains', 'app')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.description?.toLowerCase()).toContain('app');
      });
    });

    it('should combine multiple filters', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('category_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.category_id).toBeTruthy();
      });
    });
  });

  describe('sorting', () => {
    it('should sort by field_order ascending', async () => {
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'asc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prevOrder = result.data[i - 1].field_order || 0;
        const currOrder = result.data[i].field_order || 0;
        expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
      }
    });

    it('should sort by field_order descending', async () => {
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prevOrder = result.data[i - 1].field_order || 0;
        const currOrder = result.data[i].field_order || 0;
        expect(currOrder).toBeLessThanOrEqual(prevOrder);
      }
    });

    it('should support multiple sort fields', async () => {
      const result = await builder
        .locale('en')
        .orderBy('status', 'asc')
        .orderBy('field_order', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1];
        const curr = result.data[i];

        if (prev.status === curr.status) {
          const prevOrder = prev.field_order || 0;
          const currOrder = curr.field_order || 0;
          expect(currOrder).toBeLessThanOrEqual(prevOrder);
        }
      }
    });
  });

  describe('pagination', () => {
    it('should limit results', async () => {
      const limit = 2;
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'asc')
        .limit(limit)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
      expect(result.data[0].field_order).toBe(1);
      expect(result.data[1].field_order).toBe(2);
    });

    it('should offset results', async () => {
      const offset = 2;
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'asc')
        .offset(offset)
        .get();

      expect(result.data[0].field_order).toBe(3);
    });

    it('should handle limit and offset together', async () => {
      const limit = 2;
      const offset = 1;
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'asc')
        .limit(limit)
        .offset(offset)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
      expect(result.pagination?.offset).toBe(offset);
      expect(result.data[0].field_order).toBe(2);
      expect(result.data[1].field_order).toBe(3);
    });
  });

  describe('relations', () => {
    it('should load one-to-one relation', async () => {
      const result = await builder
        .locale('en')
        .include('category')
        .where('category_id', 'ne', '')
        .first();

      expect(result).toBeDefined();
      if (result) {
        expect(result._relations?.category).toBeDefined();
        expect(result._relations?.category?.id).toBe(result.category_id);
      }
    });

    it('should handle multiple relations', async () => {
      const result = await builder
        .locale('en')
        .include(['category'])
        .where('category_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        if (item.category_id) {
          expect(item._relations?.category).toBeDefined();
          expect(item._relations?.category?.id).toBe(item.category_id);
        }
      });
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
        .where('category_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        if (item.category_id) {
          expect(item._relations?.category).toBeDefined();
        }
      });
    });
  });

  describe('advanced filtering', () => {
    it('should handle multiple AND conditions', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('category_id', 'ne', '')
        .where('title', 'contains', 'Pazardan')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.category_id).toBeTruthy();
        expect(item.title?.toLowerCase()).toContain('pazardan');
      });
    });

    it('should handle array operations with "in" operator', async () => {
      const validStatuses: ContentrainStatus[] = ['publish', 'draft'];
      const result = await builder
        .locale('en')
        .where('status', 'in', validStatuses)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(validStatuses).toContain(item.status);
      });
    });

    it('should handle string operations correctly', async () => {
      const result = await builder
        .locale('en')
        .where('title', 'startsWith', 'Pazardan')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title).toMatch(/^Pazardan/i);
      });
    });

    it('should handle numeric comparisons correctly', async () => {
      const result = await builder
        .locale('en')
        .where('field_order', 'gte', 1)
        .where('field_order', 'lte', 5)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        const order = item.field_order || 0;
        expect(order).toBeGreaterThanOrEqual(1);
        expect(order).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid table name', async () => {
      const invalidBuilder = new SQLiteQueryBuilder('invalid_table', loader);
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
      ).rejects.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should get first item correctly', async () => {
      const item = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .orderBy('field_order', 'asc')
        .first();

      expect(item).toBeDefined();
      if (item) {
        expect(item.status).toBe('publish');
      }
    });

    it('should return null for first() when no results', async () => {
      const item = await builder
        .locale('en')
        .where('title', 'eq', 'NonExistent')
        .first();

      expect(item).toBeNull();
    });

    it('should count results correctly', async () => {
      const total = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .count();

      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .get();

      expect(total).toBe(result.total);
    });
  });

  describe('relation filtering', () => {
    it('should filter by related field value', async () => {
      const categoryId = (await builder
        .locale('en')
        .where('category_id', 'ne', '')
        .first())?.category_id;

      if (categoryId) {
        const result = await builder
          .locale('en')
          .include('category')
          .where('category_id', 'eq', categoryId)
          .get();

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item._relations?.category).toBeDefined();
          expect(item._relations?.category?.id).toBe(categoryId);
        });
      }
    });

    it('should handle nested relation filtering', async () => {
      const result = await builder
        .locale('en')
        .include('category')
        .where('category_id', 'ne', '')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item._relations?.category).toBeDefined();
        if (item._relations?.category) {
          expect(item._relations.category.status).toBe('publish');
        }
      });
    });
  });
});
