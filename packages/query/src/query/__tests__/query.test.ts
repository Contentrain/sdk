import type { ContentrainBaseModel } from '@contentrain/types';
import type { DataLoader } from '../../loader/types';
import { describe, expect, it } from 'vitest';
import { ContentrainQuery } from '..';
import { mockData } from '../../__mocks__/data';

describe('contentrainQuery', () => {
  const mockLoader: DataLoader = {
    loadModel: async <T extends ContentrainBaseModel>(modelId: string): Promise<T[]> => {
      if (modelId === 'posts') {
        return mockData.posts as unknown as T[];
      }
      if (modelId === 'categories') {
        return mockData.categories as unknown as T[];
      }
      throw new Error(`Model ${modelId} not found`);
    },
    loadRelation: async <T extends ContentrainBaseModel>(
      relationId: string,
      id: string,
    ): Promise<T | null> => {
      if (relationId === 'category' && id) {
        const post = mockData.posts.find(p => p.ID === id);
        if (post) {
          return mockData.categories.find(c => c.ID === post.categoryId) as unknown as T;
        }
      }
      return null;
    },
  };

  it('should load model data', async () => {
    const query = new ContentrainQuery('posts', { loader: mockLoader });
    const result = await query.get();
    expect(result).toEqual(mockData.posts);
  });

  it('should filter with where equals', async () => {
    const query = new ContentrainQuery('posts', { loader: mockLoader });
    const result = await query.where('title', 'equals', 'Post 1').get();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Post 1');
  });

  it('should filter with where notEquals', async () => {
    const query = new ContentrainQuery('posts', { loader: mockLoader });
    const result = await query.where('title', 'notEquals', 'Post 1').get();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Post 2');
  });

  it('should filter with whereLike', async () => {
    const query = new ContentrainQuery('posts', { loader: mockLoader });
    const result = await query.whereLike('title', 'Post').get();
    expect(result).toHaveLength(2);
  });

  it('should filter with whereIn', async () => {
    const query = new ContentrainQuery('posts', { loader: mockLoader });
    const result = await query.whereIn('title', ['Post 1', 'Post 2']).get();
    expect(result).toHaveLength(2);
  });

  it('should sort with orderBy', async () => {
    const query = new ContentrainQuery('posts', { loader: mockLoader });
    const result = await query.orderBy('title', 'desc').get();
    expect(result[0].title).toBe('Post 2');
    expect(result[1].title).toBe('Post 1');
  });

  it('should paginate with skip and take', async () => {
    const query = new ContentrainQuery('posts', { loader: mockLoader });
    const result = await query.skip(1).take(1).get();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Post 2');
  });

  it('should handle multiple where conditions', async () => {
    const query = new ContentrainQuery('posts', { loader: mockLoader });
    const result = await query
      .where('title', 'equals', 'Post 1')
      .where('status', 'equals', 'publish')
      .get();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Post 1');
    expect(result[0].status).toBe('publish');
  });

  it('should throw error for non-existent model', async () => {
    const query = new ContentrainQuery('invalid-model', { loader: mockLoader });
    await expect(query.get()).rejects.toThrow('Model invalid-model not found');
  });
});
