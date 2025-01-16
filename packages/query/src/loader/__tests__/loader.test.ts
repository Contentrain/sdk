import type { ContentLoaderOptions } from '../../types/loader';
import type { BaseContentrainType } from '../../types/model';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentLoader } from '../content';

interface WorkItem extends BaseContentrainType {
  category: string
  title: string
  image: string
  description: string
  link: string
  order: number
  _relations?: {
    category?: WorkCategory[]
  }
}

interface WorkCategory extends BaseContentrainType {
  category: string
  order: number
}
describe('contentLoader', () => {
  let loader: ContentLoader;
  let options: ContentLoaderOptions;

  beforeEach(() => {
    options = {
      contentDir: join(__dirname, '../../../../../playground/contentrain'),
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
      // First load
      const result1 = await loader.load('workitems');
      const stats1 = loader.getCacheStats();

      // Second load (should come from cache)
      const result2 = await loader.load('workitems');
      const stats2 = loader.getCacheStats();

      expect(result1).toEqual(result2);
      expect(stats1.hits).toBe(0);
      expect(stats2.hits).toBe(1);
    });

    it('should load model metadata and fields correctly', async () => {
      const result = await loader.load('faqitems');

      expect(result).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.model.metadata).toBeDefined();
      expect(result.model.metadata.modelId).toBe('faqitems');

      // Field structure
      expect(Array.isArray(result.model.fields)).toBe(true);
      expect(result.model.fields.length).toBeGreaterThan(0);

      // Check field structure
      const firstField = result.model.fields[0];
      expect(firstField).toHaveProperty('fieldId');
      expect(firstField).toHaveProperty('fieldType');
      expect(firstField).toHaveProperty('componentId');

      // Check system fields first
      const systemFields = result.model.fields.filter(f => f.system);
      expect(systemFields).toHaveLength(4); // ID, createdAt, updatedAt, status
      expect(firstField.fieldId).toBe('createdAt'); // First field should be createdAt

      // Check custom fields
      const questionField = result.model.fields.find(f => f.fieldId === 'question');
      expect(questionField).toBeDefined();
      expect(questionField?.fieldType).toBe('string');
      expect(questionField?.componentId).toBe('single-line-text');
    });

    it('should validate field structure', async () => {
      // Sections modelini kullanarak field validasyonu testi
      const result = await loader.load('sections');

      // Field structure
      expect(Array.isArray(result.model.fields)).toBe(true);
      expect(result.model.fields.length).toBeGreaterThan(0);

      // Check that each field has required properties
      result.model.fields.forEach((field) => {
        expect(field.fieldId).toBeDefined();
        expect(field.fieldType).toBeDefined();
        expect(field.componentId).toBeDefined();
      });
    });
  });

  describe('resolveRelation', () => {
    it('should resolve one-to-one relation and add to _relations', async () => {
      // Ana içeriği yükle
      await loader.load('workitems');
      const workitems = await loader.load<WorkItem>('workitems');
      console.log('Workitems içeriği:', JSON.stringify(workitems.content.en[0], null, 2));

      // İlişkiyi çöz
      const categories = await loader.resolveRelation<WorkItem, WorkCategory>(
        'workitems',
        'category',
        workitems.content.en,
        'en',
      );

      console.log('Çözümlenen kategoriler:', JSON.stringify(categories, null, 2));

      expect(Array.isArray(categories)).toBe(true);
      expect(categories[0]).toHaveProperty('category');
      expect(categories[0]).toHaveProperty('order');

      // _relations kontrolü
      const firstItem = workitems.content.en[0];
      console.log('İlk item _relations:', JSON.stringify(firstItem._relations, null, 2));
    });

    it('should resolve one-to-many relation between categories and tab items', async () => {
      interface TabItem extends BaseContentrainType {
        category: string[]
        link: string
        description: string
        image: string
        _relations?: {
          category?: WorkCategory[]
        }
      }

      // Tab items ve kategorileri yükle
      await loader.load('tabitems');
      const tabItems = await loader.load<TabItem>('tabitems');

      // İlişkiyi çöz ve _relations'a ata
      const resolvedCategories = await loader.resolveRelation<TabItem, WorkCategory>(
        'tabitems',
        'category',
        tabItems.content.en,
        'en',
      );

      // İlk çoklu kategoriye sahip item'ı bul
      const firstItemWithMultipleCategories = tabItems.content.en.find(item => Array.isArray(item.category) && item.category.length > 1);

      // İlişkileri _relations'a ata
      if (firstItemWithMultipleCategories) {
        firstItemWithMultipleCategories._relations = {
          category: resolvedCategories.filter(cat =>
            firstItemWithMultipleCategories.category.includes(cat.ID),
          ),
        };
      }

      // Testler
      expect(resolvedCategories).toBeDefined();
      expect(Array.isArray(resolvedCategories)).toBe(true);

      // İlk tab item'ın birden fazla kategorisi olduğunu kontrol et
      expect(firstItemWithMultipleCategories).toBeDefined();
      expect(firstItemWithMultipleCategories?.category.length).toBeGreaterThan(1);

      // İlişkilerin doğru çözümlendiğini kontrol et
      expect(firstItemWithMultipleCategories?._relations?.category).toBeDefined();
      expect(Array.isArray(firstItemWithMultipleCategories?._relations?.category)).toBe(true);
      expect(firstItemWithMultipleCategories?._relations?.category?.length).toBe(firstItemWithMultipleCategories?.category.length);

      // Her kategorinin doğru yapıda olduğunu kontrol et
      firstItemWithMultipleCategories?._relations?.category?.forEach((category) => {
        expect(category).toHaveProperty('ID');
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('order');
      });
    });

    it('should resolve relations for both locales', async () => {
      interface WorkItem extends BaseContentrainType {
        category: string
        title: string
        _relations?: {
          category?: WorkCategory[]
        }
      }

      interface WorkCategory extends BaseContentrainType {
        category: string
      }

      // Her iki dil için içeriği yükle ve ilişkileri çöz
      await loader.load('workitems');
      const workitems = await loader.load<WorkItem>('workitems');

      // EN için ilişkileri çöz
      const enCategories = await loader.resolveRelation<WorkItem, WorkCategory>(
        'workitems',
        'category',
        workitems.content.en,
        'en',
      );

      // TR için ilişkileri çöz
      const trCategories = await loader.resolveRelation<WorkItem, WorkCategory>(
        'workitems',
        'category',
        workitems.content.tr,
        'tr',
      );

      console.log('EN Kategoriler:', JSON.stringify(enCategories, null, 2));
      console.log('TR Kategoriler:', JSON.stringify(trCategories, null, 2));

      expect(enCategories).toBeDefined();
      expect(trCategories).toBeDefined();
      expect(enCategories[0].category).toBeDefined();
      expect(trCategories[0].category).toBeDefined();
    });

    it('should handle nested relations', async () => {
      interface WorkItem extends BaseContentrainType {
        category: string
        title: string
        _relations?: {
          category?: WorkCategory[]
        }
      }

      interface WorkCategory extends BaseContentrainType {
        category: string
        parentCategory?: string
        _relations?: {
          parentCategory?: WorkCategory[]
        }
      }

      // İçeriği yükle
      await loader.load('workitems');
      const workitems = await loader.load<WorkItem>('workitems');

      // İlk seviye ilişkiyi çöz
      const categories = await loader.resolveRelation<WorkItem, WorkCategory>(
        'workitems',
        'category',
        workitems.content.en,
        'en',
      );

      console.log('İç içe ilişkiler:', JSON.stringify(categories, null, 2));

      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
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
        contentDir: '/root/restricted', // Directory without access permission
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

  describe('localization handling', () => {
    it('should load content in English', async () => {
      const result = await loader.load<WorkItem>('workitems');
      const enContent = result.content.en;

      expect(result.model.metadata.localization).toBe(true);
      expect(enContent).toBeDefined();
      expect(Array.isArray(enContent)).toBe(true);

      // İngilizce içerik kontrolü
      const firstItem = enContent[0];
      expect(firstItem.title).toBeDefined();
      expect(typeof firstItem.title).toBe('string');
      expect(firstItem.description).toBeDefined();
      // İngilizce karakterler ve kelimeler içerdiğini kontrol et
      expect(firstItem.title).toMatch(/^[\w\s\-.,!?'"()]+$/);
    });

    it('should load content in Turkish', async () => {
      const result = await loader.load<WorkItem>('workitems');
      const trContent = result.content.tr;

      expect(result.model.metadata.localization).toBe(true);
      expect(trContent).toBeDefined();
      expect(Array.isArray(trContent)).toBe(true);

      // Türkçe içerik kontrolü
      const firstItem = trContent[0];
      expect(firstItem.title).toBeDefined();
      expect(typeof firstItem.title).toBe('string');
      expect(firstItem.description).toBeDefined();
      // Türkçe karakterler içerdiğini kontrol et
      expect(firstItem.title + firstItem.description).toMatch(/[ğüşıöçİ]/i);
    });

    it('should load same ID but different content for each locale', async () => {
      const result = await loader.load<WorkItem>('workitems');
      const enContent = result.content.en;
      const trContent = result.content.tr;

      // Aynı ID'ye sahip içerikleri bul
      const enItem = enContent[0];
      const trItem = trContent.find(item => item.ID === enItem.ID);

      expect(trItem).toBeDefined();
      expect(enItem.ID).toBe(trItem?.ID);
      // İçeriklerin farklı olduğunu kontrol et
      console.log(enItem.description, trItem?.description);
      expect(enItem.description).not.toBe(trItem?.description);
    });

    it('should load non-localized content without locale parameter', async () => {
      const result = await loader.load('sociallinks');

      expect(result.model.metadata.localization).toBe(false);
      expect(result.content.default).toBeDefined();
      expect(Array.isArray(result.content.default)).toBe(true);
      expect(result.content.default.length).toBeGreaterThan(0);

      // Sosyal link verilerinin yapısını kontrol et
      const firstLink = result.content.default[0];
      expect(firstLink).toHaveProperty('ID');
      expect(firstLink).toHaveProperty('link');
      expect(firstLink).toHaveProperty('icon');
    });

    it('should ignore locale parameter for non-localized content', async () => {
      const resultWithLocale = await loader.load('sociallinks');
      const resultWithoutLocale = await loader.load('sociallinks');

      expect(resultWithLocale.content).toEqual(resultWithoutLocale.content);
      expect(resultWithLocale.content.en).toBeUndefined();
      expect(resultWithLocale.content.tr).toBeUndefined();
      expect(resultWithLocale.content.default).toBeDefined();
    });

    it('should use default locale when no locale specified for localized content', async () => {
      const result = await loader.load('workitems');

      expect(result.model.metadata.localization).toBe(true);
      expect(result.content.en).toBeDefined();
      expect(Array.isArray(result.content.en)).toBe(true);
    });

    it('should handle both localized and non-localized models in cache', async () => {
      // İlk yükleme
      await loader.load('workitems'); // localized
      await loader.load('sociallinks'); // non-localized

      // Cache'den yükleme
      const localizedResult = await loader.load('workitems');
      const nonLocalizedResult = await loader.load('sociallinks');

      expect(localizedResult.content.en).toBeDefined();
      expect(localizedResult.content.tr).toBeDefined();
      expect(nonLocalizedResult.content.default).toBeDefined();

      const stats = loader.getCacheStats();
      expect(stats.hits).toBeGreaterThan(1);
    });
  });
});
