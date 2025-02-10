import type { JSONSourceConfig } from '../../src/types/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentrainTypesGenerator } from '../../src';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('jSON Source Tests', () => {
  const mockPaths = {
    models: path.join(__dirname, '../../../../playground/contentrain/models'),
    content: path.join(__dirname, '../../../../playground/contentrain'),
    output: path.join(__dirname, '../temp/types'),
  };

  let generator: ContentrainTypesGenerator;

  beforeEach(() => {
    // Test öncesi çıktı dizinini temizle
    if (fs.existsSync(mockPaths.output)) {
      fs.rmSync(mockPaths.output, { recursive: true, force: true });
    }

    const config: JSONSourceConfig = {
      source: {
        type: 'json',
        modelsDir: mockPaths.models,
        contentDir: mockPaths.content,
      },
      output: {
        dir: mockPaths.output,
      },
    };

    generator = new ContentrainTypesGenerator(config);
  });

  afterEach(() => {
    // Test sonrası çıktı dizinini temizle
    if (fs.existsSync(mockPaths.output)) {
      fs.rmSync(mockPaths.output, { recursive: true, force: true });
    }
  });

  describe('temel İşlevler', () => {
    it('model dosyalarını doğru şekilde okumalı', () => {
      const analyzer = (generator as any).analyzer;
      const modelFiles = analyzer.getModelFiles();
      expect(modelFiles).toContain('processes.json');
      expect(modelFiles).toContain('workitems.json');
      expect(modelFiles).toContain('faqitems.json');
      expect(modelFiles).not.toContain('metadata.json');
    });

    it('metadata dosyasını doğru şekilde okumalı', () => {
      const analyzer = (generator as any).analyzer;
      const metadata = analyzer.getMetadata();
      expect(metadata).toBeDefined();
      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata.length).toBeGreaterThan(0);
      expect(metadata[0]).toHaveProperty('modelId');
      expect(metadata[0]).toHaveProperty('name');
      expect(metadata[0]).toHaveProperty('localization');
    });

    it('tip tanımlarını doğru şekilde başlatmalı', () => {
      const analyzer = (generator as any).analyzer;
      const typeDefinitions = analyzer.initializeTypeDefinitions();
      expect(typeDefinitions).toContain('@contentrain/query');
      expect(typeDefinitions).toContain('import type { BaseContentrainType, QueryConfig }');
    });
  });

  describe('tip Üretimi', () => {
    it('model için tip tanımlarını doğru şekilde üretmeli', () => {
      const analyzer = (generator as any).analyzer;
      const modelPath = path.join(mockPaths.models, 'processes.json');
      const modelContent = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      const metadata = analyzer.getMetadata();
      const { typeDefinition } = analyzer.generateTypeForModel(modelContent, metadata);

      expect(typeDefinition).toContain('"title": string');
      expect(typeDefinition).toContain('"description": string');
      expect(typeDefinition).toContain('"icon": string');
    });

    it('ilişkili modeller için tip tanımlarını doğru şekilde üretmeli', () => {
      const analyzer = (generator as any).analyzer;
      const modelPath = path.join(mockPaths.models, 'workitems.json');
      const modelContent = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      const metadata = analyzer.getMetadata();

      const { typeDefinition, relations } = analyzer.generateTypeForModel(modelContent, metadata);

      expect(typeDefinition).toContain('"_relations"?: {');
      expect(typeDefinition).toContain('"category": IWorkCategories');
      expect(relations.category).toBeDefined();
      expect(relations.category.model).toBe('IWorkCategories');
    });

    it('query tipleri için doğru tanımları üretmeli', () => {
      const analyzer = (generator as any).analyzer;
      const metadata = analyzer.getMetadata();
      const modelMetadata = metadata.find((m: any) => m.modelId === 'workitems');
      const relations = {
        category: {
          model: 'IWorkCategories',
          type: 'one-to-one',
        },
      };

      const queryType = analyzer.generateQueryType(
        'IWorkItem',
        'IWorkItemQuery',
        modelMetadata,
        relations,
      );

      expect(queryType).toContain('export type IWorkItemQuery = QueryConfig<');
      expect(queryType).toContain('IWorkItem');
      expect(queryType).toContain('\'en\' | \'tr\'');
      expect(queryType).toContain('"category": IWorkCategories');
    });
  });

  describe('dosya İşlemleri', () => {
    it('tip tanımlarını doğru şekilde yazmalı', async () => {
      await generator.generate();

      const outputPath = path.join(mockPaths.output, 'contentrain.d.ts');
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('export interface IProcessItems');
      expect(content).toContain('export interface IWorkItem');
      expect(content).toContain('export interface IFaqItem');
    });
  });

  describe('hata Yönetimi', () => {
    it('geçersiz model dizini için hata fırlatmalı', () => {
      const invalidConfig: JSONSourceConfig = {
        source: {
          type: 'json',
          modelsDir: '/invalid/path',
          contentDir: mockPaths.content,
        },
        output: {
          dir: mockPaths.output,
        },
      };

      const invalidGenerator = new ContentrainTypesGenerator(invalidConfig);
      const analyzer = (invalidGenerator as any).analyzer;

      expect(() => {
        analyzer.getModelFiles();
      }).toThrow('Failed to read model directory: /invalid/path');
    });

    it('geçersiz metadata dosyası için hata fırlatmalı', () => {
      const tempModelPath = path.join(__dirname, '../temp/models');
      fs.mkdirSync(tempModelPath, { recursive: true });

      const invalidConfig: JSONSourceConfig = {
        source: {
          type: 'json',
          modelsDir: tempModelPath,
          contentDir: mockPaths.content,
        },
        output: {
          dir: mockPaths.output,
        },
      };

      const invalidGenerator = new ContentrainTypesGenerator(invalidConfig);
      const analyzer = (invalidGenerator as any).analyzer;

      expect(() => {
        analyzer.getMetadata();
      }).toThrow('Failed to read metadata');

      fs.rmSync(tempModelPath, { recursive: true, force: true });
    });
  });

  describe('yardımcı Metodlar', () => {
    it('alan adlarını doğru şekilde formatlamalı', () => {
      const analyzer = (generator as any).analyzer;
      expect(analyzer.formatPropertyName('normal')).toBe('normal');
      expect(analyzer.formatPropertyName('with-dash')).toBe('with-dash');
    });

    it('arayüz adlarını doğru şekilde formatlamalı', () => {
      const analyzer = (generator as any).analyzer;
      const metadata = { name: 'Test Model', modelId: 'test-model' };
      expect(analyzer.formatInterfaceName(metadata)).toBe('ITestModel');
    });

    it('alanın zorunlu olup olmadığını doğru şekilde kontrol etmeli', () => {
      const analyzer = (generator as any).analyzer;
      const requiredField = {
        validations: {
          'required-field': { value: true },
        },
      };
      const optionalField = {
        validations: {
          'required-field': { value: false },
        },
      };
      const noValidationField = {};

      expect(analyzer.isFieldRequired(requiredField)).toBe(true);
      expect(analyzer.isFieldRequired(optionalField)).toBe(false);
      expect(analyzer.isFieldRequired(noValidationField)).toBe(false);
    });

    it('typeScript tiplerini doğru şekilde belirlenmeli', () => {
      const analyzer = (generator as any).analyzer;
      const fields = [
        { fieldType: 'string', componentId: 'single-line-text' },
        { fieldType: 'number', componentId: 'integer' },
        { fieldType: 'boolean', componentId: 'checkbox' },
        { fieldType: 'date', componentId: 'date' },
        { fieldType: 'media', componentId: 'media' },
        { fieldType: 'relation', componentId: 'one-to-one' },
        { fieldType: 'relation', componentId: 'one-to-many' },
      ];

      expect(analyzer.determineTypeScriptType(fields[0])).toBe('string');
      expect(analyzer.determineTypeScriptType(fields[1])).toBe('number');
      expect(analyzer.determineTypeScriptType(fields[2])).toBe('boolean');
      expect(analyzer.determineTypeScriptType(fields[3])).toBe('string');
      expect(analyzer.determineTypeScriptType(fields[4])).toBe('string');
      expect(analyzer.determineTypeScriptType(fields[5])).toBe('string');
      expect(analyzer.determineTypeScriptType(fields[6])).toBe('string[]');
    });
  });
});
