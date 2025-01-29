import type { ContentItem, ContentrainComponentId, ContentrainFieldType, ModelField, ModelMetadata } from '../src/types';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseConnection } from '../src/core/database/connection';
import { SchemaManager } from '../src/core/database/schema';
import { TableManager } from '../src/core/database/table';

describe('database', () => {
  describe('connection', () => {
    let connection: DatabaseConnection;
    const dbPath = ':memory:';

    beforeEach(() => {
      connection = new DatabaseConnection();
    });

    it('should create database in memory', async () => {
      const db = await connection.createDatabase(dbPath);
      expect(db).toBeDefined();
    });

    it('should create database with read-only mode', async () => {
      const db = await connection.createDatabase(dbPath);
      await connection.setReadOnlyMode();
      // Read-only modda yazma işlemi yapılamaz
      expect(() => db.exec('CREATE TABLE test (id INTEGER)')).toThrow();
    });

    it('should close database connection', async () => {
      await connection.createDatabase(dbPath);
      connection.close();
      // Kapalı bağlantıda işlem yapılamaz
      await expect(connection.setReadOnlyMode()).rejects.toThrow('Database connection not initialized');
    });

    it('should move database to target directory', async () => {
      const targetDir = './test-db';
      await connection.createDatabase('test.db');
      await connection.moveToTargetDir(targetDir);

      const exists = await fs.access(join(targetDir, 'contentrain.db'))
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);

      // Temizlik
      await fs.rm(targetDir, { recursive: true });
    });
  });

  describe('schema', () => {
    let connection: DatabaseConnection;
    let schema: SchemaManager;
    const dbPath = ':memory:';

    beforeEach(async () => {
      connection = new DatabaseConnection();
      const db = await connection.createDatabase(dbPath);

      const mockFields: Record<string, ModelField[]> = {
        services_items: [
          {
            name: 'Title',
            fieldId: 'title',
            modelId: 'services-items',
            componentId: 'single-line-text' as ContentrainComponentId,
            fieldType: 'string' as ContentrainFieldType,
            validations: {
              'required-field': {
                value: true,
              },
            },
            options: {
              'title-field': {
                value: true,
              },
            },
            system: false,
            defaultField: false,
          },
          {
            name: 'Description',
            fieldId: 'description',
            modelId: 'services-items',
            componentId: 'rich-text' as ContentrainComponentId,
            fieldType: 'string' as ContentrainFieldType,
            validations: {
              'required-field': {
                value: true,
              },
            },
            options: {},
            system: false,
            defaultField: false,
          },
        ],
        categories: [
          {
            name: 'Title',
            fieldId: 'title',
            modelId: 'categories',
            componentId: 'single-line-text' as ContentrainComponentId,
            fieldType: 'string' as ContentrainFieldType,
            validations: {
              'required-field': {
                value: true,
              },
            },
            options: {
              'title-field': {
                value: true,
              },
            },
            system: false,
            defaultField: false,
          },
        ],
      };

      // SchemaManager ile tabloları oluştur
      schema = new SchemaManager(db);
      schema.createMainTableSQL('services-items', mockFields.services_items);
      schema.createMainTableSQL('categories', mockFields.categories);
      schema.createLocalizationTableSQL('services-items', mockFields.services_items);
    });

    afterEach(() => {
      connection.close();
    });

    it('should create main table', async () => {
      const fields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services-items',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {
          'required-field': { value: true },
        },
        options: {},
      }];

      const sql = schema.createMainTableSQL('services_items', fields);
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS services_items');
      expect(sql).toContain('title TEXT NOT NULL');
      expect(sql).toContain('ID TEXT PRIMARY KEY');
    });

    it('should create localization table', async () => {
      const fields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services-items',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {
          'required-field': { value: true },
        },
        options: {},
      }];

      const sql = schema.createLocalizationTableSQL('services_items', fields);
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS services_items_i18n');
      expect(sql).toContain('lang TEXT NOT NULL');
      expect(sql).toContain('PRIMARY KEY (ID, lang)');
    });

    it('should create relation table', async () => {
      const field: ModelField = {
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
      };

      const sql = schema.createRelationTableSQL('services_items', field, 'categories');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS services_items_category_id');
      expect(sql).toContain('FOREIGN KEY (source_id) REFERENCES services_items(ID)');
      expect(sql).toContain('FOREIGN KEY (target_id) REFERENCES categories(ID)');
    });

    it('should create indexes', async () => {
      const fields: ModelField[] = [{
        name: 'Title',
        fieldId: 'title',
        modelId: 'services-items',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {
          'unique-field': { value: true },
        },
        options: {},
      }];

      // Önce ana tabloyu oluştur
      schema.createMainTable('services_items', fields);

      // Sonra indeksleri oluştur
      await schema.createIndexes('services_items', fields);
      // İndeks oluşturma başarılı olmalı (hata fırlatmamalı)
    });

    it('should determine correct SQLite types', () => {
      // Sayısal tipler
      expect(schema.getSQLiteType('number', 'decimal')).toBe('REAL');
      expect(schema.getSQLiteType('number', 'percent')).toBe('REAL');
      expect(schema.getSQLiteType('number', 'integer')).toBe('INTEGER');
      expect(schema.getSQLiteType('number', 'rating')).toBe('INTEGER');

      // Metin tipleri
      expect(schema.getSQLiteType('string', 'single-line-text')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'multi-line-text')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'email')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'url')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'slug')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'color')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'json')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'md-editor')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'rich-text-editor')).toBe('TEXT');
      expect(schema.getSQLiteType('string', 'phone-number')).toBe('TEXT');

      // Boolean tipler
      expect(schema.getSQLiteType('boolean', 'checkbox')).toBe('INTEGER');
      expect(schema.getSQLiteType('boolean', 'switch')).toBe('INTEGER');

      // Tarih tipleri
      expect(schema.getSQLiteType('date', 'date')).toBe('DATETIME');
      expect(schema.getSQLiteType('date', 'date-time')).toBe('DATETIME');

      // Medya tipleri
      expect(schema.getSQLiteType('media', 'media')).toBe('TEXT');

      // İlişki tipleri
      expect(schema.getSQLiteType('relation', 'one-to-one')).toBe('TEXT');
      expect(schema.getSQLiteType('relation', 'one-to-many')).toBe('TEXT');

      // Array tipi
      expect(schema.getSQLiteType('array', 'json')).toBe('TEXT');
    });
  });

  describe('table', () => {
    let connection: DatabaseConnection;
    let table: TableManager;
    const dbPath = ':memory:';

    beforeEach(async () => {
      connection = new DatabaseConnection();
      const db = await connection.createDatabase(dbPath);

      // Mock metadata ve fields ekle
      const mockMetadata: Record<string, ModelMetadata> = {
        services_items: {
          name: 'ServicesItems',
          modelId: 'services-items',
          localization: true,
          type: 'JSON' as const,
          createdBy: 'test',
          isServerless: false,
        },
        categories: {
          name: 'Categories',
          modelId: 'categories',
          localization: false,
          type: 'JSON' as const,
          createdBy: 'test',
          isServerless: false,
        },
      };

      const mockFields: Record<string, ModelField[]> = {
        services_items: [
          {
            name: 'Title',
            fieldId: 'title',
            modelId: 'services-items',
            componentId: 'single-line-text' as ContentrainComponentId,
            fieldType: 'string' as ContentrainFieldType,
            validations: {
              'required-field': {
                value: true,
              },
            },
            options: {
              'title-field': {
                value: true,
              },
            },
            system: false,
            defaultField: false,
          },
          {
            name: 'Description',
            fieldId: 'description',
            modelId: 'services-items',
            componentId: 'rich-text' as ContentrainComponentId,
            fieldType: 'string' as ContentrainFieldType,
            validations: {
              'required-field': {
                value: true,
              },
            },
            options: {},
            system: false,
            defaultField: false,
          },
        ],
        categories: [
          {
            name: 'Title',
            fieldId: 'title',
            modelId: 'categories',
            componentId: 'single-line-text' as ContentrainComponentId,
            fieldType: 'string' as ContentrainFieldType,
            validations: {
              'required-field': {
                value: true,
              },
            },
            options: {
              'title-field': {
                value: true,
              },
            },
            system: false,
            defaultField: false,
          },
        ],
      };

      // SchemaManager ile tabloları oluştur
      const schema = new SchemaManager(db);

      // Ana tabloları oluştur
      const mainTableSQL = schema.createMainTableSQL('services-items', mockFields.services_items);
      db.exec(mainTableSQL);

      const categoriesTableSQL = schema.createMainTableSQL('categories', mockFields.categories);
      db.exec(categoriesTableSQL);

      // Lokalizasyon tablosunu oluştur
      const localizationTableSQL = schema.createLocalizationTableSQL('services-items', mockFields.services_items);
      db.exec(localizationTableSQL);

      // İlişki tablosunu oluştur
      const relationField: ModelField = {
        name: 'Category',
        fieldId: 'categoryId',
        modelId: 'services-items',
        componentId: 'one-to-one' as ContentrainComponentId,
        fieldType: 'relation' as ContentrainFieldType,
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
        system: false,
        defaultField: false,
      };

      const relationTableSQL = schema.createRelationTableSQL('services_items', relationField, 'categories');
      db.exec(relationTableSQL);

      // TableManager'ı oluştur
      table = new TableManager(db, mockMetadata, mockFields);
    });

    afterEach(() => {
      connection.close();
    });

    it('should import content', async () => {
      const content: ContentItem[] = [
        {
          ID: '1',
          title: 'Test Service',
          description: 'Test Description',
          status: 'publish',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
          scheduled: false,
        },
      ];

      await table.importContent('services_items', content);
      // TableManager içeride normalize edip öyle kaydetmeli:
      // - services-items -> services_items (model ID)
      // - page-title -> page_title (alan ID)
      // - long-description -> long_description (alan ID)
      // - createdAt -> created_at
      // - updatedAt -> updated_at
      // - scheduled (boolean) -> scheduled (0/1)
    });

    it('should import localized content', async () => {
      // Önce ana tabloya veri ekle
      const mainContent: ContentItem[] = [
        {
          ID: '1',
          title: 'Test Service',
          description: 'Test Description',
          status: 'publish',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
          scheduled: false,
        },
      ];
      await table.importContent('services_items', mainContent);

      // Sonra lokalize içeriği ekle
      const localizedContent: ContentItem[] = [
        {
          ID: '1',
          title: 'Test Servis',
          description: 'Test Açıklama',
          status: 'publish',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
          scheduled: false,
        },
      ];

      await table.importLocalizedContent('services_items', 'tr', localizedContent);
    });

    it('should import relations', async () => {
      // Önce ana tablolara veri ekle
      const servicesContent: ContentItem[] = [
        {
          ID: '123',
          title: 'Test Service',
          description: 'Test Description',
          status: 'publish',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
          scheduled: false,
        },
      ];
      await table.importContent('services_items', servicesContent);

      const categoriesContent: ContentItem[] = [
        {
          ID: 'cat-1',
          title: 'Test Category',
          status: 'publish',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
          scheduled: false,
        },
      ];
      await table.importContent('categories', categoriesContent);

      // Sonra ilişkileri ekle
      const relations = [{
        sourceId: '123',
        targetId: 'cat-1',
      }];

      await table.importRelations('services_items', 'categoryId', relations);
    });
  });
});
