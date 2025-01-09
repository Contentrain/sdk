import type { BaseContentrainType } from '../../src/types/query';
import { beforeEach, describe, expect, it } from 'vitest';
import { ContentrainValidationError } from '../../src/core/errors';
import { QueryValidator } from '../../src/utils/validator';

// Model tipleri
interface IWorkCategories extends BaseContentrainType {
  name: string
  slug: string
  order: number
}

describe('query Validator', () => {
  let validator: QueryValidator;

  beforeEach(() => {
    validator = QueryValidator.getInstance();
  });

  describe('model Validation', () => {
    it('should validate valid model data', () => {
      const validData: IWorkCategories[] = [{
        ID: '1',
        name: 'Category 1',
        slug: 'category-1',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        status: 'publish',
        scheduled: false,
      }];

      expect(() => {
        validator.validateModel(
          'workcategories',
          validData,
          { strict: true },
        );
      }).not.toThrow();
    });

    it('should throw error for invalid model data', () => {
      const invalidData = [{
        ID: '1',
        title: 'Test',
      }] as any[];

      expect(() => {
        validator.validateModel(
          'workitems',
          invalidData,
          { strict: true },
        );
      }).toThrow(ContentrainValidationError);
    });

    it('should handle empty data array', () => {
      expect(() => {
        validator.validateModel(
          'workitems',
          [],
          { strict: true },
        );
      }).not.toThrow();
    });

    it('should throw error for non-array data', () => {
      expect(() => {
        validator.validateModel(
          'workitems',
          {} as any,
          { strict: true },
        );
      }).toThrow(ContentrainValidationError);
    });
  });

  describe('field Validation', () => {
    it('should validate existing fields', () => {
      const model: IWorkCategories = {
        ID: '1',
        name: 'Category 1',
        slug: 'category-1',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        status: 'publish',
        scheduled: false,
      };

      expect(() => {
        validator.validateFields(
          model,
          ['name', 'slug', 'order'],
          { strict: true },
        );
      }).not.toThrow();
    });

    it('should throw error for non-existing fields', () => {
      const model: IWorkCategories = {
        ID: '1',
        name: 'Category 1',
        slug: 'category-1',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        status: 'publish',
        scheduled: false,
      };

      expect(() => {
        validator.validateFields(
          model,
          ['nonexistent'],
          { strict: true },
        );
      }).toThrow(ContentrainValidationError);
    });

    it('should handle empty fields array', () => {
      const model: IWorkCategories = {
        ID: '1',
        name: 'Category 1',
        slug: 'category-1',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        status: 'publish',
        scheduled: false,
      };

      expect(() => {
        validator.validateFields(
          model,
          [],
          { strict: true },
        );
      }).not.toThrow();
    });
  });

  describe('relation Validation', () => {
    it('should validate valid relations', () => {
      expect(() => {
        validator.validateRelation(
          'workitems.category',
          'workitems',
          'workcategories',
          { validateRelations: true },
        );
      }).not.toThrow();
    });

    it('should skip validation when not enabled', () => {
      expect(() => {
        validator.validateRelation(
          'invalid.relation',
          'invalid',
          'invalid',
          { validateRelations: false },
        );
      }).not.toThrow();
    });
  });
});
