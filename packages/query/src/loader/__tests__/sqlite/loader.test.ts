import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaseSQLiteLoader } from '../../base-sqlite';

interface TestRecord {
  id: string
  status?: string
  locale?: string
  title?: string
  source_model?: string
  target_model?: string
  type?: string
}

describe('sQLiteLoader', () => {
  let loader: BaseSQLiteLoader;
  const dbPath = join(__dirname, '../../../../../../playground/node/src/outputs/db/contentrain.db');

  beforeEach(() => {
    loader = new BaseSQLiteLoader(dbPath);
  });

  afterEach(async () => {
    await loader.close();
  });

  describe('basic operations', () => {
    it('should connect to database', async () => {
      const result = await loader.query<{ test: number }>('SELECT 1 as test');
      expect(result).toEqual([{ test: 1 }]);
    });

    it('should read from services table', async () => {
      const result = await loader.query<TestRecord>('SELECT * FROM tbl_services LIMIT 1');
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('status');
    });
  });

  describe('translations', () => {
    it('should read translations', async () => {
      const result = await loader.query<TestRecord>(
        'SELECT * FROM tbl_services_translations WHERE locale = ? LIMIT 1',
        ['en'],
      );
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('locale');
      expect(result[0]).toHaveProperty('title');
    });

    it('should handle multiple locales', async () => {
      const enResult = await loader.query<TestRecord>(
        'SELECT * FROM tbl_services_translations WHERE locale = ? LIMIT 1',
        ['en'],
      );
      const trResult = await loader.query<TestRecord>(
        'SELECT * FROM tbl_services_translations WHERE locale = ? LIMIT 1',
        ['tr'],
      );

      expect(enResult[0].locale).toBe('en');
      expect(trResult[0].locale).toBe('tr');
    });
  });

  describe('relations', () => {
    it('should read relations', async () => {
      const result = await loader.query<TestRecord>(
        'SELECT * FROM tbl_contentrain_relations LIMIT 1',
      );
      expect(result[0]).toHaveProperty('source_model');
      expect(result[0]).toHaveProperty('target_model');
      expect(result[0]).toHaveProperty('type');
    });

    it('should read one-to-one relations', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT r.*
        FROM tbl_contentrain_relations r
        WHERE r.type = 'one-to-one'
        LIMIT 1
      `);
      expect(result[0].type).toBe('one-to-one');
    });

    it('should read one-to-many relations', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT r.*
        FROM tbl_contentrain_relations r
        WHERE r.type = 'one-to-many'
        LIMIT 1
      `);
      expect(result[0].type).toBe('one-to-many');
    });
  });

  describe('error handling', () => {
    it('should handle SQL errors', async () => {
      await expect(
        loader.query('SELECT * FROM non_existent_table'),
      ).rejects.toThrow();
    });

    it('should handle parameter errors', async () => {
      await expect(
        loader.query('SELECT * FROM tbl_services WHERE id = ?'),
      ).rejects.toThrow();
    });

    it('should handle invalid SQL syntax', async () => {
      await expect(
        loader.query('INVALID SQL QUERY'),
      ).rejects.toThrow();
    });
  });

  describe('transaction handling', () => {
    it('should handle read-only mode', async () => {
      await expect(
        loader.query('INSERT INTO tbl_services (id) VALUES (?)', ['test']),
      ).rejects.toThrow();
    });
  });
});
