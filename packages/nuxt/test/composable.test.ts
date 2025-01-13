import type { BaseContentrainType } from '@contentrain/query';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup } from '@nuxt/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { useContentrain } from '../src/runtime/composables/contentrain';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '../../../../playground/contentrain');

// Mock #imports
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: {
      contentrain: {
        contentDir: join(__dirname, '../../../playground/contentrain'),
        defaultLocale: 'tr',
        cache: true,
        ttl: 60,
        maxCacheSize: 100,
      },
    },
  }),
}));

// Mock $fetch
const mockFetch = vi.fn(async (url: string, options: any = {}) => {
  const { body = {} } = options;
  const { model, locale } = body;

  // Load endpoint
  if (url === '/api/contentrain/load') {
    if (model === 'nonexistentmodel') {
      const error = new Error('Model not found');
      (error as any).statusCode = 500;
      throw error;
    }

    if (model === 'workitems') {
      return {
        content: [
          {
            ID: '1',
            title: 'Proje 1',
            status: 'publish',
            order: 1,
          },
        ],
      };
    }
  }

  // Query endpoint
  if (url === '/api/contentrain/query') {
    if (model === 'faqitems') {
      if (locale === 'tr') {
        return {
          data: [
            {
              ID: '1',
              question: 'Teknik destek nasıl sağlanır?',
              answer: 'Teknik destek ekibimiz 7/24 hizmetinizdedir.',
              status: 'publish',
            },
          ],
        };
      }
      else if (locale === 'en') {
        return {
          data: [
            {
              ID: '1',
              question: 'How is technical support provided?',
              answer: 'Our technical support team is available 24/7.',
              status: 'publish',
            },
          ],
        };
      }
    }

    if (model === 'workitems') {
      // Sayfalama için mock veri
      const { offset = 0, limit } = body;
      const mockData = [
        {
          ID: '1',
          title: 'Proje 1',
          status: 'publish',
          order: 1,
          _relations: {
            category: {
              ID: 'cat1',
              title: 'Kategori 1',
              category: 'Web',
            },
          },
        },
        {
          ID: '2',
          title: 'Proje 2',
          status: 'publish',
          order: 2,
          _relations: {
            category: {
              ID: 'cat2',
              title: 'Kategori 2',
              category: 'Mobile',
            },
          },
        },
        {
          ID: '3',
          title: 'Proje 3',
          status: 'publish',
          order: 3,
          _relations: {
            category: {
              ID: 'cat3',
              title: 'Kategori 3',
              category: 'Desktop',
            },
          },
        },
      ];

      // Sayfalama uygula
      const startIndex = Number(offset) || 0;
      const pageSize = Number(limit) || mockData.length;
      const endIndex = startIndex + pageSize;
      const paginatedData = mockData.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        total: mockData.length,
        pagination: {
          limit: pageSize,
          offset: startIndex,
          hasMore: endIndex < mockData.length,
        },
      };
    }
  }

  // Render endpoint
  if (url === '/') {
    return '<div>Test Page</div>';
  }

  return { data: [] };
});

// @ts-expect-error $fetch is not defined in globalThis but we need to mock it for testing
globalThis.$fetch = mockFetch;

interface IFaqItem extends BaseContentrainType {
  question: string
  answer: string
  status: 'draft' | 'publish'
}

