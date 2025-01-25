import type { ModelField, ModelMetadata } from '../src/types';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ContentrainSQLiteGenerator from '../src';

describe('contentrainSQLiteGenerator', () => {
  let generator: ContentrainSQLiteGenerator;
  const testDir = './test-contentrain';
  const modelsDir = join(testDir, 'models');
  const contentDir = join(testDir, 'content');
  const outputDir = join(testDir, 'dist');

  beforeEach(async () => {
    // Test dizinlerini oluştur
    await fs.mkdir(modelsDir, { recursive: true });
    await fs.mkdir(contentDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // Test verilerini oluştur
    const metadata: ModelMetadata[] = [
      {
        name: 'Categories',
        modelId: 'categories',
        localization: false,
        type: 'JSON',
        createdBy: 'test',
        isServerless: false,
      },
      {
        name: 'ServicesItems',
        modelId: 'services-items',
        localization: true,
        type: 'JSON',
        createdBy: 'test',
        isServerless: false,
      },
    ];
    await fs.writeFile(join(modelsDir, 'metadata.json'), JSON.stringify(metadata));

    // Categories model fields
    const categoryFields: ModelField[] = [{
      name: 'Title',
      fieldId: 'title',
      modelId: 'categories',
      componentId: 'single-line-text',
      fieldType: 'string',
      validations: {
        'required-field': { value: true },
      },
      options: {},
    }];
    await fs.writeFile(join(modelsDir, 'categories.json'), JSON.stringify(categoryFields));

    // Services model fields
    const servicesFields: ModelField[] = [
      {
        name: 'Title',
        fieldId: 'title',
        modelId: 'services-items',
        componentId: 'single-line-text',
        fieldType: 'string',
        validations: {
          'required-field': { value: true },
        },
        options: {},
      },
      {
        name: 'Description',
        fieldId: 'description',
        modelId: 'services-items',
        componentId: 'multi-line-text',
        fieldType: 'string',
        validations: {},
        options: {},
      },
      {
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
      },
    ];
    await fs.writeFile(join(modelsDir, 'services-items.json'), JSON.stringify(servicesFields));

    // Categories content
    const categoryContent = [{
      ID: 'cat-1',
      title: 'Test Category',
      status: 'publish',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
      scheduled: false,
    }];
    await fs.mkdir(join(contentDir, 'categories'), { recursive: true });
    await fs.writeFile(join(contentDir, 'categories', 'categories.json'), JSON.stringify(categoryContent));

    // Services content
    const servicesContent = [{
      ID: '1',
      title: 'Test Service',
      description: 'Test Description',
      categoryId: 'cat-1',
      status: 'publish',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
      scheduled: false,
    }];
    await fs.mkdir(join(contentDir, 'services-items'), { recursive: true });
    await fs.writeFile(join(contentDir, 'services-items', 'en.json'), JSON.stringify(servicesContent));

    // Lokalize içerik
    const localizedContent = [{
      ID: '1',
      title: 'Test Servis',
      description: 'Test Açıklama',
      status: 'publish',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
      scheduled: false,
    }];
    await fs.writeFile(join(contentDir, 'services-items', 'tr.json'), JSON.stringify(localizedContent));

    // Generator'ı başlat
    generator = new ContentrainSQLiteGenerator({
      modelsDir,
      contentDir,
      outputDir,
      dbName: 'test.db',
    });
  });

  afterEach(async () => {
    // Test dizinlerini temizle
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should read model metadata', async () => {
    const metadata = await generator.readModelMetadata();
    expect(metadata).toHaveLength(2);
    expect(metadata[1].modelId).toBe('services-items');
  });

  it('should read model fields', async () => {
    const fields = await generator.readModelFields('services-items');
    expect(fields).toHaveLength(3);
    expect(fields[0].fieldId).toBe('title');
    expect(fields[1].fieldId).toBe('description');
    expect(fields[2].fieldId).toBe('categoryId');
  });

  it('should read localization codes', async () => {
    const codes = await generator.readLocalizationCodes('services-items');
    expect(codes).toContain('en');
    expect(codes).toContain('tr');
  });

  it('should generate SQLite database', async () => {
    await generator.generate();

    // Veritabanı dosyasının oluşturulduğunu kontrol et
    const dbExists = await fs.access(join(outputDir, 'test.db'))
      .then(() => true)
      .catch(() => false);
    expect(dbExists).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // Hatalı metadata dosyası oluştur
    await fs.writeFile(join(modelsDir, 'metadata.json'), 'invalid json');

    await expect(generator.generate()).rejects.toThrow();
  });

  it('should skip serverless models', async () => {
    // Serverless model ekle
    const metadata: ModelMetadata[] = [
      {
        name: 'Categories',
        modelId: 'categories',
        localization: false,
        type: 'JSON',
        createdBy: 'test',
        isServerless: false,
      },
      {
        name: 'ServicesItems',
        modelId: 'services-items',
        localization: true,
        type: 'JSON',
        createdBy: 'test',
        isServerless: false,
      },
      {
        name: 'ServerlessModel',
        modelId: 'serverless-model',
        localization: false,
        type: 'JSON',
        createdBy: 'test',
        isServerless: true,
      },
    ];
    await fs.writeFile(join(modelsDir, 'metadata.json'), JSON.stringify(metadata));

    await generator.generate();
    // Hata fırlatmamalı
  });

  it('should handle missing content directory', async () => {
    // Content dizinini sil
    await fs.rm(contentDir, { recursive: true });

    await expect(generator.generate()).rejects.toThrow();
  });

  it('should handle missing models directory', async () => {
    // Models dizinini sil
    await fs.rm(modelsDir, { recursive: true });

    await expect(generator.generate()).rejects.toThrow();
  });
});
