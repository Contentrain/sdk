import type { IContentrainCore } from '@contentrain/core';
import type { ContentrainBaseModel, ContentrainModelMetadata } from '@contentrain/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentrainQuery } from './index';

interface TestModel extends ContentrainBaseModel {
  title: string
  description: string
  icon: string
}

describe('contentrain query', () => {
  const mockCore: IContentrainCore = {
    getModelMetadata: vi.fn(),
    getContent: vi.fn(),
    getContentById: vi.fn(),
    getAvailableCollections: vi.fn(),
    getLocale: vi.fn(),
  };

  const mockModelMetadata: ContentrainModelMetadata = {
    modelId: 'processes',
    fields: [
      {
        id: 'title',
        type: 'string',
        required: true,
        componentId: 'single-line-text',
      },
      {
        id: 'description',
        type: 'string',
        required: true,
        componentId: 'multi-line-text',
      },
      {
        id: 'icon',
        type: 'string',
        required: true,
        componentId: 'single-line-text',
      },
    ],
    localization: true,
    name: '',
    type: 'JSON',
    createdBy: '',
    isServerless: false,
  };

  const mockContent: TestModel = {
    ID: '96c64803d441',
    title: 'Research & Analysis',
    description: 'We identify project goals and client needs, conducting in-depth analysis to develop the right, scalable solutions.',
    icon: 'ri-search-eye-line',
    createdAt: '2024-09-26T13:59:00.000Z',
    updatedAt: '2024-10-14T06:46:13.160Z',
    status: 'publish',
    scheduled: false,
  };

  const mockLocalizedContent = {
    tr: {
      ID: '96c64803d441',
      title: 'Araştırma ve Analiz',
      description: 'Proje hedeflerini ve müşteri ihtiyaçlarını belirleyerek, doğru ve ölçeklenebilir çözümleri geliştirmek için analizler yapıyoruz.',
      icon: 'ri-search-eye-line',
      createdAt: '2024-09-26T13:59:00.000Z',
      updatedAt: '2024-10-18T10:14:03.251Z',
      status: 'publish',
      scheduled: false,
    },
    en: {
      ID: '96c64803d441',
      title: 'Research & Analysis',
      description: 'We identify project goals and client needs, conducting in-depth analysis to develop the right, scalable solutions.',
      icon: 'ri-search-eye-line',
      createdAt: '2024-09-26T13:59:00.000Z',
      updatedAt: '2024-10-14T06:46:13.160Z',
      status: 'publish',
      scheduled: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get content with filters', async () => {
    vi.mocked(mockCore.getModelMetadata).mockResolvedValueOnce(mockModelMetadata);
    vi.mocked(mockCore.getContent).mockResolvedValueOnce([mockContent]);

    const query = new ContentrainQuery<TestModel>(mockCore, 'processes');
    const result = await query.where('title', 'eq', 'Research & Analysis').get();

    expect(result).toEqual([mockContent]);
    expect(mockCore.getModelMetadata).toHaveBeenCalledTimes(1);
    expect(mockCore.getContent).toHaveBeenCalledTimes(1);
  });

  it('should get content with sorting', async () => {
    vi.mocked(mockCore.getModelMetadata).mockResolvedValueOnce(mockModelMetadata);
    vi.mocked(mockCore.getContent).mockResolvedValueOnce([mockContent]);

    const query = new ContentrainQuery<TestModel>(mockCore, 'processes');
    const result = await query.sort('title', 'asc').get();

    expect(result).toEqual([mockContent]);
    expect(mockCore.getModelMetadata).toHaveBeenCalledTimes(1);
    expect(mockCore.getContent).toHaveBeenCalledTimes(1);
  });

  it('should get content with pagination', async () => {
    vi.mocked(mockCore.getModelMetadata).mockResolvedValueOnce(mockModelMetadata);
    vi.mocked(mockCore.getContent).mockResolvedValueOnce([mockContent]);

    const query = new ContentrainQuery<TestModel>(mockCore, 'processes');
    const result = await query.take(1).offset(0).get();

    expect(result).toEqual([mockContent]);
    expect(mockCore.getModelMetadata).toHaveBeenCalledTimes(1);
    expect(mockCore.getContent).toHaveBeenCalledTimes(1);
  });

  it('should get first item', async () => {
    vi.mocked(mockCore.getModelMetadata).mockResolvedValueOnce(mockModelMetadata);
    vi.mocked(mockCore.getContent).mockResolvedValueOnce([mockContent]);

    const query = new ContentrainQuery<TestModel>(mockCore, 'processes');
    const result = await query.first();

    expect(result).toEqual(mockContent);
    expect(mockCore.getModelMetadata).toHaveBeenCalledTimes(1);
    expect(mockCore.getContent).toHaveBeenCalledTimes(1);
  });

  it('should handle localized content', async () => {
    vi.mocked(mockCore.getModelMetadata).mockResolvedValueOnce(mockModelMetadata);
    vi.mocked(mockCore.getContent).mockResolvedValueOnce([mockLocalizedContent]);
    vi.mocked(mockCore.getLocale).mockReturnValue('tr');

    const query = new ContentrainQuery<TestModel>(mockCore, 'processes');
    const result = await query.get();

    expect(result[0].title).toBe('Araştırma ve Analiz');
    expect(result[0].description).toBe('Proje hedeflerini ve müşteri ihtiyaçlarını belirleyerek, doğru ve ölçeklenebilir çözümleri geliştirmek için analizler yapıyoruz.');
    expect(mockCore.getModelMetadata).toHaveBeenCalledTimes(1);
    expect(mockCore.getContent).toHaveBeenCalledTimes(1);
    expect(mockCore.getLocale).toHaveBeenCalledTimes(1);
  });
});
