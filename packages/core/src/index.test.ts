import type { ContentrainFileSystem, ContentrainModelMetadata } from '@contentrain/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentrainCore } from './index';

describe('contentrainCore', () => {
  const mockFs: ContentrainFileSystem = {
    readJSON: vi.fn(),
    exists: vi.fn(),
    readdir: vi.fn(),
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
  };

  const mockContent = {
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

  it('should initialize with default config', () => {
    const core = new ContentrainCore();
    expect(core.getLocale()).toBeUndefined();
  });

  it('should initialize with custom config', () => {
    const core = new ContentrainCore({ locale: 'tr' });
    expect(core.getLocale()).toBe('tr');
  });

  it('should get model metadata', async () => {
    vi.mocked(mockFs.readJSON).mockResolvedValueOnce(mockModelMetadata);
    const core = new ContentrainCore({}, mockFs);

    const metadata = await core.getModelMetadata('test');
    expect(metadata).toEqual(mockModelMetadata);
    expect(mockFs.readJSON).toHaveBeenCalledTimes(1);
  });

  it('should get content', async () => {
    vi.mocked(mockFs.exists).mockResolvedValueOnce(true);
    vi.mocked(mockFs.readdir).mockResolvedValueOnce(['1.json']);
    vi.mocked(mockFs.readJSON).mockResolvedValueOnce(mockContent);

    const core = new ContentrainCore({}, mockFs);
    const content = await core.getContent('test');

    expect(content).toEqual([mockContent]);
    expect(mockFs.exists).toHaveBeenCalledTimes(1);
    expect(mockFs.readdir).toHaveBeenCalledTimes(1);
    expect(mockFs.readJSON).toHaveBeenCalledTimes(1);
  });

  it('should get content by id', async () => {
    vi.mocked(mockFs.readJSON).mockResolvedValueOnce(mockContent);
    const core = new ContentrainCore({}, mockFs);

    const content = await core.getContentById('test', '1');
    expect(content).toEqual(mockContent);
    expect(mockFs.readJSON).toHaveBeenCalledTimes(1);
  });

  it('should get available collections', async () => {
    vi.mocked(mockFs.readdir).mockResolvedValueOnce(['test.model.json']);
    const core = new ContentrainCore({}, mockFs);

    const collections = await core.getAvailableCollections();
    expect(collections).toEqual(['test']);
    expect(mockFs.readdir).toHaveBeenCalledTimes(1);
  });

  it('should handle file system errors', async () => {
    vi.mocked(mockFs.readJSON).mockRejectedValueOnce(new Error('Failed to read JSON file'));
    const core = new ContentrainCore({}, mockFs);

    await expect(core.getModelMetadata('test')).rejects.toThrow('Failed to read JSON file');
  });

  it('should handle localized content', async () => {
    const core = new ContentrainCore({ locale: 'tr' }, mockFs);
    vi.mocked(mockFs.exists).mockResolvedValueOnce(true);
    vi.mocked(mockFs.readdir).mockResolvedValueOnce(['1.json']);
    vi.mocked(mockFs.readJSON).mockResolvedValueOnce(mockLocalizedContent);

    interface ProcessModel {
      title: string
      description: string
      icon: string
      ID: string
      createdAt: string
      updatedAt: string
      status: string
      scheduled: boolean
    }

    const content = await core.getContent<ProcessModel>('processes');

    expect(content[0]?.title).toBe('Araştırma ve Analiz');
    expect(content[0]?.description).toBe('Proje hedeflerini ve müşteri ihtiyaçlarını belirleyerek, doğru ve ölçeklenebilir çözümleri geliştirmek için analizler yapıyoruz.');
  });
});
