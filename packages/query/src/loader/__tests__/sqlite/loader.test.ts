import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaseSQLiteLoader } from '../../base-sqlite';

interface TestRecord {
  id: string
  status?: string
  locale?: string
  title?: string
  description?: string
  field_order?: number
  category_id?: string
  reference_id?: string
  icon?: string
  link?: string
  source_model?: string
  target_model?: string
  type?: string
  created_at?: string
  updated_at?: string
  _relations?: {
    category?: TestRecord
    reference?: TestRecord
  }
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

  describe('temel veritabanı işlemleri', () => {
    it('veritabanına bağlanabilmeli', async () => {
      const result = await loader.query<{ test: number }>('SELECT 1 as test');
      expect(result).toEqual([{ test: 1 }]);
    });

    it('birden fazla sorgu çalıştırabilmeli', async () => {
      const result1 = await loader.query<{ test: number }>('SELECT 1 as test');
      const result2 = await loader.query<{ test: number }>('SELECT 2 as test');
      expect(result1[0].test).toBe(1);
      expect(result2[0].test).toBe(2);
    });

    it('parametreli sorgu çalıştırabilmeli', async () => {
      const value = 42;
      const result = await loader.query<{ test: number }>(
        'SELECT ? as test',
        [value],
      );
      expect(result[0].test).toBe(value);
    });
  });

  describe('içerik tabloları', () => {
    it('services tablosundan veri okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>('SELECT * FROM tbl_services LIMIT 1');
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('reference_id');
      expect(result[0]).toHaveProperty('created_at');
      expect(result[0]).toHaveProperty('updated_at');
    });

    it('workitems tablosundan veri okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>('SELECT * FROM tbl_workitems LIMIT 1');
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('category_id');
      expect(result[0]).toHaveProperty('status');
    });

