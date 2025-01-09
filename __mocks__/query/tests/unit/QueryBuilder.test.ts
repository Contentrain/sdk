import type { BaseContentrainType, ContentrainTypes } from '../../src/types/query';
import { describe, expect, it, vi } from 'vitest';
import { QueryBuilder } from '../../src/core/QueryBuilder';

// Model tipleri
interface IWorkCategories extends BaseContentrainType {
  name: string
  slug: string
  order: number
}

interface IWorkItems extends BaseContentrainType {
  'title': string
  'description': string
  'image'?: string
  'link': string
  'order': number
  'categoryId': string // İlişki ID'si
  'category-data'?: IWorkCategories // İlişki verisi
}

// Test tipleri
interface TestTypes extends ContentrainTypes {
  models: {
    workitems: IWorkItems
    workcategories: IWorkCategories
  }
  relations: {
    'workitems.category': {
      model: 'workcategories'
      type: 'one-to-one'
    }
  }
  locales: 'tr' | 'en'
}

// Mock veriler
const mockWorkItems: IWorkItems[] = [
  {
    ID: '1',
    title: 'Test Item 1',
    description: 'Description 1',
    link: 'https://example.com/1',
    order: 1,
    categoryId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    status: 'publish',
    scheduled: false,
  },
  {
    ID: '2',
    title: 'Test Item 2',
    description: 'Description 2',
    link: 'https://example.com/2',
    order: 2,
    categoryId: '2',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    status: 'draft',
    scheduled: false,
  },
];

const mockWorkCategories: IWorkCategories[] = [
  {
    ID: '1',
    name: 'Category 1',
    slug: 'category-1',
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    status: 'publish',
    scheduled: false,
  },
  {
    ID: '2',
    name: 'Category 2',
    slug: 'category-2',
    order: 2,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    status: 'publish',
    scheduled: false,
  },
];

// Mock ContentLoader
vi.mock('../../src/utils/loader', () => ({
  ContentLoader: vi.fn().mockImplementation(() => ({
    loadModelMetadata: vi.fn().mockImplementation(() => ({
      name: 'Work Items',
      modelId: 'workitems',
      localization: true,
      type: 'JSON',
      createdBy: 'system',
      isServerless: false,
      relations: {
        'workitems.category': {
          model: 'workcategories',
          type: 'one-to-one',
        },
      },
    })),
    loadModel: vi.fn().mockImplementation((modelId: string, locale?: 'tr' | 'en') => {
      if (modelId === 'workitems') {
        if (!locale)
          return mockWorkItems;
        // Lokalize edilmiş veriler
        return mockWorkItems.map(item => ({
          ...item,
          title: `${item.title} (${locale})`,
          description: `${item.description} (${locale})`,
        }));
      }
      if (modelId === 'workcategories') {
        if (!locale)
          return mockWorkCategories;
        // Lokalize edilmiş veriler
        return mockWorkCategories.map(item => ({
          ...item,
          name: `${item.name} (${locale})`,
          slug: `${item.slug}-${locale}`,
        }));
      }
      return [];
    }),
  })),
}));

describe('query Builder', () => {
  const config = {
    baseUrl: '__mocks__',
    contentDir: 'contentrain',
    defaultLocale: 'tr',
    modelsDir: 'contentrain/models',
    strategy: 'import' as const,
  };

  it('should create a new instance', () => {
    const query = new QueryBuilder<IWorkItems, TestTypes>(config);
    expect(query).toBeInstanceOf(QueryBuilder);
  });

  it('should filter data with where clause', async () => {
    const query = new QueryBuilder<IWorkItems, TestTypes>(config);
    const results = await query
      .from('workitems')
      .where('status', 'publish')
      .get();

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].status).toBe('publish');
    }
  });

  it('should handle multiple where conditions', async () => {
    const query = new QueryBuilder<IWorkItems, TestTypes>(config);
    const results = await query
      .from('workitems')
      .where([
        ['status', 'publish'],
        ['order', 'gt', 5],
      ])
      .get();

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].status).toBe('publish');
      expect(results[0].order).toBeGreaterThan(5);
    }
  });

  it('should sort data', async () => {
    const query = new QueryBuilder<IWorkItems, TestTypes>(config);
    const results = await query
      .from('workitems')
      .orderBy('order', 'desc')
      .get();

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 1) {
      const orders = results.map(item => item.order);
      expect(orders).toEqual([...orders].sort((a, b) => b - a));
    }
  });

  it('should limit results', async () => {
    const query = new QueryBuilder<IWorkItems, TestTypes>(config);
    const results = await query
      .from('workitems')
      .limit(1)
      .get();

    expect(results).toHaveLength(1);
  });

  it('should skip results', async () => {
    const query = new QueryBuilder<IWorkItems, TestTypes>(config);
    const allResults = await query.from('workitems').get();
    const skippedResults = await query
      .from('workitems')
      .skip(1)
      .get();

    expect(skippedResults.length).toBe(Math.max(0, allResults.length - 1));
  });

  it('should handle localized content', async () => {
    const query = new QueryBuilder<IWorkItems, TestTypes>(config);
    const results = await query
      .from('workitems')
      .locale('tr')
      .get();

    expect(Array.isArray(results)).toBe(true);
  });

  it('should get first item', async () => {
    const query = new QueryBuilder<IWorkItems, TestTypes>(config);
    const result = await query
      .from('workitems')
      .first();

    expect(result).toBeDefined();
    if (result) {
      expect(result.ID).toBeDefined();
    }
  });
});
