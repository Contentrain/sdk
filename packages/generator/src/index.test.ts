import type { ContentrainModelMetadata } from '@contentrain/types';
import { describe, expect, it } from 'vitest';
import { ContentrainGenerator } from './index';

describe('contentrain generator', () => {
  it('should initialize generator', () => {
    const generator = new ContentrainGenerator();
    expect(generator).toBeDefined();
  });

  it('should generate types for all models', async () => {
    const generator = new ContentrainGenerator();

    const models: ContentrainModelMetadata[] = [
      {
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
            componentId: 'single-line-text',
          },
          {
            id: 'icon',
            type: 'string',
            required: true,
            componentId: 'single-line-text',
          },
        ],
        localization: true,
      },
      {
        modelId: 'faq-items',
        fields: [
          {
            id: 'question',
            type: 'string',
            required: true,
            componentId: 'single-line-text',
          },
          {
            id: 'answer',
            type: 'string',
            required: true,
            componentId: 'multi-line-text',
          },
          {
            id: 'order',
            type: 'number',
            required: true,
            componentId: 'integer',
          },
        ],
        localization: true,
      },
      {
        modelId: 'work-items',
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
            id: 'image',
            type: 'media',
            required: false,
            componentId: 'media',
          },
          {
            id: 'category',
            type: 'relation',
            required: true,
            componentId: 'one-to-one',
            relation: {
              model: 'categories',
              type: 'one-to-one',
            },
          },
        ],
        localization: true,
      },
    ];

    const result = await generator.generate(models);

    // Base model kontrolleri
    expect(result).toContain('export interface ContentrainBaseModel');
    expect(result).toContain('ID: string');
    expect(result).toContain('createdAt: string');
    expect(result).toContain('updatedAt: string');
    expect(result).toContain('status: \'draft\' | \'changed\' | \'publish\'');
    expect(result).toContain('scheduled: boolean');

    // Processes model kontrolleri
    expect(result).toContain('export interface Processes extends ContentrainBaseModel');
    expect(result).toContain('title: string');
    expect(result).toContain('description: string');
    expect(result).toContain('icon: string');

    // FAQ Items model kontrolleri
    expect(result).toContain('export interface Faqitems extends ContentrainBaseModel');
    expect(result).toContain('question: string');
    expect(result).toContain('answer: string');
    expect(result).toContain('order: number');

    // Work Items model kontrolleri
    expect(result).toContain('export interface Workitems extends ContentrainBaseModel');
    expect(result).toContain('title: string');
    expect(result).toContain('description: string');
    expect(result).toContain('image?: string');
    expect(result).toContain('category: string');

    // Type map kontrolü
    expect(result).toContain('export type ContentrainTypeMap');
    expect(result).toContain('\'processes\': Processes');
    expect(result).toContain('\'faq-items\': Faqitems');
    expect(result).toContain('\'work-items\': Workitems');
  });

  it('should handle different field types correctly', async () => {
    const generator = new ContentrainGenerator();

    const models: ContentrainModelMetadata[] = [
      {
        modelId: 'test-model',
        fields: [
          {
            id: 'stringField',
            type: 'string',
            required: true,
            componentId: 'single-line-text',
          },
          {
            id: 'numberField',
            type: 'number',
            required: true,
            componentId: 'integer',
          },
          {
            id: 'booleanField',
            type: 'boolean',
            required: true,
            componentId: 'checkbox',
          },
          {
            id: 'dateField',
            type: 'date',
            required: true,
            componentId: 'date',
          },
          {
            id: 'mediaField',
            type: 'media',
            required: false,
            componentId: 'media',
          },
          {
            id: 'oneToOneField',
            type: 'relation',
            required: true,
            componentId: 'one-to-one',
            relation: {
              model: 'related',
              type: 'one-to-one',
            },
          },
          {
            id: 'oneToManyField',
            type: 'relation',
            required: true,
            componentId: 'one-to-many',
            relation: {
              model: 'related',
              type: 'one-to-many',
            },
          },
        ],
        localization: true,
      },
    ];

    const result = await generator.generate(models);

    expect(result).toContain('stringField: string');
    expect(result).toContain('numberField: number');
    expect(result).toContain('booleanField: boolean');
    expect(result).toContain('dateField: string');
    expect(result).toContain('mediaField?: string');
    expect(result).toContain('oneToOneField: string');
    expect(result).toContain('oneToManyField: string[]');
  });

  it('should handle model names with hyphens correctly', async () => {
    const generator = new ContentrainGenerator();

    const models: ContentrainModelMetadata[] = [
      {
        modelId: 'my-test-model',
        fields: [
          {
            id: 'title',
            type: 'string',
            required: true,
            componentId: 'single-line-text',
          },
        ],
        localization: true,
      },
    ];

    const result = await generator.generate(models);

    expect(result).toContain('export interface Mytestmodel extends ContentrainBaseModel');
    expect(result).toContain('\'my-test-model\': Mytestmodel');
  });
});
