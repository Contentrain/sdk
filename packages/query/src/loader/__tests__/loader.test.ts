import { describe, expect, it, vi } from 'vitest';
import { mockData } from '../../__mocks__/data';
import { FetchLoader } from '../browser';
import { FileSystemLoader } from '../node';

describe('dataLoader', () => {
  describe('loadModel', () => {
    it('should load localized model data', async () => {
      // Test FileSystemLoader
      const fsLoader = new FileSystemLoader('');
      vi.spyOn(fsLoader as any, 'readJsonFile').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'Posts',
              modelId: 'posts',
              localization: true,
              type: 'JSON',
            },
          ];
        }
        if (path.includes('posts.json')) {
          return [];
        }
        if (path.includes('posts/index.json')) {
          return mockData.posts;
        }
        throw new Error('File not found');
      });

      const posts = await fsLoader.loadModel('posts');
      expect(posts).toEqual(mockData.posts);

      // Test FetchLoader
      const fetchLoader = new FetchLoader('');
      vi.spyOn(fetchLoader as any, 'fetchJson').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'Posts',
              modelId: 'posts',
              localization: true,
              type: 'JSON',
            },
          ];
        }
        if (path.includes('posts.json')) {
          return [];
        }
        if (path.includes('posts/index.json')) {
          return mockData.posts;
        }
        throw new Error('File not found');
      });

      const fetchedPosts = await fetchLoader.loadModel('posts');
      expect(fetchedPosts).toEqual(mockData.posts);
    });

    it('should load non-localized model data', async () => {
      // Test FileSystemLoader
      const fsLoader = new FileSystemLoader('');
      vi.spyOn(fsLoader as any, 'readJsonFile').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'Categories',
              modelId: 'categories',
              localization: false,
              type: 'JSON',
            },
          ];
        }
        if (path.includes('categories.json')) {
          return [];
        }
        if (path.includes('categories/index.json')) {
          return mockData.categories;
        }
        throw new Error('File not found');
      });

      const categories = await fsLoader.loadModel('categories');
      expect(categories).toEqual(mockData.categories);

      // Test FetchLoader
      const fetchLoader = new FetchLoader('');
      vi.spyOn(fetchLoader as any, 'fetchJson').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'Categories',
              modelId: 'categories',
              localization: false,
              type: 'JSON',
            },
          ];
        }
        if (path.includes('categories.json')) {
          return [];
        }
        if (path.includes('categories/index.json')) {
          return mockData.categories;
        }
        throw new Error('File not found');
      });

      const fetchedCategories = await fetchLoader.loadModel('categories');
      expect(fetchedCategories).toEqual(mockData.categories);
    });

    it('should handle file not found errors', async () => {
      // Test FileSystemLoader
      const fsLoader = new FileSystemLoader('');
      vi.spyOn(fsLoader as any, 'readJsonFile').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'NonExistent',
              modelId: 'nonexistent',
              localization: false,
              type: 'JSON',
            },
          ];
        }
        throw new Error('File not found');
      });

      await expect(fsLoader.loadModel('nonexistent')).rejects.toThrow('File not found');

      // Test FetchLoader
      const fetchLoader = new FetchLoader('');
      vi.spyOn(fetchLoader as any, 'fetchJson').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'NonExistent',
              modelId: 'nonexistent',
              localization: false,
              type: 'JSON',
            },
          ];
        }
        throw new Error('File not found');
      });

      await expect(fetchLoader.loadModel('nonexistent')).rejects.toThrow('File not found');
    });
  });

  describe('loadRelation', () => {
    it('should load related model data', async () => {
      // Test FileSystemLoader
      const fsLoader = new FileSystemLoader('');
      vi.spyOn(fsLoader as any, 'readJsonFile').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'Categories',
              modelId: 'categories',
              localization: false,
              type: 'JSON',
            },
          ];
        }
        if (path.includes('categories.json')) {
          return [];
        }
        if (path.includes('categories/index.json')) {
          return mockData.categories;
        }
        throw new Error('File not found');
      });

      const category = await fsLoader.loadRelation('categories', '1');
      expect(category).toEqual(mockData.categories[0]);

      // Test FetchLoader
      const fetchLoader = new FetchLoader('');
      vi.spyOn(fetchLoader as any, 'fetchJson').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'Categories',
              modelId: 'categories',
              localization: false,
              type: 'JSON',
            },
          ];
        }
        if (path.includes('categories.json')) {
          return [];
        }
        if (path.includes('categories/index.json')) {
          return mockData.categories;
        }
        throw new Error('File not found');
      });

      const fetchedCategory = await fetchLoader.loadRelation('categories', '1');
      expect(fetchedCategory).toEqual(mockData.categories[0]);
    });

    it('should return null for non-existent relation', async () => {
      // Test FileSystemLoader
      const fsLoader = new FileSystemLoader('');
      vi.spyOn(fsLoader as any, 'readJsonFile').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'Categories',
              modelId: 'categories',
              localization: false,
              type: 'JSON',
            },
          ];
        }
        if (path.includes('categories.json')) {
          return [];
        }
        if (path.includes('categories/index.json')) {
          return mockData.categories;
        }
        throw new Error('File not found');
      });

      const category = await fsLoader.loadRelation('categories', 'nonexistent');
      expect(category).toBeNull();

      // Test FetchLoader
      const fetchLoader = new FetchLoader('');
      vi.spyOn(fetchLoader as any, 'fetchJson').mockImplementation(async (...args: unknown[]) => {
        const path = args[0] as string;
        if (path.includes('metadata.json')) {
          return [
            {
              name: 'Categories',
              modelId: 'categories',
              localization: false,
              type: 'JSON',
            },
          ];
        }
        if (path.includes('categories.json')) {
          return [];
        }
        if (path.includes('categories/index.json')) {
          return mockData.categories;
        }
        throw new Error('File not found');
      });

      const fetchedCategory = await fetchLoader.loadRelation('categories', 'nonexistent');
      expect(fetchedCategory).toBeNull();
    });

    it('should handle errors when loading relations', async () => {
      // Test FileSystemLoader
      const fsLoader = new FileSystemLoader('');
      vi.spyOn(fsLoader as any, 'readJsonFile').mockRejectedValue(new Error('Failed to load relation'));
      await expect(fsLoader.loadRelation('categories', '1')).rejects.toThrow('Failed to load relation');

      // Test FetchLoader
      const fetchLoader = new FetchLoader('');
      vi.spyOn(fetchLoader as any, 'fetchJson').mockRejectedValue(new Error('Failed to load relation'));
      await expect(fetchLoader.loadRelation('categories', '1')).rejects.toThrow('Failed to load relation');
    });
  });
});
