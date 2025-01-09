import type { BaseContentrainType, ContentrainTypes } from '../../src/types/query';
import type { IWorkItems } from '../__fixtures__/contentrain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryBuilder } from '../../src/core/QueryBuilder';

interface IWorkCategory extends BaseContentrainType {
  name: string
  slug: string
}

interface IWorkItem extends BaseContentrainType {
  'title': string
  'description': string
  'categoryId': string
  'category-data'?: IWorkCategory
}

const mockData = {
  workcategories: [
    {
      ID: 'cat1',
      name: 'Category 1',
      slug: 'category-1',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      status: 'publish',
      scheduled: false,
    },
    {
      ID: 'cat2',
      name: 'Category 2',
      slug: 'category-2',
      createdAt: '2023-01-02',
      updatedAt: '2023-01-02',
      status: 'publish',
      scheduled: false,
    },
  ] as IWorkCategory[],
  workitems: [
    {
      ID: 'item1',
      title: 'Item 1',
      description: 'Description 1',
      categoryId: 'cat1',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      status: 'publish',
      scheduled: false,
    },
    {
      ID: 'item2',
      title: 'Item 2',
      description: 'Description 2',
      categoryId: 'cat2',
      createdAt: '2023-01-02',
      updatedAt: '2023-01-02',
      status: 'publish',
      scheduled: false,
    },
  ] as IWorkItem[],
};

describe('query Builder Relations', () => {
  let queryBuilder: QueryBuilder<IWorkItems, ContentrainTypes>;

  beforeEach(() => {
    queryBuilder = new QueryBuilder<IWorkItems, ContentrainTypes>({
      baseUrl: '__mocks__',
      contentDir: 'contentrain',
      defaultLocale: 'tr',
      modelsDir: 'contentrain/models',
      strategy: 'import',
    });

    // Mock data yükleme
    vi.spyOn(queryBuilder as any, 'loadModel').mockImplementation(async (...args: unknown[]) => {
      const modelId = args[0] as string;
      return Promise.resolve(mockData[modelId as keyof typeof mockData] || []);
    });
  });

  it('should include simple relation', async () => {
    const result = await queryBuilder
      .from('workitems')
      .include('category')
      .get();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect((result[0] as IWorkItem)['category-data']).toBeDefined();
  });

  it('should include relation with fields', async () => {
    const result = await queryBuilder
      .from('workitems')
      .include('category')
      .get();

    expect(result).toBeDefined();
    const workItem = result[0] as IWorkItem;
    expect(workItem['category-data']).toBeDefined();
    expect(workItem['category-data']?.name).toBeDefined();
  });

  it('should include relation with conditions', async () => {
    const result = await queryBuilder
      .from('workitems')
      .include('category')
      .where('status' as keyof BaseContentrainType, 'publish')
      .get();

    expect(result).toBeDefined();
    const workItem = result[0] as IWorkItem;
    expect(workItem['category-data']).toBeDefined();
    expect(workItem['category-data']?.status).toBe('publish');
  });

  it('should include relation with sorting', async () => {
    const result = await queryBuilder
      .from('workitems')
      .include('category')
      .orderBy('ID' as keyof BaseContentrainType)
      .get();

    expect(result).toBeDefined();
    const workItem = result[0] as IWorkItem;
    expect(workItem['category-data']).toBeDefined();
  });

  it('should handle localized relations', async () => {
    const result = await queryBuilder
      .from('workitems')
      .locale('tr')
      .include('category')
      .get();

    expect(result).toBeDefined();
    const workItem = result[0] as IWorkItem;
    expect(workItem['category-data']).toBeDefined();
  });
});
