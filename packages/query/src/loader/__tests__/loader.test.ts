import type { ContentrainBaseModel } from '@contentrain/types';
import type { DataLoader } from '../types';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FetchLoader } from '../browser';
import { FileSystemLoader } from '../node';

interface TestPost extends ContentrainBaseModel {
  title: string
  content: string
  categoryId: string
}

interface TestCategory extends ContentrainBaseModel {
  name: string
}

interface TestMetadata {
  name: string
  modelId: string
  localization: boolean
  type: string
}

interface TestData {
  metadata: TestMetadata[]
  posts: {
    fields: unknown[]
    tr: TestPost[]
    en: TestPost[]
  }
  categories: TestCategory[]
}

const TEST_DATA: TestData = {
  metadata: [
    {
      name: 'Posts',
      modelId: 'posts',
      localization: true,
      type: 'MD',
    },
    {
      name: 'Categories',
      modelId: 'categories',
      localization: false,
      type: 'JSON',
    },
  ],
  posts: {
    fields: [],
    tr: [
      {
        ID: '1',
        title: 'Merhaba Dünya',
        content: 'İçerik',
        categoryId: 'cat1',
        status: 'publish',
        createdAt: '2024-01-07T00:00:00.000Z',
        updatedAt: '2024-01-07T00:00:00.000Z',
        scheduled: false,
      },
    ],
    en: [
      {
        ID: '1',
        title: 'Hello World',
        content: 'Content',
        categoryId: 'cat1',
        status: 'publish',
        createdAt: '2024-01-07T00:00:00.000Z',
        updatedAt: '2024-01-07T00:00:00.000Z',
        scheduled: false,
      },
    ],
  },
  categories: [
    {
      ID: 'cat1',
      name: 'Technology',
      status: 'publish',
      createdAt: '2024-01-07T00:00:00.000Z',
      updatedAt: '2024-01-07T00:00:00.000Z',
      scheduled: false,
    },
  ],
};

describe('dataLoader', () => {
  let fsLoader: DataLoader;
  let fetchLoader: DataLoader;

  beforeEach(() => {
    // Setup FileSystemLoader
    fsLoader = new FileSystemLoader(join(process.cwd(), 'contentrain'));

    // Setup FetchLoader
    vi.stubGlobal('fetch', vi.fn());
    fetchLoader = new FetchLoader('/api/contentrain');
  });

  describe('loadModel', () => {
    it('should load localized model data', async () => {
      // Mock FileSystemLoader
      vi.spyOn(fsLoader as any, 'readJsonFile').mockImplementation(
        (async (path: string) => {
          if (path.includes('metadata.json'))
            return TEST_DATA.metadata;
          if (path.includes('posts.json'))
            return TEST_DATA.posts.fields;
          if (path.includes('tr.json'))
            return TEST_DATA.posts.tr;
          if (path.includes('en.json'))
            return TEST_DATA.posts.en;
          return [];
        }) as any,
      );

      // Mock FetchLoader
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        let responseData: unknown[] = [];
        if (url.includes('metadata.json'))
          responseData = TEST_DATA.metadata;
        if (url.includes('posts.json'))
          responseData = TEST_DATA.posts.fields;
        if (url.includes('tr.json'))
          responseData = TEST_DATA.posts.tr;
        if (url.includes('en.json'))
          responseData = TEST_DATA.posts.en;

        return Promise.resolve({
          ok: true,
          json: async () => Promise.resolve(responseData),
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      // Test FileSystemLoader
      const trPosts = await fsLoader.loadModel<TestPost>('posts', 'tr');
      expect(trPosts).toEqual(TEST_DATA.posts.tr);

      const enPosts = await fsLoader.loadModel<TestPost>('posts', 'en');
      expect(enPosts).toEqual(TEST_DATA.posts.en);

      // Test FetchLoader
      const trPostsFetch = await fetchLoader.loadModel<TestPost>('posts', 'tr');
      expect(trPostsFetch).toEqual(TEST_DATA.posts.tr);

      const enPostsFetch = await fetchLoader.loadModel<TestPost>('posts', 'en');
      expect(enPostsFetch).toEqual(TEST_DATA.posts.en);
    });

    it('should load non-localized model data', async () => {
      // Mock FileSystemLoader
      vi.spyOn(fsLoader as any, 'readJsonFile').mockImplementation(
        (async (path: string) => {
          if (path.includes('metadata.json'))
            return TEST_DATA.metadata;
          if (path.includes('categories.json'))
            return TEST_DATA.categories;
          return [];
        }) as any,
      );

      // Mock FetchLoader
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        let responseData: unknown[] = [];
        if (url.includes('metadata.json'))
          responseData = TEST_DATA.metadata;
        if (url.includes('categories.json'))
          responseData = TEST_DATA.categories;

        return Promise.resolve({
          ok: true,
          json: async () => Promise.resolve(responseData),
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      // Test FileSystemLoader
      const categories = await fsLoader.loadModel<TestCategory>('categories');
      expect(categories).toEqual(TEST_DATA.categories);

      // Test FetchLoader
      const categoriesFetch = await fetchLoader.loadModel<TestCategory>('categories');
      expect(categoriesFetch).toEqual(TEST_DATA.categories);
    });
  });

  describe('loadRelation', () => {
    it('should load related model data', async () => {
      // Mock FileSystemLoader
      vi.spyOn(fsLoader as any, 'readJsonFile').mockImplementation(
        (async (path: string) => {
          if (path.includes('metadata.json'))
            return TEST_DATA.metadata;
          if (path.includes('categories.json'))
            return TEST_DATA.categories;
          return [];
        }) as any,
      );

      // Mock FetchLoader
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        let responseData: unknown[] = [];
        if (url.includes('metadata.json'))
          responseData = TEST_DATA.metadata;
        if (url.includes('categories.json'))
          responseData = TEST_DATA.categories;

        return Promise.resolve({
          ok: true,
          json: async () => Promise.resolve(responseData),
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      // Test FileSystemLoader
      const category = await fsLoader.loadRelation<TestCategory>('categories', 'cat1');
      expect(category).toEqual(TEST_DATA.categories[0]);

      // Test FetchLoader
      const categoryFetch = await fetchLoader.loadRelation<TestCategory>('categories', 'cat1');
      expect(categoryFetch).toEqual(TEST_DATA.categories[0]);
    });
  });
});
