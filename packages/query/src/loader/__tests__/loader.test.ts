import type { ContentrainBaseModel } from '@contentrain/types';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FetchLoader } from '../browser';
import { FileSystemLoader } from '../node';

const MOCKS_DIR = path.resolve(process.cwd(), '__mocks__/contentrain');

describe('browserLoader', () => {
  it('should load direct model data (modelId.json)', async () => {
    const loader = new FetchLoader(`file://${MOCKS_DIR}`);
    const result = await loader.loadModel('sociallinks');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should load nested model data (modelId/modelId.json)', async () => {
    const loader = new FetchLoader(`file://${MOCKS_DIR}`);
    const result = await loader.loadModel('references');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle model not found', async () => {
    const loader = new FetchLoader(`file://${MOCKS_DIR}`);
    await expect(loader.loadModel('non-existent')).rejects.toThrow();
  });

  it('should load model data with locale', async () => {
    const loader = new FetchLoader(`file://${MOCKS_DIR}`);
    const result = await loader.loadModel('faqitems', 'tr');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should load relation data', async () => {
    const loader = new FetchLoader(`file://${MOCKS_DIR}`);
    const result = await loader.loadRelation<ContentrainBaseModel>('workcategories', '59cbdac46c1e');
    expect(result).toBeDefined();
    expect(result?.ID).toBe('59cbdac46c1e');
  });

  it('should get model metadata', async () => {
    const loader = new FetchLoader(`file://${MOCKS_DIR}`);
    const result = await loader.getModelMetadata('faqitems');
    expect(result).toBeDefined();
    expect(result?.modelId).toBe('faqitems');
  });
});

describe('nodeLoader', () => {
  it('should load direct model data (modelId.json)', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.loadModel('sociallinks');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should load nested model data (modelId/modelId.json)', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.loadModel('references');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle model not found', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    await expect(loader.loadModel('non-existent')).rejects.toThrow();
  });

  it('should load model data with locale', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.loadModel('faqitems', 'tr');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should load relation data', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.loadRelation<ContentrainBaseModel>('workcategories', '59cbdac46c1e');
    expect(result).toBeDefined();
    expect(result?.ID).toBe('59cbdac46c1e');
  });

  it('should get model metadata', async () => {
    const loader = new FileSystemLoader(MOCKS_DIR);
    const result = await loader.getModelMetadata('faqitems');
    expect(result).toBeDefined();
    expect(result?.modelId).toBe('faqitems');
  });
});
