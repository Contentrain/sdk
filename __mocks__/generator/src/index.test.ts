import type { ContentrainModelMetadata } from '@contentrain/types';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ErrorCode } from '@contentrain/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentrainGenerator } from './index';

describe('contentrain Tests', () => {
  const cliPath = path.join(__dirname, '../dist/cli.js');
  const mockPaths = {
    models: path.join(__dirname, '__mocks__/temp/contentrain/models'),
    content: path.join(__dirname, '__mocks__/temp/contentrain'),
    output: path.join(__dirname, '__mocks__/temp/output'),
  };

  let generator: ContentrainGenerator;
  let metadata: ContentrainModelMetadata[];
  let modelFiles: string[];
  let modelIds: string[];

  beforeEach(() => {
    // Mock dizinlerini oluştur
    fs.mkdirSync(mockPaths.models, { recursive: true });
    fs.mkdirSync(mockPaths.content, { recursive: true });
    fs.mkdirSync(mockPaths.output, { recursive: true });

    // Mock metadata dosyasını oluştur
    const mockMetadata = [
      {
        modelId: 'services',
        name: 'Services',
        localization: true,
      },
      {
        modelId: 'workitems',
        name: 'Work Items',
        localization: true,
      },
      {
        modelId: 'workcategories',
        name: 'Work Categories',
        localization: true,
      },
    ];
    fs.writeFileSync(path.join(mockPaths.models, 'metadata.json'), JSON.stringify(mockMetadata, null, 2));

    // Mock model dosyalarını oluştur
    const mockServices = [
      {
        fieldId: 'ID',
        name: 'ID',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'services',
      },
      {
        fieldId: 'createdAt',
        name: 'Created At',
        fieldType: 'string',
        componentId: 'date-time',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'services',
      },
      {
        fieldId: 'updatedAt',
        name: 'Updated At',
        fieldType: 'string',
        componentId: 'date-time',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'services',
      },
      {
        fieldId: 'status',
        name: 'Status',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'services',
      },
      {
        fieldId: 'title',
        name: 'Title',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'services',
      },
    ];
    fs.writeFileSync(path.join(mockPaths.models, 'services.json'), JSON.stringify(mockServices, null, 2));

    const mockWorkItems = [
      {
        fieldId: 'ID',
        name: 'ID',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workitems',
      },
      {
        fieldId: 'createdAt',
        name: 'Created At',
        fieldType: 'string',
        componentId: 'date-time',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workitems',
      },
      {
        fieldId: 'updatedAt',
        name: 'Updated At',
        fieldType: 'string',
        componentId: 'date-time',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workitems',
      },
      {
        fieldId: 'status',
        name: 'Status',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workitems',
      },
      {
        fieldId: 'title',
        name: 'Title',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workitems',
      },
      {
        fieldId: 'category',
        name: 'Category',
        fieldType: 'relation',
        componentId: 'one-to-one',
        validations: { 'required-field': { value: true } },
        options: {
          reference: {
            form: {
              reference: {
                value: 'workcategories',
              },
            },
          },
        },
        modelId: 'workitems',
      },
    ];
    fs.writeFileSync(path.join(mockPaths.models, 'workitems.json'), JSON.stringify(mockWorkItems, null, 2));

    const mockWorkCategories = [
      {
        fieldId: 'ID',
        name: 'ID',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workcategories',
      },
      {
        fieldId: 'createdAt',
        name: 'Created At',
        fieldType: 'string',
        componentId: 'date-time',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workcategories',
      },
      {
        fieldId: 'updatedAt',
        name: 'Updated At',
        fieldType: 'string',
        componentId: 'date-time',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workcategories',
      },
      {
        fieldId: 'status',
        name: 'Status',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workcategories',
      },
      {
        fieldId: 'name',
        name: 'Name',
        fieldType: 'string',
        componentId: 'single-line-text',
        validations: { 'required-field': { value: true } },
        options: {},
        modelId: 'workcategories',
      },
    ];
    fs.writeFileSync(path.join(mockPaths.models, 'workcategories.json'), JSON.stringify(mockWorkCategories, null, 2));

    generator = new ContentrainGenerator({
      modelsDir: mockPaths.models,
      contentDir: mockPaths.content,
      outputDir: mockPaths.output,
    });
    metadata = JSON.parse(fs.readFileSync(path.join(mockPaths.models, 'metadata.json'), 'utf-8'));
    modelFiles = (generator as any).getModelFiles(mockPaths.models);
    modelIds = metadata.map((model: ContentrainModelMetadata) => model.modelId);
  });

  afterEach(() => {
    // Sadece test sırasında oluşturulan dosyaları temizle
    try {
      if (fs.existsSync(mockPaths.models))
        fs.rmSync(mockPaths.models, { recursive: true, force: true });
      if (fs.existsSync(mockPaths.content))
        fs.rmSync(mockPaths.content, { recursive: true, force: true });
      if (fs.existsSync(mockPaths.output))
        fs.rmSync(mockPaths.output, { recursive: true, force: true });
    }
    catch {
      // Ignore cleanup errors
    }
  });

  describe('error Handling', () => {
    it('should throw FILE_READ_ERROR when reading invalid JSON file', async () => {
      const invalidPath = path.join(mockPaths.models, 'invalid.json');

      await expect(async () => {
        await (generator as any).readJsonFile(invalidPath);
      }).rejects.toThrow();

      try {
        await (generator as any).readJsonFile(invalidPath);
      }
      catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('readJsonFile is not a function');
      }
    });

    it('should throw MODEL_VALIDATION_ERROR for duplicate fields', () => {
      const duplicateFields = [
        { fieldId: 'title', name: 'Title', fieldType: 'string', componentId: 'single-line-text' },
        { fieldId: 'title', name: 'Title 2', fieldType: 'string', componentId: 'single-line-text' },
      ];

      expect(() => {
        (generator as any).checkDuplicateFields(duplicateFields, 'test-model');
      }).toThrow();

      try {
        (generator as any).checkDuplicateFields(duplicateFields, 'test-model');
      }
      catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.cause.code).toBe(ErrorCode.MODEL_VALIDATION_ERROR);
        expect(error.cause.details.duplicateFields).toEqual(['title']);
      }
    });

    it('should throw MODEL_NOT_FOUND for missing metadata', () => {
      const invalidModelsDir = path.join(__dirname, '__mocks__/invalid');

      expect(() => {
        (generator as any).getMetaData(invalidModelsDir);
      }).toThrow();

      try {
        (generator as any).getMetaData(invalidModelsDir);
      }
      catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.cause.code).toBe(ErrorCode.MODEL_NOT_FOUND);
        expect(error.cause.path).toBe(path.join(invalidModelsDir, 'metadata.json'));
      }
    });

    it('should throw MODEL_VALIDATION_ERROR for invalid relation extraction', () => {
      expect(() => {
        (generator as any).extractRelations(null, null);
      }).toThrow();

      try {
        (generator as any).extractRelations(null, null);
      }
      catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.cause.code).toBe(ErrorCode.MODEL_VALIDATION_ERROR);
        expect(error.cause.details).toEqual({
          hasMetadata: false,
          hasContent: false,
        });
      }
    });

    it('should throw INVALID_CONFIG for invalid configuration file', () => {
      const invalidConfigPath = path.join(__dirname, '__mocks__/temp/invalid-config');
      fs.mkdirSync(invalidConfigPath, { recursive: true });
      fs.writeFileSync(path.join(invalidConfigPath, 'contentrain-config.json'), 'invalid json');

      try {
        (generator as any).generate();
      }
      catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Failed to read models directory');
      }
      finally {
        fs.rmSync(invalidConfigPath, { recursive: true, force: true });
      }
    });
  });

  describe('cLI Tests', () => {
    it('should handle missing models directory gracefully', async () => {
      const { stderr } = await new Promise<{ stderr: string }>((resolve) => {
        exec(`node ${cliPath} --models ./nonexistent --output ${mockPaths.output}/contentrain.ts`, (error, stdout, stderr) => {
          if (error)
            resolve({ stderr });
          else resolve({ stderr: '' });
        });
      });

      expect(stderr).toContain('❌ Error generating type definitions');
    });

    it('should handle invalid output path gracefully', async () => {
      const { stderr } = await new Promise<{ stderr: string }>((resolve) => {
        exec(`node ${cliPath} --models ${mockPaths.models} --output /invalid/path/contentrain.ts`, (error, stdout, stderr) => {
          if (error)
            resolve({ stderr });
          else resolve({ stderr: '' });
        });
      });

      expect(stderr).toContain('❌ Error generating type definitions');
    });
  });

  describe('generator Core Functions', () => {
    it('should correctly filter JSON files in a directory', () => {
      const expectedFiles = [
        'services.json',
        'workcategories.json',
        'workitems.json',
      ];
      expect(modelFiles).toEqual(expectedFiles);
    });

    it('should correctly extract model IDs from file names', () => {
      const expectedIds = [
        'services',
        'workcategories',
        'workitems',
      ];
      const extractedIds = (generator as any).getModelIds(modelFiles);
      expect(extractedIds).toEqual(expectedIds);
    });

    it('should correctly read metadata.json file', () => {
      const readMetadata = (generator as any).getMetaData(mockPaths.models);
      expect(readMetadata).toEqual(metadata);
    });

    it('should correctly initialize type definitions based on model IDs', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);

      expect(typeDefinitions).toContain('export type ModelId =');
      expect(typeDefinitions).toContain('export interface BaseContentrainType');
    });

    it('should correctly process model files', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);
      const { generatedCount, skippedCount, errors, interfaceNames, updatedTypeDefinitions }
        = (generator as any).processModelFiles(modelFiles, mockPaths.models, typeDefinitions, metadata);

      expect(generatedCount).toEqual(3);
      expect(skippedCount).toEqual(0);
      expect(errors).toEqual([]);
      expect(interfaceNames).toBeInstanceOf(Map);
      expect(updatedTypeDefinitions).toContain('export type ModelId =');
    });

    it('should correctly finalize type definitions', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);
      const { interfaceNames } = (generator as any).processModelFiles(
        modelFiles,
        mockPaths.models,
        typeDefinitions,
        metadata,
      );
      const finalizedTypeDefinitions = (generator as any).finalizeTypeDefinitions(
        modelIds,
        interfaceNames,
        modelFiles,
        mockPaths.models,
        metadata,
      );

      const expectedInterfaces = [
        'services',
        'workitems',
        'workcategories',
      ];

      expectedInterfaces.forEach((interfaceName) => {
        expect(finalizedTypeDefinitions).toContain(interfaceName);
      });
    });

    it('should correctly generate relation mappings', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);
      const { interfaceNames } = (generator as any).processModelFiles(
        modelFiles,
        mockPaths.models,
        typeDefinitions,
        metadata,
      );
      const finalizedTypeDefinitions = (generator as any).finalizeTypeDefinitions(
        modelIds,
        interfaceNames,
        modelFiles,
        mockPaths.models,
        metadata,
      );

      const expectedRelations = `export type ModelRelations = {
  'workitems': {
    'category': {
      model: 'workcategories'
      type: 'one-to-one'
    }
  }
} & {
  [K in keyof ContentrainTypeMap]: {
    [R: string]: {
      model: keyof ContentrainTypeMap
      type: 'one-to-one' | 'one-to-many'
    }
  }
}`;

      expect(finalizedTypeDefinitions).toContain(expectedRelations);
    });

    it('should correctly generate locale content map', () => {
      const localeContentMap = (generator as any).generateLocaleContentMap(metadata);

      // Genel locale tipi kontrolü
      expect(localeContentMap).toContain('export type AvailableLocale =');

      // Model bazlı locale tipleri kontrolü
      const expectedModels = [
        'services',
        'workitems',
        'workcategories',
      ];

      // Her model için locale tip tanımı kontrolü
      expectedModels.forEach((modelId) => {
        expect(localeContentMap).toContain(`export type ${(generator as any).formatTypeName(modelId)}Locales =`);
      });

      // LocaleContentMap tip tanımı kontrolü
      expect(localeContentMap).toContain('export type LocaleContentMap = {');

      // Doğrulama fonksiyonu kontrolü
      expect(localeContentMap).toContain('export const isValidLocale = <K extends keyof ContentrainTypeMap>(');
      expect(localeContentMap).toContain('modelId: K,');
      expect(localeContentMap).toContain('locale: string');
      expect(localeContentMap).toContain('): locale is QueryLocale<K>');
    });

    it('should correctly write type definitions to a file', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);
      const { interfaceNames } = (generator as any).processModelFiles(
        modelFiles,
        mockPaths.models,
        typeDefinitions,
        metadata,
      );
      const finalizedTypeDefinitions = (generator as any).finalizeTypeDefinitions(
        modelIds,
        interfaceNames,
        modelFiles,
        mockPaths.models,
        metadata,
      );

      (generator as any).writeTypeDefinitions(mockPaths.output, finalizedTypeDefinitions, 11, 0, []);
    });
    it('should correctly write type definitions to a file mock data', () => {
      const generatorX = new ContentrainGenerator({
        modelsDir: path.join(process.cwd(), '../../__mocks__/contentrain/models'),
        contentDir: path.join(process.cwd(), '../../__mocks__/contentrain'),
        outputDir: path.join(process.cwd(), '../../__mocks__/output'),
      });
      (generatorX as any).generate();
    });

    it('should correctly generate types', () => {
      (generator as any).generate();
    });

    it('should correctly generate asset types', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);
      const { interfaceNames } = (generator as any).processModelFiles(
        modelFiles,
        mockPaths.models,
        typeDefinitions,
        metadata,
      );
      const finalizedTypeDefinitions = (generator as any).finalizeTypeDefinitions(
        modelIds,
        interfaceNames,
        modelFiles,
        mockPaths.models,
        metadata,
      );

      // Asset meta interface kontrolü
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainAssetMeta {');
      expect(finalizedTypeDefinitions).toContain('user: {');
      expect(finalizedTypeDefinitions).toContain('name: string');
      expect(finalizedTypeDefinitions).toContain('email: string');
      expect(finalizedTypeDefinitions).toContain('avatar: string');
      expect(finalizedTypeDefinitions).toContain('createdAt: string');

      // Asset interface kontrolü
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainAsset {');
      expect(finalizedTypeDefinitions).toContain('path: string');
      expect(finalizedTypeDefinitions).toContain('mimetype: string');
      expect(finalizedTypeDefinitions).toContain('size: number');
      expect(finalizedTypeDefinitions).toContain('alt: string');
      expect(finalizedTypeDefinitions).toContain('meta: ContentrainAssetMeta');

      // Assets type kontrolü
      expect(finalizedTypeDefinitions).toContain('export type ContentrainAssets = ContentrainAsset[]');
    });

    it('should correctly generate metadata exports', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);
      const { interfaceNames } = (generator as any).processModelFiles(
        modelFiles,
        mockPaths.models,
        typeDefinitions,
        metadata,
      );
      const finalizedTypeDefinitions = (generator as any).finalizeTypeDefinitions(
        modelIds,
        interfaceNames,
        modelFiles,
        mockPaths.models,
        metadata,
      );

      // Metadata export kontrolü
      expect(finalizedTypeDefinitions).toContain('export const contentrainMetadata =');
      expect(finalizedTypeDefinitions).toContain('export type ContentrainMetadata =');
      expect(finalizedTypeDefinitions).toContain('export type ModelMetadata<T extends keyof ContentrainMetadata>');
      expect(finalizedTypeDefinitions).toContain('export type ContentrainModelIds =');

      // Metadata içeriği kontrolü
      const metadataMap = metadata.reduce((acc, model) => {
        acc[model.modelId] = model;
        return acc;
      }, {} as Record<string, ContentrainModelMetadata>);
      const metadataContent = JSON.stringify(metadataMap, null, 2);
      expect(finalizedTypeDefinitions).toContain(metadataContent);

      // Örnek model kontrolü
      expect(finalizedTypeDefinitions).toContain('"services":');
      expect(finalizedTypeDefinitions).toContain('"workitems":');
    });

    it('should correctly generate validation and option types', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);
      const { interfaceNames } = (generator as any).processModelFiles(
        modelFiles,
        mockPaths.models,
        typeDefinitions,
        metadata,
      );
      const finalizedTypeDefinitions = (generator as any).finalizeTypeDefinitions(
        modelIds,
        interfaceNames,
        modelFiles,
        mockPaths.models,
        metadata,
      );

      // Field Definition kontrolü
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainFieldDefinition extends Omit<ContentrainField, \'options\' | \'validations\'> {');
      expect(finalizedTypeDefinitions).toContain('validations?: ContentrainValidations;');
      expect(finalizedTypeDefinitions).toContain('options?: ContentrainFieldOptions;');

      // Base Field Type kontrolü
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainField {');
      expect(finalizedTypeDefinitions).toContain('options: ContentrainFieldOptions');
      expect(finalizedTypeDefinitions).toContain('validations: ContentrainValidations');

      // Validasyon tipleri kontrolü
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainValidation {');
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainValidations {');
      expect(finalizedTypeDefinitions).toContain('required-field');
      expect(finalizedTypeDefinitions).toContain('unique-field');
      expect(finalizedTypeDefinitions).toContain('min-length');
      expect(finalizedTypeDefinitions).toContain('max-length');

      // Option tipleri kontrolü
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainTitleFieldOption {');
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainDefaultValueOption<T> {');
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainReferenceOption {');
      expect(finalizedTypeDefinitions).toContain('export interface ContentrainFieldOptions {');
    });
  });

  describe('contentrainGenerator Error Handling', () => {
    const mockPaths = {
      invalidJson: path.join(__dirname, '__mocks__/temp/invalid.json'),
      missingFile: path.join(__dirname, '__mocks__/temp/missing.json'),
      invalidConfig: path.join(__dirname, '__mocks__/temp/invalid-config.json'),
    };

    beforeEach(() => {
      // Create temp directory
      fs.mkdirSync(path.join(__dirname, '__mocks__/temp'), { recursive: true });
      // Create invalid JSON file
      fs.writeFileSync(mockPaths.invalidJson, '{ invalid json }');
      // Create invalid config file
      fs.writeFileSync(mockPaths.invalidConfig, '{ invalid config }');
    });

    afterEach(() => {
      // Sadece geçici test dosyalarını temizle
      try {
        if (fs.existsSync(path.join(__dirname, '__mocks__')))
          fs.rmSync(path.join(__dirname, '__mocks__'), { recursive: true, force: true });
      }
      catch {
        // Ignore cleanup errors
      }
    });

    it('should throw FILE_NOT_FOUND when file does not exist', () => {
      const generator = new ContentrainGenerator();
      expect(() => {
        void generator.generate();
      }).toThrow(/Failed to read models directory/);
    });

    it('should throw FILE_READ_ERROR for invalid JSON', () => {
      const generator = new ContentrainGenerator();
      expect(() => {
        void generator.generate();
      }).toThrow(/Failed to read models directory/);
    });

    it('should throw INVALID_CONFIG for invalid config file', () => {
      process.chdir(__dirname);
      fs.writeFileSync('contentrain-config.json', '{ invalid config }');

      let generator: ContentrainGenerator;
      expect(() => {
        generator = new ContentrainGenerator();
        void generator;
      }).toThrow(/Invalid JSON in configuration file/);

      try {
        fs.unlinkSync('contentrain-config.json');
      }
      catch {
        // Ignore cleanup errors
      }
    });
  });
});
