import type { ContentLoaderOptions } from '../../types/loader';
import type { BaseContentrainType } from '../../types/model';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentLoader } from '../content';

describe('contentLoader', () => {
  let loader: ContentLoader;
  let options: ContentLoaderOptions;

  beforeEach(() => {
    options = {
      contentDir: join(__dirname, '../../../../../__mocks__/contentrain'),
      defaultLocale: 'en',
      cache: true,
      ttl: 60 * 1000, // 1 dakika
      maxCacheSize: 100, // 100 MB
    };

    loader = new ContentLoader(options);
  });

  afterEach(async () => {
    await loader.clearCache();
  });

  describe('load', () => {
    it('should load model with content', async () => {
      const result = await loader.load('workitems');

      expect(result).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.model.metadata.modelId).toBe('workitems');
      expect(result.model.metadata.localization).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content.en).toBeDefined();
      expect(Array.isArray(result.content.en)).toBe(true);
    });

    it('should load non-localized model', async () => {
      const result = await loader.load('sociallinks');

      expect(result).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.model.metadata.localization).toBe(false);
      expect(result.content.default).toBeDefined();
      expect(Array.isArray(result.content.default)).toBe(true);
    });

    it('should throw error for non-existent model', async () => {
      await expect(loader.load('non-existent')).rejects.toThrow();
    });

    it('should use cache for subsequent loads', async () => {
      // İlk yükleme
      const result1 = await loader.load('workitems');
      const stats1 = loader.getCacheStats();

      // İkinci yükleme (cache'den gelmeli)
      const result2 = await loader.load('workitems');
      const stats2 = loader.getCacheStats();

      expect(result1).toEqual(result2);
      expect(stats2.hits).toBeGreaterThan(stats1.hits);
    });

    it('should load model metadata and fields correctly', async () => {
      const result = await loader.load('faqitems');

      expect(result).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.model.metadata).toBeDefined();
      expect(result.model.metadata.modelId).toBe('faqitems');

      // Field yapısını kontrol et
      expect(Array.isArray(result.model.fields)).toBe(true);
      expect(result.model.fields.length).toBeGreaterThan(0);

      // Zorunlu field property'lerini kontrol et
      const firstField = result.model.fields[0];
      expect(firstField).toHaveProperty('fieldId');
      expect(firstField).toHaveProperty('fieldType');
      expect(firstField).toHaveProperty('componentId');

      // System field'larını kontrol et
      const systemFields = result.model.fields.filter(f => f.system);
      expect(systemFields).toHaveLength(4); // ID, createdAt, updatedAt, status

      // Özel field'ları kontrol et
      const questionField = result.model.fields.find(f => f.fieldId === 'question');
      expect(questionField).toBeDefined();
      expect(questionField?.fieldType).toBe('string');
      expect(questionField?.componentId).toBe('single-line-text');
    });

    it('should validate field structure', async () => {
      // Sections modelini kullanarak field validasyonu testi
      const result = await loader.load('sections');

      // Field yapısını kontrol et
      expect(Array.isArray(result.model.fields)).toBe(true);
      expect(result.model.fields.length).toBeGreaterThan(0);

      // Her field'ın gerekli property'lere sahip olduğunu kontrol et
      result.model.fields.forEach((field) => {
        expect(field.fieldId).toBeDefined();
        expect(field.fieldType).toBeDefined();
        expect(field.componentId).toBeDefined();
      });
    });
  });

  describe('resolveRelation', () => {
    it('should resolve one-to-one relation', async () => {
      interface WorkItem extends BaseContentrainType {
        category: string
        title: string
        image: string
        description: string
        link: string
        order: number
      }

      interface WorkCategory extends BaseContentrainType {
        category: string
        order: number
      }

      // Ana içeriği yükle
      await loader.load('workitems');
      const workitems = await loader.load<WorkItem>('workitems');

      // İlişkiyi çöz
      const categories = await loader.resolveRelation<WorkItem, WorkCategory>(
        'workitems',
        'category',
        workitems.content.en,
        'en',
      );

      expect(Array.isArray(categories)).toBe(true);
      expect(categories[0]).toHaveProperty('category');
      expect(categories[0]).toHaveProperty('order');
    });

    it('should handle missing relation field', async () => {
      interface WorkItem extends BaseContentrainType {
        title: string
        nonExistentRelation?: string
      }

      // Ana içeriği yükle
      await loader.load('workitems');
      const workitems = await loader.load<WorkItem>('workitems');

      // Olmayan bir ilişki için test
      await expect(
        loader.resolveRelation(
          'workitems',
          'nonExistentRelation',
          workitems.content.en,
          'en',
        ),
      ).rejects.toThrow(/No relation found/);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      // Önce içeriği yükle
      await loader.load('workitems');
      const stats1 = loader.getCacheStats();
      expect(stats1.size).toBeGreaterThan(0);

      // Cache'i temizle
      await loader.clearCache();
      const stats2 = loader.getCacheStats();
      expect(stats2.size).toBe(0);
    });

    it('should refresh specific model cache', async () => {
      // İlk yükleme
      await loader.load('workitems');
      const stats1 = loader.getCacheStats();

      // Cache'i yenile
      await loader.refreshCache('workitems');
      const stats2 = loader.getCacheStats();

      expect(stats2.hits).toBeLessThan(stats1.hits + 1);
    });

    it('should respect TTL settings', async () => {
      // Kısa TTL ile loader oluştur
      const shortTTLLoader = new ContentLoader({
        ...options,
        ttl: 100, // 100ms
      });

      // İçeriği yükle
      await shortTTLLoader.load('workitems');

      // TTL süresini bekle
      await new Promise(resolve => setTimeout(resolve, 150));

      // Tekrar yükle (cache miss olmalı)
      await shortTTLLoader.load('workitems');
      const stats = shortTTLLoader.getCacheStats();
      expect(stats.misses).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle file system errors', async () => {
      const badLoader = new ContentLoader({
        ...options,
        contentDir: 'non-existent-dir',
      });

      await expect(badLoader.load('workitems')).rejects.toThrow();
    });

    it('should handle invalid model config', async () => {
      // Var olmayan bir model için test
      await expect(loader.load('non-existent-model')).rejects.toThrow(/Model metadata not found/);
    });

    it('should handle non-existent model', async () => {
      // Var olmayan bir model için test
      await expect(loader.load('non-existent-model')).rejects.toThrow(/Model metadata not found/);
    });

    it('should handle invalid locale in content files', async () => {
      const result = await loader.load('workitems');
      expect(result.content['invalid-locale']).toBeUndefined();
    });

    it('should handle concurrent load requests gracefully', async () => {
      const promises = Array.from({ length: 5 }).fill(null).map(async () => loader.load('workitems'));
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.model.metadata.modelId).toBe('workitems');
      });
    });

    it('should handle file permission errors', async () => {
      const restrictedLoader = new ContentLoader({
        ...options,
        contentDir: '/root/restricted', // Erişim izni olmayan dizin
      });

      await expect(restrictedLoader.load('workitems')).rejects.toThrow();
    });
  });

  describe('model configuration', () => {
    it('should load metadata from metadata.json', async () => {
      const result = await loader.load('faqitems');

      expect(result.model.metadata).toBeDefined();
      expect(result.model.metadata.modelId).toBe('faqitems');
      expect(result.model.metadata).toHaveProperty('localization');
      expect(result.model.metadata).toHaveProperty('type');
    });

    it('should throw error for missing model in metadata', async () => {
      // Metadata.json'da olmayan bir model için test
      await expect(loader.load('non-existent-model')).rejects.toThrow(/Model metadata not found/);
    });

    it('should validate field structure', async () => {
      // Sections modelini kullanarak field validasyonu testi
      const result = await loader.load('sections');

      expect(result.model.fields).toBeDefined();
      expect(result.model.fields.length).toBeGreaterThan(0);
      result.model.fields.forEach((field) => {
        expect(field.fieldId).toBeDefined();
        expect(field.fieldType).toBeDefined();
        expect(field.componentId).toBeDefined();
      });
    });
  });
});
