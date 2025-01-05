import type {
  ContentrainBaseModel,
  ContentrainConfig,
  ContentrainError,
  ContentrainField,
  ContentrainModelMetadata,
  ContentrainRelation,
  FilterCondition,
  SortCondition,
  WithRelation,
} from './index';
import { describe, expect, it } from 'vitest';

describe('contentrain types', () => {
  it('should have correct ContentrainBaseModel type', () => {
    type TestModel = ContentrainBaseModel & {
      title: string
      description: string
      icon: string
    };

    const model: TestModel = {
      ID: '96c64803d441',
      title: 'Research & Analysis',
      description: 'We identify project goals and client needs, conducting in-depth analysis to develop the right, scalable solutions.',
      icon: 'ri-search-eye-line',
      createdAt: '2024-09-26T13:59:00.000Z',
      updatedAt: '2024-10-14T06:46:13.160Z',
      status: 'publish',
      scheduled: false,
    };

    expect(typeof model.ID).toBe('string');
    expect(typeof model.title).toBe('string');
    expect(typeof model.description).toBe('string');
    expect(typeof model.icon).toBe('string');
    expect(typeof model.createdAt).toBe('string');
    expect(typeof model.updatedAt).toBe('string');
    expect(['publish', 'draft', 'changed']).toContain(model.status);
    expect(typeof model.scheduled).toBe('boolean');
  });

  it('should have correct ContentrainConfig type', () => {
    const config: ContentrainConfig = {
      contentPath: 'contentrain',
      modelsPath: 'contentrain/models',
      assetsPath: 'contentrain/assets.json',
      locale: 'tr',
    };

    expect(typeof config.contentPath).toBe('string');
    expect(typeof config.modelsPath).toBe('string');
    expect(typeof config.assetsPath).toBe('string');
    expect(typeof config.locale).toBe('string');
  });

  it('should have correct ContentrainField type', () => {
    const field: ContentrainField = {
      id: 'title',
      type: 'string',
      required: true,
      componentId: 'single-line-text',
    };

    expect(typeof field.id).toBe('string');
    expect(typeof field.type).toBe('string');
    expect(typeof field.required).toBe('boolean');
    expect(typeof field.componentId).toBe('string');
  });

  it('should have correct ContentrainRelation type', () => {
    const relation: ContentrainRelation = {
      model: 'posts',
      multiple: true,
      type: 'one-to-many',
    };

    expect(typeof relation.model).toBe('string');
    expect(typeof relation.multiple).toBe('boolean');
    expect(['one-to-one', 'one-to-many']).toContain(relation.type);
  });

  it('should have correct ContentrainModelMetadata type', () => {
    const metadata: ContentrainModelMetadata = {
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

    expect(typeof metadata.modelId).toBe('string');
    expect(Array.isArray(metadata.fields)).toBe(true);
    expect(typeof metadata.localization).toBe('boolean');
  });

  it('should have correct ContentrainError type', () => {
    const error: ContentrainError = {
      name: 'ContentrainError',
      message: 'Failed to read processes model metadata',
      code: 'MODEL_METADATA_ERROR',
      path: '/contentrain/models/processes.json',
    } as ContentrainError;

    expect(typeof error.name).toBe('string');
    expect(typeof error.message).toBe('string');
    expect(typeof error.code).toBe('string');
    expect(typeof error.path).toBe('string');
  });

  it('should have correct FilterCondition type', () => {
    type TestModel = ContentrainBaseModel & {
      title: string
      description: string
      icon: string
    };

    const filter: FilterCondition<TestModel> = {
      field: 'title',
      operator: 'eq',
      value: 'Research & Analysis',
    };

    expect(typeof filter.field).toBe('string');
    expect(typeof filter.operator).toBe('string');
    expect(typeof filter.value).toBe('string');
  });

  it('should have correct SortCondition type', () => {
    type TestModel = ContentrainBaseModel & {
      title: string
      description: string
      icon: string
    };

    const sort: SortCondition<TestModel> = {
      field: 'title',
      direction: 'asc',
    };

    expect(typeof sort.field).toBe('string');
    expect(['asc', 'desc']).toContain(sort.direction);
  });

  it('should have correct WithRelation type', () => {
    type TestModel = ContentrainBaseModel & {
      title: string
      author: string
      tags: string[]
    };

    type TestModelWithRelations = WithRelation<TestModel, 'author' | 'tags'>;

    const model: TestModelWithRelations = {
      'ID': '1',
      'title': 'Test',
      'author': 'author-1',
      'tags': ['tag-1', 'tag-2'],
      'createdAt': '2024-01-01T00:00:00.000Z',
      'updatedAt': '2024-01-01T00:00:00.000Z',
      'status': 'publish',
      'scheduled': false,
      'author-data': {
        ID: 'author-1',
        name: 'John Doe',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'publish',
        scheduled: false,
      },
      'tags-data': [
        {
          ID: 'tag-1',
          name: 'Test',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          status: 'publish',
          scheduled: false,
        },
        {
          ID: 'tag-2',
          name: 'Example',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          status: 'publish',
          scheduled: false,
        },
      ],
    };

    expect(typeof model['author-data']).toBe('object');
    expect(Array.isArray(model['tags-data'])).toBe(true);
    expect(model['author-data']?.ID).toBe('author-1');
    expect(model['tags-data']?.[0]?.ID).toBe('tag-1');
  });
});
