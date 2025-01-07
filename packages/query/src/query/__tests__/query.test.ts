import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter, RuntimeResult } from '../../runtime/types';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createQuery } from '../index';

interface FAQ extends ContentrainBaseModel {
  question: string
  answer: string
  order: number
  categoryId?: string
  category?: any
}

async function loadMockData(modelId: string, locale?: string): Promise<any[]> {
  try {
    const filePath = path.join(process.cwd(), '__mocks__/contentrain', modelId, `${locale || 'en'}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
  catch {
    return [];
  }
}

describe('query Builder', () => {
  const mockRuntime: RuntimeAdapter = {
    loadModel: vi.fn().mockImplementation(async (modelId: string, options?: { locale?: string }): Promise<RuntimeResult> => {
      const data = await loadMockData(modelId, options?.locale);
      return {
        data,
        metadata: {
          total: data.length,
          cached: false,
          buildInfo: {
            timestamp: Date.now(),
            version: '1.0.0',
          },
        },
      };
    }),
    loadRelation: vi.fn().mockImplementation(async (modelId: string, id: string, options?: { locale?: string }): Promise<ContentrainBaseModel | null> => {
      const items = await loadMockData(modelId, options?.locale);
      return items.find((item: ContentrainBaseModel) => item.ID === id) || null;
    }),
    initialize: vi.fn(),
    cleanup: vi.fn(),
    invalidateCache: vi.fn(),
  };

  it('should create a query instance', () => {
    const query = createQuery(mockRuntime);
    expect(query).toBeDefined();
  });

  it('should fetch all items from a model', async () => {
    const query = createQuery<FAQ>(mockRuntime);
    const results = await query.from('faqitems').get();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('question');
    expect(results[0]).toHaveProperty('answer');
  });

  it('should filter items using where clause', async () => {
    const query = createQuery<FAQ>(mockRuntime);
    const results = await query
      .from('faqitems')
      .where('order', 'eq', 1)
      .get();

    expect(results.length).toBeGreaterThan(0);
    results.forEach((item) => {
      expect(item.order).toBe(1);
    });
  });

  it('should sort items using orderBy', async () => {
    const query = createQuery<FAQ>(mockRuntime);
    const results = await query
      .from('faqitems')
      .orderBy('order', 'asc')
      .get();

    for (let i = 1; i < results.length; i++) {
      expect(results[i].order).toBeGreaterThanOrEqual(results[i - 1].order);
    }
  });

  it('should paginate results', async () => {
    const query = createQuery<FAQ>(mockRuntime);
    const pageSize = 2;
    const results = await query
      .from('faqitems')
      .paginate(1, pageSize)
      .get();

    expect(results.length).toBeLessThanOrEqual(pageSize);
  });

  it('should load relations', async () => {
    const query = createQuery<FAQ>(mockRuntime);
    const results = await query
      .from('faqitems')
      .with('category')
      .get();

    results.forEach((item) => {
      if (item.categoryId) {
        expect(item.category).toBeDefined();
      }
    });
  });

  it('should handle locale fallback', async () => {
    const query = createQuery<FAQ>(mockRuntime, {
      locale: 'tr',
      fallbackLocale: 'en',
      fallbackStrategy: 'loose',
    });

    const results = await query.from('faqitems').get();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].question).toBeDefined();
  });

  it('should count items', async () => {
    const query = createQuery<FAQ>(mockRuntime);
    const count = await query.from('faqitems').count();
    expect(count).toBeGreaterThan(0);
  });

  it('should get first item', async () => {
    const query = createQuery<FAQ>(mockRuntime);
    const item = await query.from('faqitems').first();
    expect(item).toBeDefined();
    expect(item?.question).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const errorRuntime: RuntimeAdapter = {
      ...mockRuntime,
      loadModel: vi.fn().mockRejectedValue(new Error('Failed to load model')),
    };

    const query = createQuery(errorRuntime);
    await expect(query.from('invalid').get()).rejects.toThrow();
  });
});
