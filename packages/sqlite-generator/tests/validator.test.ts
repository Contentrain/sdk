import type { ContentItem, ModelField, ModelMetadata } from '../src/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { ContentValidator } from '../src/core/validator/content';
import { ModelValidator } from '../src/core/validator/model';

describe('validator', () => {
  describe('contentValidator', () => {
    let validator: ContentValidator;

    beforeEach(() => {
      validator = new ContentValidator();
    });

    describe('system Fields', () => {
      it('should validate required system fields', async () => {
        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, []);
        expect(result[0].ID).toBe('123');
        expect(result[0].status).toBe('publish');
        expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
        expect(result[0].updatedAt).toBe('2024-01-01T00:00:00.000Z');
      });
    });

    describe('field Types', () => {
      it('should validate string fields', async () => {
        const fields: ModelField[] = [{
          name: 'Title',
          fieldId: 'title',
          modelId: 'test',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {
            'required-field': { value: true },
          },
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          title: 'Test Title',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, fields);
        expect(result[0].title).toBe('Test Title');
      });

      it('should validate number fields', async () => {
        const fields: ModelField[] = [{
          name: 'Rating',
          fieldId: 'rating',
          modelId: 'test',
          componentId: 'integer',
          fieldType: 'number',
          validations: {
            'required-field': { value: true },
          },
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          rating: 5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, fields);
        expect(result[0].rating).toBe(5);
      });

      it('should validate array fields', async () => {
        const fields: ModelField[] = [{
          name: 'Tags',
          fieldId: 'tags',
          modelId: 'test',
          componentId: 'json',
          fieldType: 'array',
          validations: {},
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          tags: ['tag1', 'tag2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, fields);
        expect(result[0].tags).toEqual(['tag1', 'tag2']);
      });

      it('should validate media fields', async () => {
        const fields: ModelField[] = [{
          name: 'Image',
          fieldId: 'image',
          modelId: 'test',
          componentId: 'media',
          fieldType: 'media',
          validations: {},
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          image: '/path/to/image.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, fields);
        expect(result[0].image).toBe('/path/to/image.jpg');
      });

      it('should validate one-to-one relation fields', async () => {
        const fields: ModelField[] = [{
          name: 'Category',
          fieldId: 'categoryId',
          modelId: 'test',
          componentId: 'one-to-one',
          fieldType: 'relation',
          validations: {},
          options: {
            reference: {
              value: true,
              form: {
                reference: {
                  value: 'categories',
                },
              },
            },
          },
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          categoryId: 'category-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, fields);
        expect(result[0].categoryId).toBe('category-1');
      });

      it('should validate one-to-many relation fields', async () => {
        const fields: ModelField[] = [{
          name: 'Tags',
          fieldId: 'tagIds',
          modelId: 'test',
          componentId: 'one-to-many',
          fieldType: 'relation',
          validations: {},
          options: {
            reference: {
              value: true,
              form: {
                reference: {
                  value: 'tags',
                },
              },
            },
          },
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          tagIds: ['tag-1', 'tag-2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, fields);
        expect(result[0].tagIds).toEqual(['tag-1', 'tag-2']);
      });

      it('should validate boolean fields', async () => {
        const fields: ModelField[] = [{
          name: 'IsActive',
          fieldId: 'isActive',
          modelId: 'test',
          componentId: 'checkbox',
          fieldType: 'boolean',
          validations: {},
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, fields);
        expect(result[0].isActive).toBe(true);
      });

      it('should validate date fields', async () => {
        const fields: ModelField[] = [{
          name: 'EventDate',
          fieldId: 'eventDate',
          modelId: 'test',
          componentId: 'date',
          fieldType: 'date',
          validations: {},
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          eventDate: '2024-01-15',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateContent(content, fields);
        expect(result[0].eventDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('error Cases', () => {
      it('should throw error for invalid field type', async () => {
        const fields: ModelField[] = [{
          name: 'Rating',
          fieldId: 'rating',
          modelId: 'test',
          componentId: 'integer',
          fieldType: 'number',
          validations: {
            'required-field': { value: true },
          },
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          rating: 'invalid' as any,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        await expect(validator.validateContent(content, fields)).rejects.toThrow('must be a number');
      });

      it('should throw error for invalid array field', async () => {
        const fields: ModelField[] = [{
          name: 'Tags',
          fieldId: 'tags',
          modelId: 'test',
          componentId: 'json',
          fieldType: 'array',
          validations: {},
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          tags: 'not-an-array' as any,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        await expect(validator.validateContent(content, fields)).rejects.toThrow('must be an array');
      });

      it('should throw error for invalid media field', async () => {
        const fields: ModelField[] = [{
          name: 'Image',
          fieldId: 'image',
          modelId: 'test',
          componentId: 'media',
          fieldType: 'media',
          validations: {},
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          image: {} as any,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        await expect(validator.validateContent(content, fields)).rejects.toThrow('must be a string');
      });

      it('should throw error for invalid relation field', async () => {
        const fields: ModelField[] = [{
          name: 'Tags',
          fieldId: 'tagIds',
          modelId: 'test',
          componentId: 'one-to-many',
          fieldType: 'relation',
          validations: {},
          options: {
            reference: {
              value: true,
              form: {
                reference: {
                  value: 'tags',
                },
              },
            },
          },
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          tagIds: [1, 2] as any,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        await expect(validator.validateContent(content, fields)).rejects.toThrow('must contain only string IDs');
      });
    });

    describe('validation Rules', () => {
      it('should validate required fields', async () => {
        const fields: ModelField[] = [{
          name: 'Title',
          fieldId: 'title',
          modelId: 'test',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {
            'required-field': { value: true },
          },
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        await expect(validator.validateContent(content, fields)).rejects.toThrow('is required');
      });

      it('should validate unique fields', async () => {
        const fields: ModelField[] = [{
          name: 'Code',
          fieldId: 'code',
          modelId: 'test',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {
            'unique-field': { value: true },
          },
          options: {},
        }];

        const content: ContentItem[] = [
          {
            ID: '123',
            status: 'publish',
            code: 'CODE1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            ID: '124',
            status: 'publish',
            code: 'CODE1', // Duplicate code
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ];

        await expect(validator.validateContent(content, fields)).rejects.toThrow('must be unique');
      });

      it('should validate input range', async () => {
        const fields: ModelField[] = [{
          name: 'Rating',
          fieldId: 'rating',
          modelId: 'test',
          componentId: 'integer',
          fieldType: 'number',
          validations: {
            'input-range-field': {
              value: {
                min: 1,
                max: 5,
              },
            },
          },
          options: {},
        }];

        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          rating: 6, // Out of range
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        await expect(validator.validateContent(content, fields)).rejects.toThrow('must be between 1 and 5');
      });
    });

    describe('localization', () => {
      it('should validate language code', async () => {
        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        await expect(validator.validateLocalizedContent(content, [], 'invalid')).rejects.toThrow('Language code must be a valid 2-letter code');
      });

      it('should accept valid language code', async () => {
        const content: ContentItem[] = [{
          ID: '123',
          status: 'publish',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }];

        const result = await validator.validateLocalizedContent(content, [], 'tr');
        expect(result).toBeDefined();
      });
    });
  });

  describe('modelValidator', () => {
    let validator: ModelValidator;

    beforeEach(() => {
      validator = new ModelValidator();
    });

    describe('metadata Validation', () => {
      it('should validate valid metadata', async () => {
        const metadata: ModelMetadata[] = [{
          name: 'ServicesItems',
          modelId: 'services-items',
          localization: true,
          type: 'JSON',
          createdBy: 'user',
          isServerless: false,
        }];

        await expect(validator.validateMetadata(metadata)).resolves.toBeUndefined();
      });

      it('should throw error for duplicate model IDs', async () => {
        const metadata: ModelMetadata[] = [
          {
            name: 'ServicesItems',
            modelId: 'services-items',
            localization: true,
            type: 'JSON',
            createdBy: 'user',
            isServerless: false,
          },
          {
            name: 'ServicesList',
            modelId: 'services-items',
            localization: true,
            type: 'JSON',
            createdBy: 'user',
            isServerless: false,
          },
        ];

        await expect(validator.validateMetadata(metadata)).rejects.toThrow('Model IDs must be unique');
      });

      it('should throw error for invalid model name', async () => {
        const metadata: ModelMetadata[] = [{
          name: 'servicesItems',
          modelId: 'services-items',
          localization: true,
          type: 'JSON',
          createdBy: 'user',
          isServerless: false,
        }];

        await expect(validator.validateMetadata(metadata)).rejects.toThrow('must be in PascalCase');
      });

      it('should throw error for invalid model ID', async () => {
        const metadata: ModelMetadata[] = [{
          name: 'ServicesItems',
          modelId: 'ServicesItems',
          localization: true,
          type: 'JSON',
          createdBy: 'user',
          isServerless: false,
        }];

        await expect(validator.validateMetadata(metadata)).rejects.toThrow('must be in kebab-case');
      });

      it('should validate empty metadata array', async () => {
        const metadata: ModelMetadata[] = [];
        await expect(validator.validateMetadata(metadata)).resolves.toBeUndefined();
      });
    });

    describe('fields Validation', () => {
      it('should validate valid fields', async () => {
        const fields: ModelField[] = [{
          name: 'Title',
          fieldId: 'title',
          modelId: 'services-items',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
        }];

        await expect(validator.validateFields(fields)).resolves.toBeUndefined();
      });

      it('should throw error for duplicate field IDs', async () => {
        const fields: ModelField[] = [
          {
            name: 'Title',
            fieldId: 'title',
            modelId: 'services-items',
            componentId: 'single-line-text',
            fieldType: 'string',
            validations: {},
            options: {},
          },
          {
            name: 'Title 2',
            fieldId: 'title',
            modelId: 'services-items',
            componentId: 'single-line-text',
            fieldType: 'string',
            validations: {},
            options: {},
          },
        ];

        await expect(validator.validateFields(fields)).rejects.toThrow('Field IDs must be unique');
      });

      it('should throw error for invalid field ID', async () => {
        const fields: ModelField[] = [{
          name: 'Title',
          fieldId: 'Title',
          modelId: 'services-items',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
        }];

        await expect(validator.validateFields(fields)).rejects.toThrow('must be in camelCase');
      });

      it('should validate relation fields with reference', async () => {
        const fields: ModelField[] = [{
          name: 'Category',
          fieldId: 'categoryId',
          modelId: 'services-items',
          componentId: 'one-to-one',
          fieldType: 'relation',
          validations: {},
          options: {
            reference: {
              value: true,
              form: {
                reference: {
                  value: 'categories',
                },
              },
            },
          },
        }];

        await expect(validator.validateFields(fields)).resolves.toBeUndefined();
      });

      it('should throw error for relation field without reference', async () => {
        const fields: ModelField[] = [{
          name: 'Category',
          fieldId: 'categoryId',
          modelId: 'services-items',
          componentId: 'one-to-one',
          fieldType: 'relation',
          validations: {},
          options: {},
        }];

        await expect(validator.validateFields(fields)).rejects.toThrow('Reference model is required');
      });

      it('should throw error for invalid relation component', async () => {
        const fields: ModelField[] = [{
          name: 'Category',
          fieldId: 'categoryId',
          modelId: 'services-items',
          componentId: 'single-line-text',
          fieldType: 'relation',
          validations: {},
          options: {
            reference: {
              value: true,
              form: {
                reference: {
                  value: 'categories',
                },
              },
            },
          },
        }];

        await expect(validator.validateFields(fields)).rejects.toThrow('not valid for relation type');
      });

      it('should validate empty fields array', async () => {
        const fields: ModelField[] = [];
        await expect(validator.validateFields(fields)).resolves.toBeUndefined();
      });

      it('should validate field length rules', async () => {
        const fields: ModelField[] = [{
          name: 'Title',
          fieldId: 'title',
          modelId: 'services-items',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {
            'input-range-field': {
              value: {
                min: 3,
                max: 50,
              },
            },
          },
          options: {},
        }];

        await expect(validator.validateFields(fields)).resolves.toBeUndefined();
      });

      it('should validate component and field type compatibility', async () => {
        const fields: ModelField[] = [{
          name: 'Rating',
          fieldId: 'rating',
          modelId: 'services-items',
          componentId: 'integer',
          fieldType: 'string', // String type - incompatible
          validations: {},
          options: {},
        }];

        await expect(validator.validateFields(fields)).rejects.toThrow('Component integer is not compatible with field type string');
      });

      it('should validate field options', async () => {
        const fields: ModelField[] = [{
          name: 'Category',
          fieldId: 'categoryId',
          modelId: 'services-items',
          componentId: 'one-to-one',
          fieldType: 'relation',
          validations: {},
          options: {
            reference: {
              value: true,
              form: {
                reference: {
                  value: '', // Empty reference value
                },
              },
            },
          },
        }];

        await expect(validator.validateFields(fields)).rejects.toThrow('Reference model is required for relation field "categoryId"');
      });

      it('should validate title field option', async () => {
        const fields: ModelField[] = [{
          name: 'Title',
          fieldId: 'title',
          modelId: 'services-items',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {
            'title-field': {
              value: true,
            },
          },
        }];

        await expect(validator.validateFields(fields)).resolves.toBeUndefined();
      });

      it('should validate default value option', async () => {
        const fields: ModelField[] = [{
          name: 'Status',
          fieldId: 'status',
          modelId: 'services-items',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {
            'default-value': {
              value: true,
              form: {
                value: {
                  value: 'active',
                },
              },
            },
          },
        }];

        await expect(validator.validateFields(fields)).resolves.toBeUndefined();
      });
    });
  });
});
