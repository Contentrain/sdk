import type { ModelField } from '../src/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseConnection } from '../src/core/database/connection';
import { SchemaManager } from '../src/core/database/schema';
import { IndexOptimizer } from '../src/core/optimizer';
import { QueryOptimizer } from '../src/core/optimizer/query';

describe('optimizer', () => {
  let connection: DatabaseConnection;
  let schema: SchemaManager;
  let indexOptimizer: IndexOptimizer;
  let queryOptimizer: QueryOptimizer;
  const dbPath = ':memory:';

  beforeEach(async () => {
    connection = new DatabaseConnection();
    const db = await connection.createDatabase(dbPath);
    schema = new SchemaManager(db);
    indexOptimizer = new IndexOptimizer(db);
    queryOptimizer = new QueryOptimizer(db);
  });

  afterEach(() => {
    connection.close();
  });

  describe('index', () => {
    it('should create basic indexes', async () => {
      const fields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {},
        options: {},
      }];
      schema.createMainTable('services', fields);

      expect(() => indexOptimizer.createIndexes('services', fields)).not.toThrow();
    });

    it('should create unique indexes', async () => {
      const fields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {
          'unique-field': { value: true },
        },
        options: {},
      }];
      schema.createMainTable('services', fields);

      expect(() => indexOptimizer.createIndexes('services', fields)).not.toThrow();
    });

    it('should create relation indexes', async () => {
      const fields: ModelField[] = [{
        name: 'Category',
        fieldId: 'categoryId',
        modelId: 'services',
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

      schema.createMainTable('services', []);
      schema.createMainTable('categories', []);
      schema.createRelationTable('services', fields[0], 'categories');

      expect(() => indexOptimizer.createIndexes('services', fields)).not.toThrow();
    });

    it('should create localization indexes', async () => {
      const fields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {},
        options: {},
      }];

      schema.createMainTable('services', fields);
      schema.createLocalizationTable('services', fields);

      expect(() => indexOptimizer.createLocalizationIndexes('services')).not.toThrow();
    });
  });

  describe('query', () => {
    it('should optimize database', () => {
      expect(() => queryOptimizer.optimizeDatabase()).not.toThrow();
    });

    it('should create materialized views', () => {
      const fields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {},
        options: {},
      }];

      schema.createMainTable('services', fields);
      schema.createLocalizationTable('services', fields);

      expect(() => queryOptimizer.createMaterializedViews('services')).not.toThrow();
    });

    it('should create statistics tables', () => {
      const fields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {},
        options: {},
      }];

      schema.createMainTable('services', fields);

      expect(() => queryOptimizer.createStatisticsTables('services')).not.toThrow();
    });
  });
});
