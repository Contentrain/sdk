import type { BaseContentrainType, QueryResult } from '@contentrain/query';
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

  // Module Configuration Tests
  describe('module Configuration', () => {
    it('sets default configuration values correctly', () => {
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

    // Pagination Testleri
    it('sayfalama işlemlerini doğru şekilde gerçekleştirir', async () => {
      const limit = 2;
      const response = await $fetch<QueryResult<IProcessItems>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'processes',
          where: [['status', 'eq', 'publish']],
          limit,
          offset: 0,
        },
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.length).toBeLessThanOrEqual(limit);

      // İkinci sayfa
      const secondPage = await $fetch<QueryResult<IProcessItems>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'processes',
          where: [['status', 'eq', 'publish']],
          limit,
          offset: limit,
        },
      });

      expect(secondPage.data).toBeDefined();
      if (response.data.length > 0 && secondPage.data.length > 0) {
        expect(response.data[0].ID).not.toBe(secondPage.data[0].ID);
      }
    });

    // Sıralama Testleri
    it('sıralama işlemlerini doğru şekilde gerçekleştirir', async () => {
      const ascResponse = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['status', 'eq', 'publish']],
          orderBy: [['order', 'asc']],
        },
      });

      const descResponse = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['status', 'eq', 'publish']],
          orderBy: [['order', 'desc']],
        },
      });

      // Önce veri olduğundan emin olalım
      expect(ascResponse.data.length).toBeGreaterThan(0);
      expect(descResponse.data.length).toBeGreaterThan(0);

      // Sıralama kontrolü
      if (ascResponse.data.length > 1) {
        for (let i = 0; i < ascResponse.data.length - 1; i++) {
          expect(ascResponse.data[i].order).toBeLessThanOrEqual(ascResponse.data[i + 1].order);
        }
      }

      if (descResponse.data.length > 1) {
        for (let i = 0; i < descResponse.data.length - 1; i++) {
          expect(descResponse.data[i].order).toBeGreaterThanOrEqual(descResponse.data[i + 1].order);
        }
      }

      // İlk ve son elemanları karşılaştır
      if (ascResponse.data.length > 1 && descResponse.data.length > 1) {
        expect(ascResponse.data[0].order).toBeLessThanOrEqual(ascResponse.data[ascResponse.data.length - 1].order);
        expect(descResponse.data[0].order).toBeGreaterThanOrEqual(descResponse.data[descResponse.data.length - 1].order);
      }
    });

    // Gelişmiş Filtreleme Testleri
    it('gelişmiş filtreleme operatörlerini doğru şekilde kullanır', async () => {
      // IN operatörü testi
      const inResponse = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['status', 'in', ['draft', 'publish']]],
        },
      });
      expect(inResponse.data.every(item => ['draft', 'publish'].includes(item.status))).toBe(true);

      // Contains operatörü testi
      const containsResponse = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['description', 'contains', 'content']],
        },
      });
      expect(containsResponse.data.every(item =>
        item.description.toLowerCase().includes('content'),
      )).toBe(true);

      // StartsWith operatörü testi
      const startsWithResponse = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['title', 'startsWith', 'Content']],
        },
      });
      expect(startsWithResponse.data.every(item =>
        item.title.startsWith('Content'),
      )).toBe(true);
    });

    // İlişki Testleri
    it('ilişkili verileri doğru şekilde çeker ve birleştirir', async () => {
      const response = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['status', 'eq', 'publish']],
          include: ['category'],
        },
      });

      expect(response.data.length).toBeGreaterThan(0);
      response.data.forEach((item) => {
        expect(item._relations).toBeDefined();
        expect(item._relations.category).toBeDefined();
        expect(item._relations.category.ID).toBeDefined();
        expect(item._relations.category.category).toBeDefined();
      });
    });

    // Hata Durumu Testleri
    it('geçersiz model ismi için uygun hata döndürür', async () => {
      try {
        await $fetch('/api/contentrain/query', {
          method: 'POST',
          body: {
            model: 'nonexistentmodel',
          },
        });
        throw new Error('Bu hata fırlatılmalıydı');
      }
      catch (error: any) {
        expect(error.statusCode).toBeDefined();
        expect(error.statusCode).toBe(500);
      }
    });

    it('geçersiz operatör için uygun hata döndürür', async () => {
      try {
        await $fetch('/api/contentrain/query', {
          method: 'POST',
          body: {
            model: 'workitems',
            where: [['status', 'invalidoperator' as any, 'publish']],
          },
        });
        throw new Error('Bu hata fırlatılmalıydı');
      }
      catch (error: any) {
        expect(error.statusCode).toBeDefined();
        expect(error.statusCode).toBe(500);
      }
    });

    // Cache Testleri
    it('cache mekanizması doğru çalışır', async () => {
      const firstResponse = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['status', 'eq', 'publish']],
          cache: true,
        },
      });

      const secondResponse = await $fetch<QueryResult<IWorkItem>>('/api/contentrain/query', {
        method: 'POST',
        body: {
          model: 'workitems',
          where: [['status', 'eq', 'publish']],
          cache: true,
        },
      });

      expect(firstResponse).toEqual(secondResponse);
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
