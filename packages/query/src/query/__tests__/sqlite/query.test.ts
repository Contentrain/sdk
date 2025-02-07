import type { DBRecord } from '../../../types/database';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaseSQLiteLoader } from '../../../loader/base-sqlite';
import { SQLiteQueryBuilder } from '../../sqlite-builder';

interface Reference extends DBRecord {
  logo: string
}

interface Service extends DBRecord {
  reference_id: string
  title?: string
  description?: string
  image?: string
  _relations?: {
    reference?: Reference
  }
}

describe('sQLiteQueryBuilder', () => {
  let loader: BaseSQLiteLoader;
  let builder: SQLiteQueryBuilder<Service>;
  const dbPath = join(__dirname, '../../../../../../playground/node/db/contentrain.db');

  beforeEach(() => {
    loader = new BaseSQLiteLoader(dbPath);
    builder = new SQLiteQueryBuilder<Service>('services', loader);
  });

  afterEach(async () => {
    await loader.close();
  });

  describe('basic queries', () => {
    it('should fetch all services', async () => {
      const result = await builder.get();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('status');
    });

    it('should filter by status', async () => {
      const result = await builder
        .where('status', 'eq', 'publish')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
      });
    });

    it('should handle translations', async () => {
      const result = await builder
        .locale('tr')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('description');
      });
    });
  });

  describe('relations', () => {
    it('should load one-to-one relations', async () => {
      const result = await builder
        .include('reference')
        .where('reference_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        if (item.reference_id) {
          expect(item._relations?.reference).toBeDefined();
          expect(item._relations?.reference).toHaveProperty('id');
          expect(item._relations?.reference).toHaveProperty('logo');
        }
      });
    });
  });

  describe('sorting and pagination', () => {
    it('should sort by created_at', async () => {
      const result = await builder
        .orderBy('created_at', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prev = new Date(result.data[i - 1].created_at);
        const curr = new Date(result.data[i].created_at);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it('should handle pagination', async () => {
      const limit = 2;
      const result = await builder
        .limit(limit)
        .offset(1)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
      expect(result.pagination?.offset).toBe(1);
    });
  });

  describe('advanced filtering', () => {
    it('should handle multiple conditions', async () => {
      const result = await builder
        .where('status', 'eq', 'publish')
        .where('reference_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.reference_id).toBeTruthy();
      });
    });

    it('should handle LIKE queries', async () => {
      const result = await builder
        .locale('en')
        .where('title', 'contains', 'App')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title?.toLowerCase()).toContain('app');
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid table name', async () => {
      const invalidBuilder = new SQLiteQueryBuilder('invalid_table', loader);
      await expect(invalidBuilder.get()).rejects.toThrow();
    });

    it('should handle invalid relation', async () => {
      await expect(
        builder.include('invalid_relation').get(),
      ).rejects.toThrow();
    });
  });
});
