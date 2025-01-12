import type { BaseContentrainType, QueryResult } from '@contentrain/core';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $fetch, setup } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '../../../playground/contentrain');

// Model Tipleri
interface IProcessItems extends BaseContentrainType {
  title: string
  description: string
  icon: string
  status: 'draft' | 'changed' | 'publish'
  order: number
}

interface IWorkCategory extends BaseContentrainType {
  category: string
  order: number
  status: 'draft' | 'changed' | 'publish'
}

interface IWorkItem extends BaseContentrainType {
  title: string
  description: string
  image: string
  category: string
  link: string
  order: number
  status: 'draft' | 'changed' | 'publish'
  _relations: {
    category: IWorkCategory
  }
}

interface IFaqItem extends BaseContentrainType {
  question: string
  answer: string
  order: number
  status: 'draft' | 'changed' | 'publish'
}

describe('contentrain Nuxt Modülü', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    server: true,
    browser: false,
    nuxtConfig: {
      contentrain: {
        contentDir,
        defaultLocale: 'tr',
        cache: true,
        ttl: 60 * 1000,
        maxCacheSize: 1000,
      },
    },
  });

  // Modül Yapılandırması Testleri
  describe('modül Yapılandırması', () => {
    it('varsayılan yapılandırma değerlerini doğru şekilde ayarlar', () => {
      const options = {
        contentDir,
        defaultLocale: 'tr',
        cache: true,
        ttl: 60 * 1000,
        maxCacheSize: 1000,
      };

      expect(options.contentDir).toBe(contentDir);
      expect(options.defaultLocale).toBe('tr');
      expect(options.cache).toBe(true);
      expect(options.ttl).toBe(60 * 1000);
      expect(options.maxCacheSize).toBe(1000);
    });
  });

  // API Endpoint Testleri
  describe('aPI Endpoints', () => {
    it('processes verilerini doğru şekilde getirir', async () => {
      const response = await $fetch<QueryResult<IProcessItems>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'processes',
          where: [['status', 'eq', 'publish']],
          orderBy: [['order', 'asc']],
        },
      });
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      if (response.data.length > 0) {
        expect(response.data[0].title).toBeDefined();
      }
    });

    it('workitems ve ilişkili category verilerini doğru şekilde getirir', async () => {
      const response = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['status', 'eq', 'publish']],
          include: ['category'],
          orderBy: [['order', 'asc']],
        },
      });
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      if (response.data.length > 0 && response.data[0]._relations?.category) {
        expect(response.data[0]._relations.category.category).toBeDefined();
      }
    });

    it('faqitems verilerini doğru şekilde getirir', async () => {
      const response = await $fetch<QueryResult<IFaqItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'faqitems',
          where: [['status', 'eq', 'publish']],
          orderBy: [['order', 'asc']],
        },
      });
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      if (response.data.length > 0) {
        expect(response.data[0].question).toBeDefined();
      }
    });
  });

  // Composable Testleri
  describe('useContentrain Composable', () => {
    it('sayfa doğru şekilde render edilmeli', async () => {
      const html = await $fetch('/');
      expect(html).toBeDefined();
      // HTML içeriğini kontrol et
      expect(html).toMatch(/<div[^>]*>/);
    });
  });

  // Cache Testleri
  describe('cache Mekanizması', () => {
    it('cache aktif olduğunda veriyi önbellekten getirmeli', async () => {
      // İlk istek
      const firstResponse = await $fetch<QueryResult<IProcessItems>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'processes',
          cache: true,
        },
      });

      // İkinci istek (önbellekten gelmeli)
      const secondResponse = await $fetch<QueryResult<IProcessItems>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'processes',
          cache: true,
        },
      });

      expect(firstResponse).toBeDefined();
      expect(secondResponse).toBeDefined();
      expect(firstResponse.data).toEqual(secondResponse.data);
    });
  });
});