    it('sociallinks tablosundan veri okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>('SELECT * FROM tbl_sociallinks LIMIT 1');
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('icon');
      expect(result[0]).toHaveProperty('link');
      expect(result[0]).toHaveProperty('service_id');
    });

    it('sıralama ile çeviri verilerini getirebilmeli', async () => {
      const result = await loader.query<TestRecord>(
        'SELECT * FROM tbl_workitems_translations ORDER BY field_order ASC LIMIT 2',
      );
      expect(result).toHaveLength(2);
      expect(result[0].field_order).toBeLessThanOrEqual(result[1].field_order || 0);
    });

    it('filtreleme ile veri getirebilmeli', async () => {
      const result = await loader.query<TestRecord>(
        'SELECT * FROM tbl_services WHERE status = ?',
        ['publish'],
      );
      result.forEach((item) => {
        expect(item.status).toBe('publish');
      });
    });
  });

  describe('çeviri tabloları', () => {
    it('services çevirilerini okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>(
        'SELECT * FROM tbl_services_translations WHERE locale = ? AND id = ? LIMIT 1',
        ['en', '50d81f2a3baf'],
      );
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('locale', 'en');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
    });

    it('workitems çevirilerini okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>(
        'SELECT * FROM tbl_workitems_translations WHERE locale = ? AND id = ? LIMIT 1',
        ['tr', '1a01328952b4'],
      );
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('locale', 'tr');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('field_order');
    });

    it('aynı ID için farklı dillerdeki içerikleri karşılaştırabilmeli', async () => {
      const testId = '50d81f2a3baf'; // Web App Development servisi
      const enResult = await loader.query<TestRecord>(
        'SELECT * FROM tbl_services_translations WHERE locale = ? AND id = ? LIMIT 1',
        ['en', testId],
      );
      const trResult = await loader.query<TestRecord>(
        'SELECT * FROM tbl_services_translations WHERE locale = ? AND id = ? LIMIT 1',
        ['tr', testId],
      );

      expect(enResult[0].locale).toBe('en');
      expect(trResult[0].locale).toBe('tr');
      expect(enResult[0].title).not.toBe(trResult[0].title);
    });

    it('çeviri olmayan içeriği kontrol edebilmeli', async () => {
      const result = await loader.query<TestRecord>(
        'SELECT * FROM tbl_sociallinks LIMIT 1',
      );
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).not.toHaveProperty('locale');
    });
  });

  describe('ilişki tabloları', () => {
    it('ilişkileri okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>(
        'SELECT * FROM tbl_contentrain_relations LIMIT 1',
      );
      expect(result[0]).toHaveProperty('source_model');
      expect(result[0]).toHaveProperty('target_model');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('field_id');
    });

    it('bire-bir ilişkileri okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT r.*
        FROM tbl_contentrain_relations r
        WHERE r.type = 'one-to-one'
        AND r.source_model = 'services'
        AND r.field_id = 'reference'
        LIMIT 1
      `);
      expect(result[0].type).toBe('one-to-one');
      expect(result[0].source_model).toBe('services');
    });

    it('bire-çok ilişkileri okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT r.*
        FROM tbl_contentrain_relations r
        WHERE r.type = 'one-to-many'
        AND r.source_model = 'tabitems'
        AND r.field_id = 'category'
        LIMIT 1
      `);
      expect(result[0].type).toBe('one-to-many');
      expect(result[0].source_model).toBe('tabitems');
    });

    it('ilişkili içerikleri birleştirerek okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT s.*, r.*, ref.logo
        FROM tbl_services s
        JOIN tbl_contentrain_relations r ON s.id = r.source_id
        JOIN tbl_references ref ON s.reference_id = ref.id
        WHERE r.field_id = 'reference'
        AND r.type = 'one-to-one'
        LIMIT 1
      `);
      expect(result[0]).toHaveProperty('reference_id');
      expect(result[0]).toHaveProperty('logo');
      expect(result[0]).toHaveProperty('field_id', 'reference');
    });

    it('çeviri ve ilişkileri birlikte okuyabilmeli', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT s.*, t.*, ref.logo
        FROM tbl_services s
        JOIN tbl_services_translations t ON s.id = t.id
        JOIN tbl_contentrain_relations r ON s.id = r.source_id
        JOIN tbl_references ref ON s.reference_id = ref.id
        WHERE t.locale = ?
        AND r.field_id = 'reference'
        AND r.type = 'one-to-one'
        LIMIT 1
      `, ['en']);

      expect(result[0]).toHaveProperty('reference_id');
      expect(result[0]).toHaveProperty('locale', 'en');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('logo');
    });
  });

  describe('hata yönetimi', () => {
    it('olmayan tablo hatası yönetebilmeli', async () => {
      await expect(
        loader.query('SELECT * FROM non_existent_table'),
      ).rejects.toThrow();
    });

    it('eksik parametre hatası yönetebilmeli', async () => {
      await expect(
        loader.query('SELECT * FROM tbl_services WHERE id = ?'),
      ).rejects.toThrow();
    });

    it('geçersiz SQL sözdizimi hatası yönetebilmeli', async () => {
      await expect(
        loader.query('INVALID SQL QUERY'),
      ).rejects.toThrow();
    });

    it('bağlantı kapatıldıktan sonra sorgu hatası yönetebilmeli', async () => {
      await loader.close();
      await expect(
        loader.query('SELECT 1'),
      ).rejects.toThrow();
    });
  });

  describe('performans testleri', () => {
    it('çoklu sorgu performansını test edebilmeli', async () => {
      const start = Date.now();
      const promises = Array.from({ length: 10 }).map(async () =>
        loader.query('SELECT * FROM tbl_services LIMIT 1'),
      );
      await Promise.all(promises);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // 1 saniyeden az sürmeli
    });

    it('büyük veri kümesini işleyebilmeli', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT s.*, t.*, r.*, ref.logo
        FROM tbl_services s
        JOIN tbl_services_translations t ON s.id = t.id
        JOIN tbl_contentrain_relations r ON s.id = r.source_id
        JOIN tbl_references ref ON s.reference_id = ref.id
        WHERE r.type = 'one-to-one'
      `);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('karmaşık sorguları işleyebilmeli', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT DISTINCT s.*, t.*, ref.logo
        FROM tbl_services s
        JOIN tbl_services_translations t ON s.id = t.id
        JOIN tbl_contentrain_relations r ON s.id = r.source_id
        JOIN tbl_references ref ON s.reference_id = ref.id
        WHERE t.locale = ?
        AND s.status = ?
        AND r.type = 'one-to-one'
        ORDER BY t.title ASC
        LIMIT 5
      `, ['en', 'publish']);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      result.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('logo');
      });
    });
  });

  describe('veri bütünlüğü testleri', () => {
    it('iD alanlarının benzersiz olduğunu kontrol edebilmeli', async () => {
      const result = await loader.query<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM (
          SELECT id, COUNT(*) as duplicates
          FROM tbl_services
          GROUP BY id
          HAVING duplicates > 1
        )
      `);
      expect(result[0].count).toBe(0);
    });

    it('zorunlu alanların dolu olduğunu kontrol edebilmeli', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT *
        FROM tbl_services
        WHERE id IS NULL OR status IS NULL
        LIMIT 1
      `);
      expect(result.length).toBe(0);
    });

    it('ilişki bütünlüğünü kontrol edebilmeli', async () => {
      const result = await loader.query<TestRecord>(`
        SELECT s.*
        FROM tbl_services s
        LEFT JOIN tbl_contentrain_relations r ON s.reference_id = r.source_id
        WHERE s.reference_id IS NOT NULL
        AND r.source_id IS NULL
        AND r.field_id = 'reference'
        LIMIT 1
      `);
      expect(result.length).toBe(0);
    });
  });
});
