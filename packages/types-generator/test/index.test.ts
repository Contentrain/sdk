import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentrainTypesGenerator } from '../src';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('contentrainTypesGenerator Tests', () => {
  const mockPaths = {
    models: path.join(__dirname, '../../../playground/contentrain/models'),
    content: path.join(__dirname, '../../../playground/contentrain'),
    output: path.join(__dirname, '../temp/types'),
  };

  let generator: ContentrainTypesGenerator;

  beforeEach(() => {
    // Test öncesi çıktı dizinini temizle
    if (fs.existsSync(mockPaths.output)) {
      fs.rmSync(mockPaths.output, { recursive: true, force: true });
    }

    generator = new ContentrainTypesGenerator({
      modelsDir: mockPaths.models,
      contentDir: mockPaths.content,
      outputDir: mockPaths.output,
    });
  });

  afterEach(() => {
    // Test sonrası çıktı dizinini temizle
    if (fs.existsSync(mockPaths.output)) {
      fs.rmSync(mockPaths.output, { recursive: true, force: true });
    }
  });

  describe('temel İşlevler', () => {
    it('model dosyalarını doğru şekilde okumalı', () => {
      const modelFiles = (generator as any).getModelFiles();
      expect(modelFiles).toContain('processes.json');
      expect(modelFiles).toContain('workitems.json');
      expect(modelFiles).toContain('faqitems.json');
      expect(modelFiles).not.toContain('metadata.json');
    });

    it('metadata dosyasını doğru şekilde okumalı', () => {
      const metadata = (generator as any).getMetadata();
      expect(metadata).toBeDefined();
      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata.length).toBeGreaterThan(0);
      expect(metadata[0]).toHaveProperty('modelId');
      expect(metadata[0]).toHaveProperty('name');
      expect(metadata[0]).toHaveProperty('localization');
    });

    it('tip tanımlarını doğru şekilde başlatmalı', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions();
      expect(typeDefinitions).toContain('@contentrain/types-generator');
      expect(typeDefinitions).toContain('import type { BaseContentrainType, QueryConfig }');
    });
  });

  describe('tip Üretimi', () => {
    it('model için tip tanımlarını doğru şekilde üretmeli', () => {
      const modelPath = path.join(mockPaths.models, 'processes.json');
      const modelContent = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      const metadata = (generator as any).getMetadata();

      const { typeDefinition, relations } = (generator as any).generateTypeForModel(modelContent, metadata);

      expect(typeDefinition).toContain('title: string');
      expect(typeDefinition).toContain('description: string');
      expect(typeDefinition).toContain('icon: string');
      expect(relations).toBeDefined();
    });

    it('ilişkili modeller için tip tanımlarını doğru şekilde üretmeli', () => {
      const modelPath = path.join(mockPaths.models, 'workitems.json');
      const modelContent = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      const metadata = (generator as any).getMetadata();

      const { typeDefinition, relations } = (generator as any).generateTypeForModel(modelContent, metadata);

      expect(typeDefinition).toContain('_relations?: {');
      expect(typeDefinition).toContain('category: IWorkCategories');
      expect(relations.category).toBeDefined();
      expect(relations.category.model).toBe('IWorkCategories');
    });

    it('query tipleri için doğru tanımları üretmeli', () => {
      const metadata = (generator as any).getMetadata();
      const modelMetadata = metadata.find((m: any) => m.modelId === 'workitems');
      const relations = {
        category: {
          model: 'IWorkCategories',
          type: 'one-to-one',
        },
      };

      const queryType = (generator as any).generateQueryType(
        'IWorkItem',
        'IWorkItemQuery',
        modelMetadata,
        relations,
      );

      expect(queryType).toContain('export interface IWorkItemQuery extends QueryConfig<');
      expect(queryType).toContain('IWorkItem');
      expect(queryType).toContain('\'en\' | \'tr\'');
      expect(queryType).toContain('category: IWorkCategories');
    });
  });

  describe('dosya İşlemleri', () => {
    it('tip tanımlarını doğru şekilde yazmalı', () => {
      generator.generate();

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
      const invalidGenerator = new ContentrainTypesGenerator({
        modelsDir: '/invalid/path',
        contentDir: mockPaths.content,
        outputDir: mockPaths.output,
      });

      expect(() => {
        const files = (invalidGenerator as any).getModelFiles();
        void files;
      }).toThrow('Model dizini okunamadı');
    });

    it('geçersiz metadata dosyası için hata fırlatmalı', () => {
      const tempModelPath = path.join(__dirname, '../temp/models');
      fs.mkdirSync(tempModelPath, { recursive: true });

      const invalidGenerator = new ContentrainTypesGenerator({
        modelsDir: tempModelPath,
        contentDir: mockPaths.content,
        outputDir: mockPaths.output,
      });

      expect(() => {
        const metadata = (invalidGenerator as any).getMetadata();
        void metadata;
      }).toThrow('Metadata okunamadı');

      fs.rmSync(tempModelPath, { recursive: true, force: true });
    });

    it('geçersiz yapılandırma dosyası için hata fırlatmalı', () => {
      const configPath = path.join(process.cwd(), 'contentrain-config.json');
      fs.writeFileSync(configPath, 'invalid json');

      expect(() => {
        void new ContentrainTypesGenerator();
      }).toThrow('Yapılandırma dosyası okunamadı');

      fs.unlinkSync(configPath);
    });
  });

  describe('yardımcı Metodlar', () => {
    it('alan adlarını doğru şekilde formatlamalı', () => {
      expect((generator as any).formatPropertyName('normal')).toBe('normal');
      expect((generator as any).formatPropertyName('with-dash')).toBe('\'with-dash\'');
    });

    it('arayüz adlarını doğru şekilde formatlamalı', () => {
      const metadata = { name: 'Test Model', modelId: 'test-model' };
      expect((generator as any).formatInterfaceName(metadata)).toBe('ITestModel');
    });

    it('alanın zorunlu olup olmadığını doğru şekilde kontrol etmeli', () => {
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

      expect((generator as any).isFieldRequired(requiredField)).toBe(true);
      expect((generator as any).isFieldRequired(optionalField)).toBe(false);
      expect((generator as any).isFieldRequired(noValidationField)).toBe(false);
    });

    it('typeScript tiplerini doğru şekilde belirlenmeli', () => {
      const fields = [
        { fieldType: 'string', componentId: 'single-line-text' },
        { fieldType: 'number', componentId: 'integer' },
        { fieldType: 'boolean', componentId: 'checkbox' },
        { fieldType: 'date', componentId: 'date' },
        { fieldType: 'media', componentId: 'media' },
        { fieldType: 'relation', componentId: 'one-to-one' },
        { fieldType: 'relation', componentId: 'one-to-many' },
      ];

      expect((generator as any).determineTypeScriptType(fields[0])).toBe('string');
      expect((generator as any).determineTypeScriptType(fields[1])).toBe('number');
      expect((generator as any).determineTypeScriptType(fields[2])).toBe('boolean');
      expect((generator as any).determineTypeScriptType(fields[3])).toBe('string');
      expect((generator as any).determineTypeScriptType(fields[4])).toBe('string');
      expect((generator as any).determineTypeScriptType(fields[5])).toBe('string');
      expect((generator as any).determineTypeScriptType(fields[6])).toBe('string[]');
    });
  });
});