interface IWorkCategory extends BaseContentrainType {
  title: string
  status: 'draft' | 'publish'
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

describe('useContentrain Composable', () => {
  beforeAll(async () => {
    await setup({
      rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
      server: true,
      browser: false,
      setupTimeout: 60000,
      nuxtConfig: {
        modules: ['@contentrain/nuxt'],
        contentrain: {
          contentDir,
          defaultLocale: 'tr',
          cache: true,
          ttl: 60 * 1000,
          maxCacheSize: 1000,
        },
      },
    });
  });

  describe('query builder', () => {
    it('should return query function', () => {
      const { query } = useContentrain();
      expect(query).toBeDefined();
      expect(typeof query).toBe('function');
    });

    it('should fetch data with locale', async () => {
      const { query } = useContentrain();

      // Türkçe içerik
      const trData = await query<IFaqItem>('faqitems')
        .locale('tr')
        .where('status', 'eq', 'publish')
        .get();

      expect(trData).toHaveProperty('data');
      expect(trData.data).toBeInstanceOf(Array);

      // İngilizce içerik
      const enData = await query<IFaqItem>('faqitems')
        .locale('en')
        .where('status', 'eq', 'publish')
        .get();

      expect(enData).toHaveProperty('data');
      expect(enData.data).toBeInstanceOf(Array);

      // İçeriklerin farklı olduğunu kontrol et
      if (trData.data.length > 0 && enData.data.length > 0) {
        expect(trData.data[0].question).not.toBe(enData.data[0].question);
      }
    });

    it('should apply filters correctly', async () => {
      const { query } = useContentrain();

      const data = await query<IFaqItem>('faqitems')
        .where('status', 'eq', 'publish')
        .get();

      expect(data).toHaveProperty('data');
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.every(item => item.status === 'publish')).toBe(true);
    });

    it('should include related data', async () => {
      const { query } = useContentrain();

      const data = await query<IWorkItem>('workitems')
        .where('status', 'eq', 'publish')
        .include('category')
        .get();

      expect(data).toHaveProperty('data');
      expect(data.data).toBeInstanceOf(Array);
      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('_relations.category');
      }
    });

    it('query builder fonksiyonlarını doğru şekilde döndürür', () => {
      const { query } = useContentrain();
      const builder = query('workitems');

      expect(typeof builder.where).toBe('function');
      expect(typeof builder.include).toBe('function');
      expect(typeof builder.orderBy).toBe('function');
      expect(typeof builder.limit).toBe('function');
      expect(typeof builder.offset).toBe('function');
      expect(typeof builder.locale).toBe('function');
      expect(typeof builder.get).toBe('function');
      expect(typeof builder.first).toBe('function');
    });

    it('zincirleme sorgu oluşturmayı destekler', () => {
      const { query } = useContentrain();
      const builder = query<IWorkItem>('workitems')
        .where('status', 'eq', 'publish')
        .include('category')
        .orderBy('order', 'desc')
        .limit(5)
        .offset(0)
        .locale('tr');

      expect(builder).toBeDefined();
    });

    it('first() metodu tek kayıt döndürür', async () => {
      const { query } = useContentrain();
      const item = await query<IWorkItem>('workitems')
        .where('status', 'eq', 'publish')
        .first();

      if (item) {
        expect(item.ID).toBeDefined();
        expect(item.title).toBeDefined();
      }
      else {
        expect(item).toBeNull();
      }
    });

    it('çoklu where koşullarını destekler', async () => {
      const { query } = useContentrain();
      const result = await query<IWorkItem>('workitems')
        .where('status', 'eq', 'publish')
        .where('order', 'gt', 0)
        .get();

      expect(result.data).toBeDefined();
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.order).toBeGreaterThan(0);
      });
    });

    it('çoklu include ilişkilerini destekler', async () => {
      const { query } = useContentrain();
      const result = await query<IWorkItem>('workitems')
        .include('category')
        .get();

      expect(result.data).toBeDefined();
      if (result.data.length > 0) {
        expect(result.data[0]._relations).toBeDefined();
        expect(result.data[0]._relations?.category).toBeDefined();
      }
    });

    it('çoklu sıralama kriterlerini destekler', async () => {
      const { query } = useContentrain();
      const result = await query<IWorkItem>('workitems')
        .orderBy('order', 'asc')
        .orderBy('title', 'desc')
        .get();

      expect(result.data).toBeDefined();
    });

    it('dil desteğini doğru şekilde uygular', async () => {
      const { query } = useContentrain();
      const trResult = await query<IFaqItem>('faqitems')
        .locale('tr')
        .get();

      const enResult = await query<IFaqItem>('faqitems')
        .locale('en')
        .get();

      if (trResult.data.length > 0 && enResult.data.length > 0) {
        expect(trResult.data[0].question).not.toBe(enResult.data[0].question);
      }
    });
  });

  describe('cache mechanism', () => {
    it('should cache results when enabled', async () => {
      const { query } = useContentrain();

      // İlk istek
      const firstResponse = await query<IFaqItem>('faqitems')
        .where('status', 'eq', 'publish')
        .get();

      // İkinci istek (önbellekten gelmeli)
      const secondResponse = await query<IFaqItem>('faqitems')
        .where('status', 'eq', 'publish')
        .get();

      expect(firstResponse).toEqual(secondResponse);
    });
  });

  describe('load fonksiyonu', () => {
    it('modeli doğrudan yükler', async () => {
      const { load } = useContentrain();
      const result = await load<IWorkItem>('workitems');

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('geçersiz model için hata fırlatır', async () => {
      const { load } = useContentrain();
      try {
        await load('nonexistentmodel');
        throw new Error('Bu hata fırlatılmalıydı');
      }
      catch (error: any) {
        expect(error.statusCode).toBeDefined();
        expect(error.statusCode).toBe(500);
      }
    });
  });

  it('sayfa doğru şekilde render edilmeli', async () => {
    const html = await $fetch('/');
    expect(html).toBeDefined();
    expect(html).toMatch(/<div[^>]*>/);
  });
});
