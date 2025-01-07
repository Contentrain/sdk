import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeOptions } from '../types';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRuntime } from '../browser';
import { NodeRuntime } from '../node';

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

describe('runtime Adapters', () => {
  describe('nodeRuntime', () => {
    let runtime: NodeRuntime;
    const nodeOptions: RuntimeOptions = {
      basePath: path.join(process.cwd(), '__mocks__/contentrain'),
      cache: { strategy: 'memory' },
    };

    beforeEach(async () => {
      runtime = new NodeRuntime();
      await runtime.initialize(nodeOptions);
    });

    afterEach(async () => {
      await runtime.cleanup();
    });

    it('should load model data', async () => {
      const result = await runtime.loadModel<FAQ>('faqitems', { locale: 'en' });
      const mockData = await loadMockData('faqitems', 'en');

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(mockData.length);
      expect(result.metadata.total).toBe(mockData.length);
      expect(result.metadata.cached).toBe(false);
      expect(result.metadata.buildInfo).toBeDefined();
    });

    it('should load model data with Turkish locale', async () => {
      const result = await runtime.loadModel<FAQ>('faqitems', { locale: 'tr' });
      const mockData = await loadMockData('faqitems', 'tr');

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(mockData.length);
      if (mockData.length > 0) {
        expect(result.data[0].question).toBe(mockData[0].question);
      }
    });

    it('should load relation data', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const itemWithCategory = mockData.find(item => item.categoryId);

      if (itemWithCategory) {
        const relation = await runtime.loadRelation('workcategories', itemWithCategory.categoryId, { locale: 'en' });
        expect(relation).toBeDefined();
        expect(relation?.ID).toBe(itemWithCategory.categoryId);
      }
    });

    it('should handle invalid model gracefully', async () => {
      const result = await runtime.loadModel('invalid', { locale: 'en' });
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.metadata.total).toBe(0);
      expect(result.metadata.cached).toBe(false);
      expect(result.metadata.buildInfo).toBeDefined();
    });
  });

  describe('browserRuntime', () => {
    let runtime: BrowserRuntime;
    const browserOptions: RuntimeOptions = {
      basePath: 'http://localhost/__mocks__/contentrain',
      cache: { strategy: 'memory' },
    };

    beforeEach(async () => {
      runtime = new BrowserRuntime();
      await runtime.initialize(browserOptions);
    });

    afterEach(async () => {
      await runtime.cleanup();
    });

    it('should handle model loading', async () => {
      const mockData = await loadMockData('faqitems', 'en');
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => mockData,
        } as Response;
      });

      const result = await runtime.loadModel<FAQ>('faqitems', { locale: 'en' });
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(mockData.length);
      expect(result.metadata.total).toBe(mockData.length);
      expect(result.metadata.cached).toBe(false);
      expect(result.metadata.buildInfo).toBeDefined();

      fetchSpy.mockRestore();
    });

    it('should handle model loading errors', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return {
          ok: false,
          status: 404,
        } as Response;
      });

      const result = await runtime.loadModel<FAQ>('faqitems', { locale: 'en' });
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.metadata.total).toBe(0);
      expect(result.metadata.cached).toBe(false);
      expect(result.metadata.buildInfo).toBeDefined();
      expect(result.metadata.buildInfo?.error).toBe('HTTP error! status: 404');

      fetchSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        throw new Error('Network error');
      });

      const result = await runtime.loadModel<FAQ>('faqitems', { locale: 'en' });
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.metadata.total).toBe(0);
      expect(result.metadata.cached).toBe(false);
      expect(result.metadata.buildInfo).toBeDefined();
      expect(result.metadata.buildInfo?.error).toBe('Network error');

      fetchSpy.mockRestore();
    });
  });
});
