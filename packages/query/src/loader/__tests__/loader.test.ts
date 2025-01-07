import type { ContentrainBaseModel } from '@contentrain/types';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FetchLoader } from '../browser';
import { FileSystemLoader } from '../node';

const MOCKS_DIR = path.resolve(process.cwd(), '__mocks__/contentrain');

async function loadMockFile(filePath: string): Promise<any> {
  try {
    const fullPath = path.join(MOCKS_DIR, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content);
  }
  catch {
    return null;
  }
}

describe('browserLoader', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const filePath = url.replace('http://localhost/__mocks__/contentrain/', '');
      const data = await loadMockFile(filePath);

      if (data === null) {
        return new Response(null, { status: 404, statusText: 'Not Found' });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      });
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should load model data with locale', async () => {
    const loader = new FetchLoader('http://localhost/__mocks__/contentrain');
    const result = await loader.loadModel('faqitems', 'en');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('ID');
  });

  it('should load model schema', async () => {
    const loader = new FetchLoader('http://localhost/__mocks__/contentrain');
    const result = await loader.loadModelSchema('faqitems');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('fields');
  });

  it('should handle model not found', async () => {
    const loader = new FetchLoader('http://localhost/__mocks__/contentrain');
    await expect(loader.loadModel('non-existent')).rejects.toThrow('Failed to load model: non-existent');
  });

  it('should load relation data', async () => {
    const loader = new FetchLoader('http://localhost/__mocks__/contentrain');
    const result = await loader.loadRelation<ContentrainBaseModel>('faqitems', '0c1b5726fbf6', 'en');
    expect(result).toBeDefined();
    expect(result?.ID).toBe('0c1b5726fbf6');
  });

  it('should get model metadata', async () => {
    const loader = new FetchLoader('http://localhost/__mocks__/contentrain');
    const result = await loader.getModelMetadata('faqitems');
    expect(result).toBeDefined();
    expect(result?.modelId).toBe('faqitems');
    expect(result?.type).toBe('JSON');
  });
});

describe('nodeLoader', () => {
  it('should load model data with locale', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.loadModel('faqitems', 'en');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('ID');
  });

  it('should load model schema', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.loadModelSchema('faqitems');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('fields');
  });

  it('should handle model not found', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    await expect(loader.loadModel('non-existent')).rejects.toThrow('Failed to load model: non-existent');
  });

  it('should load relation data', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.loadRelation<ContentrainBaseModel>('faqitems', '0c1b5726fbf6', 'en');
    expect(result).toBeDefined();
    expect(result?.ID).toBe('0c1b5726fbf6');
  });

  it('should get model metadata', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.getModelMetadata('faqitems');
    expect(result).toBeDefined();
    expect(result?.modelId).toBe('faqitems');
    expect(result?.type).toBe('JSON');
  });
});
