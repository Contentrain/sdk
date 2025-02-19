import type { IDBRecord } from '../types/sqlite';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseError, RelationError } from '../../errors';
import { SQLiteLoader } from '../sqlite/sqlite.loader';

interface TestRecord extends IDBRecord {
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
  _relations?: {
    category?: TestRecord
    reference?: TestRecord
  }
}

describe('sQLiteLoader', () => {
  let loader: SQLiteLoader<TestRecord>;
  const dbPath = join(__dirname, '../../../../../playground/contentrain-db/contentrain.db');

  beforeEach(() => {
    loader = new SQLiteLoader({
      databasePath: dbPath,
      cache: true,
      maxCacheSize: 100,
    });
  });

  afterEach(async () => {
    await loader.clearCache();
  });

  describe('temel Veritabanı İşlemleri', () => {
    it('veritabanından içerik yükleyebilmeli', async () => {
      const result = await loader.load('services');
      expect(result.model.metadata.modelId).toBe('services');
      expect(Array.isArray(result.content.default)).toBe(true);
    });

    it('içerik cache\'lenebilmeli', async () => {
      // İlk yükleme
      await loader.load('services');
      const stats1 = await loader.getCacheStats();

      // İkinci yükleme (cache'den gelmeli)
      await loader.load('services');
      const stats2 = await loader.getCacheStats();

      expect(stats2.cache?.hits).toBeGreaterThan(stats1.cache?.hits || 0);
    });

    it('çevirileri yükleyebilmeli', async () => {
      const result = await loader.load('services');
      expect(result.content.translations).toBeDefined();
      if (result.content.translations) {
        expect(result.content.translations.en).toBeDefined();
        expect(result.content.translations.tr).toBeDefined();
      }
    });

    it('filtreleme ile veri getirebilmeli', async () => {
      const result = await loader.load('services');
      const publishedItems = result.content.default.filter(item => item.status === 'publish');
      expect(publishedItems.length).toBeGreaterThan(0);
      publishedItems.forEach((item) => {
        expect(item.status).toBe('publish');
      });
    });
  });

  describe('i̇lişki İşlemleri', () => {
    it('bire-bir ilişkileri çözebilmeli', async () => {
      const result = await loader.load('services');
      const firstItem = result.content.default[0];

      const relations = await loader.resolveRelations<TestRecord>(
        'services',
        'reference',
        [firstItem],
      );

      expect(relations).toBeDefined();
      expect(Array.isArray(relations)).toBe(true);
      expect(relations[0]).toHaveProperty('id');
      expect(relations[0]).toHaveProperty('logo');
      expect(firstItem.reference_id).toBe(relations[0].id);
    });

    it('bire-çok ilişkileri çözebilmeli', async () => {
      const result = await loader.load('tabitems');
      const firstItem = result.content.default[0];

      const relations = await loader.resolveRelations<TestRecord>(
        'tabitems',
        'category',
        [firstItem],
      );

      expect(relations).toBeDefined();
      expect(Array.isArray(relations)).toBe(true);
      expect(relations.length).toBeGreaterThan(0);
      expect(relations[0]).toHaveProperty('id');
    });

    it('çevirili ilişkileri çözebilmeli', async () => {
      const result = await loader.load('services');
      const firstItem = result.content.default[0];

      const relations = await loader.resolveRelations<TestRecord>(
        'services',
        'reference',
        [firstItem],
      );

      // İlişkili içeriğin (references) kendisini kontrol et
      expect(relations[0]).toHaveProperty('id');
      expect(relations[0]).toHaveProperty('logo');
      expect(relations[0]).toHaveProperty('status');

      // İlişkinin doğruluğunu kontrol et
      expect(firstItem.reference_id).toBe(relations[0].id);

      // Ana tablonun çevirilerini kontrol et
      if (result.content.translations) {
        const sourceTranslation = result.content.translations.en.find(
          item => item.id === firstItem.id,
        );
        expect(sourceTranslation).toBeDefined();
      }
    });

    it('aynı ID için farklı dillerdeki ilişkileri karşılaştırabilmeli', async () => {
      const result = await loader.load('services');
      const testId = result.content.default[0].id;

      if (result.content.translations) {
        const enItem = result.content.translations.en.find(item => item.id === testId);
        const trItem = result.content.translations.tr.find(item => item.id === testId);

        expect(enItem).toBeDefined();
        expect(trItem).toBeDefined();
        expect(enItem?.title).not.toBe(trItem?.title);
      }
    });

    it('ilişkili içerikleri birleştirerek okuyabilmeli', async () => {
      const result = await loader.load('services');
      const firstItem = result.content.default[0];

      const relations = await loader.resolveRelations<TestRecord>(
        'services',
        'reference',
        [firstItem],
      );

      expect(relations[0]).toHaveProperty('id');
      expect(firstItem.reference_id).toBe(relations[0].id);
    });
  });

  describe('cache Yönetimi', () => {
    it('cache temizlenebilmeli', async () => {
      await loader.load('services');
      const stats1 = await loader.getCacheStats();

      await loader.clearCache();
      const stats2 = await loader.getCacheStats();

      expect(stats2.cache?.size || 0).toBe(0);
      expect(stats2.cache?.size || 0).toBeLessThan(stats1.cache?.size || 0);
    });

    it('belirli bir model için cache yenilenebilmeli', async () => {
      await loader.load('services');
      const stats1 = await loader.getCacheStats();

      await loader.refreshCache('services');
      const stats2 = await loader.getCacheStats();

      expect(stats2.cache?.hits || 0).toBeLessThan((stats1.cache?.hits || 0) + 1);
    });

    it('tTL ayarına göre cache temizlenebilmeli', async () => {
      const shortTTLLoader = new SQLiteLoader({
        databasePath: dbPath,
        cache: true,
        maxCacheSize: 100,
        modelTTL: { services: 100 }, // 100ms TTL
      });

      await shortTTLLoader.load('services');
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = shortTTLLoader.load('services');
      const stats = await shortTTLLoader.getCacheStats();

      expect(stats.cache?.misses || 0).toBeGreaterThan(0);
      expect(result).toBeDefined();
    });
  });

  describe('hata Yönetimi', () => {
    it('olmayan model hatası yönetebilmeli', async () => {
      await expect(loader.load('non-existent')).rejects.toThrow();
    });

    it('geçersiz ilişki hatası yönetebilmeli', async () => {
      const result = await loader.load('services');
      const firstItem = result.content.default[0];

      try {
        await loader.resolveRelations<TestRecord>(
          'services',
          'non-existent',
          [firstItem],
        );
        expect(true).toBe(false); // Test should not reach here
      }
      catch (error) {
        if (error instanceof RelationError) {
          expect(error.message).toBe('No relations found for field: non-existent');
        }
        else {
          throw error;
        }
      }
    });

    it('bağlantı hatalarını yönetebilmeli', () => {
      const createLoader = () => new SQLiteLoader({
        databasePath: 'invalid/path/to/db.sqlite',
        cache: true,
      });

      expect(createLoader).toThrow(DatabaseError);

      try {
        createLoader();
      }
      catch (error: any) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.operation).toBe('initialize');
        expect(error.severity).toBe('error');
        expect(error.context).toEqual({
          databasePath: 'invalid/path/to/db.sqlite',
          originalError: 'Failed to establish database connection',
          errorCode: 'DATABASE_ERROR',
        });
      }
    });

    it('bağlantı kapatıldıktan sonra sorgu hatası yönetebilmeli', async () => {
      const testLoader = new SQLiteLoader({
        databasePath: dbPath,
        cache: false, // Cache'i devre dışı bırak
      });

      await testLoader.close();
      await expect(testLoader.load('services')).rejects.toThrow('Failed to load content');
    });
  });

  describe('performans Testleri', () => {
    it('çoklu sorgu performansını test edebilmeli', async () => {
      const start = Date.now();
      const promises = Array.from({ length: 5 }).map(async () => loader.load('services'));
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(1000); // 1 saniyeden az sürmeli
    });

    it('paralel sorgu performansını test edebilmeli', async () => {
      const promises = Array.from({ length: 10 }).map(async () =>
        loader.load('services'),
      );
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.content.default.length).toBeGreaterThan(0);
      });
    });

    it('büyük veri kümesini işleyebilmeli', async () => {
      const result = await loader.load('services');
      const items = result.content.default;

      const relations = await loader.resolveRelations<TestRecord>(
        'services',
        'reference',
        items,
      );

      expect(relations.length).toBeGreaterThan(0);
      expect(Array.isArray(relations)).toBe(true);
    });

    it('çoklu ilişkileri performanslı şekilde çözebilmeli', async () => {
      const start = Date.now();
      const result = await loader.load('services');
      const items = result.content.default;

      const relations = await loader.resolveRelations<TestRecord>(
        'services',
        'reference',
        items,
      );

      const duration = Date.now() - start;

      // İlişkilerin doğru çözüldüğünü kontrol et
      expect(relations.length).toBeGreaterThan(0);
      items.forEach((item) => {
        if (item.reference_id) {
          const relation = relations.find(r => r.id === item.reference_id);
          expect(relation).toBeDefined();
          expect(relation).toHaveProperty('logo');
          expect(relation).toHaveProperty('status');
        }
      });

      // Performans kontrolü
      expect(duration).toBeLessThan(1000); // 1 saniyeden az sürmeli
    });
  });

  describe('veri Bütünlüğü Testleri', () => {
    it('iD alanlarının benzersiz olduğunu kontrol edebilmeli', async () => {
      const result = await loader.load('services');
      const ids = result.content.default.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('zorunlu alanların dolu olduğunu kontrol edebilmeli', async () => {
      const result = await loader.load('services');
      result.content.default.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.status).toBeDefined();
        expect(item.created_at).toBeDefined();
        expect(item.updated_at).toBeDefined();
      });
    });

    it('ilişki bütünlüğünü kontrol edebilmeli', async () => {
      const result = await loader.load('services');
      const itemsWithReference = result.content.default.filter(item => item.reference_id);

      for (const item of itemsWithReference) {
        const relations = await loader.resolveRelations<TestRecord>(
          'services',
          'reference',
          [item],
        );
        expect(relations[0].id).toBe(item.reference_id);
      }
    });
  });
});
