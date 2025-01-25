import type { ModelField } from '../src/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseConnection } from '../src/core/database/connection';
import { RelationGenerator } from '../src/core/generator/relation';
import { TableGenerator } from '../src/core/generator/table';

describe('generator', () => {
  let connection: DatabaseConnection;
  let tableGenerator: TableGenerator;
  let relationGenerator: RelationGenerator;
  const dbPath = ':memory:';

  beforeEach(async () => {
    connection = new DatabaseConnection();
    const db = await connection.createDatabase(dbPath);
    tableGenerator = new TableGenerator(db);
    relationGenerator = new RelationGenerator(db);
  });

  afterEach(() => {
    connection.close();
  });

  describe('table', () => {
    it('should create main table', async () => {
      const fields: ModelField[] = [
        {
          name: 'Title',
          fieldId: 'title',
          modelId: 'services',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {
            'required-field': { value: true },
          },
          options: {},
        },
      ];

      await expect(tableGenerator.createMainTable('services', fields)).resolves.not.toThrow();
    });

    it('should create localization table', async () => {
      const fields: ModelField[] = [
        {
          name: 'Title',
          fieldId: 'title',
          modelId: 'services',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
        },
      ];

      await expect(tableGenerator.createLocalizationTable('services', fields)).resolves.not.toThrow();
    });

    it('should filter localizable fields', () => {
      const fields: ModelField[] = [
        {
          name: 'Title',
          fieldId: 'title',
          modelId: 'services',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
        },
        {
          name: 'Category',
          fieldId: 'categoryId',
          modelId: 'services',
          componentId: 'one-to-one',
          fieldType: 'relation',
          validations: {},
          options: {},
        },
        {
          name: 'Status',
          fieldId: 'status',
          modelId: 'services',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
          system: true,
        },
      ];

      const localizableFields = tableGenerator.getLocalizableFields(fields);
      expect(localizableFields).toHaveLength(1);
      expect(localizableFields[0].fieldId).toBe('title');
    });
  });

  describe('relation', () => {
    it('should filter relation fields', () => {
      const fields: ModelField[] = [
        {
          name: 'Title',
          fieldId: 'title',
          modelId: 'services',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
        },
        {
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
        },
      ];

      const relationFields = relationGenerator.getRelationFields(fields);
      expect(relationFields).toHaveLength(1);
      expect(relationFields[0].fieldId).toBe('categoryId');
    });

    it('should create relation tables', async () => {
      // Önce ana tabloları oluştur
      const servicesFields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {},
        options: {},
      }];
      await tableGenerator.createMainTable('services', servicesFields);

      const categoriesFields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'categories',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {},
        options: {},
      }];
      await tableGenerator.createMainTable('categories', categoriesFields);

      // Sonra ilişki tablosunu oluştur
      const relationFields: ModelField[] = [{
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

      await expect(relationGenerator.createRelations('services', relationFields)).resolves.not.toThrow();
    });

    it('should skip relations without reference', async () => {
      const relationFields: ModelField[] = [{
        name: 'Category',
        fieldId: 'categoryId',
        modelId: 'services',
        componentId: 'one-to-one',
        fieldType: 'relation',
        validations: {},
        options: {}, // reference yok
      }];

      await expect(relationGenerator.createRelations('services', relationFields)).resolves.not.toThrow();
    });
  });
});
