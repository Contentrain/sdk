import type { ContentrainModelMetadata } from 'packages/types/dist';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { ContentrainGenerator } from './index';

describe('contentrain Tests', () => {
  const cliPath = path.join(__dirname, '../dist/cli.js');
  const mockPaths = {
    models: path.join(__dirname, '__mocks__/contentrain/models'),
    content: path.join(__dirname, '__mocks__/contentrain'),
    output: path.join(__dirname, '__mocks__/output'),
  };

  let generator: ContentrainGenerator;
  let metadata: ContentrainModelMetadata[];
  let modelFiles: string[];
  let modelIds: string[];

  beforeEach(() => {
    generator = new ContentrainGenerator({
      modelsDir: mockPaths.models,
      contentPath: mockPaths.content,
      outputDir: mockPaths.output,
    });
    metadata = JSON.parse(fs.readFileSync(path.join(mockPaths.models, 'metadata.json'), 'utf-8'));
    modelFiles = (generator as any).getModelFiles(mockPaths.models);
    modelIds = metadata.map((model: ContentrainModelMetadata) => model.modelId);
  });

  describe('cLI Tests', () => {
    it('should generate type definitions successfully', async () => {
      const { stdout, stderr } = await new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
        exec(`node ${cliPath} --models ./src/__mocks__/contentrain/models --output ./src/__mocks__/output/contentrain.ts`, (error, stdout, stderr) => {
          if (error)
            reject(new Error(stderr));
          else resolve({ stdout, stderr });
        });
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('✨ Tip tanımları başarıyla oluşturuldu');
    });

    it('should handle missing models directory gracefully', async () => {
      const { stderr } = await new Promise<{ stderr: string }>((resolve) => {
        exec(`node ${cliPath} --models ./nonexistent --output ./src/__mocks__/output/contentrain.ts`, (error, stdout, stderr) => {
          if (error)
            resolve({ stderr });
          else resolve({ stderr: '' });
        });
      });

      expect(stderr).toContain('❌ Tip tanımları oluşturulurken hata oluştu');
    });

    it('should handle invalid output path gracefully', async () => {
      const { stderr } = await new Promise<{ stderr: string }>((resolve) => {
        exec(`node ${cliPath} --models ./__mocks__/contentrain/models --output /invalid/path/contentrain.ts`, (error, stdout, stderr) => {
          if (error)
            resolve({ stderr });
          else resolve({ stderr: '' });
        });
      });

      expect(stderr).toContain('❌ Tip tanımları oluşturulurken hata oluştu');
    });
  });

  describe('generator Core Functions', () => {
    it('should correctly filter JSON files in a directory', () => {
      const expectedFiles = [
        'faqitems.json',
        'meta-tags.json',
        'processes.json',
        'references.json',
        'sections.json',
        'services.json',
        'sociallinks.json',
        'tabitems.json',
        'testimonail-items.json',
        'workcategories.json',
        'workitems.json',
      ];
      expect(modelFiles).toEqual(expectedFiles);
    });

    it('should correctly extract model IDs from file names', () => {
      const expectedIds = [
        'faqitems',
        'meta-tags',
        'processes',
        'references',
        'sections',
        'services',
        'sociallinks',
        'tabitems',
        'testimonail-items',
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
      expect(typeDefinitions).toContain('export type Status = \'draft\' | \'changed\' | \'publish\'');
      expect(typeDefinitions).toContain('export interface BaseContentrainType');
    });

    it('should correctly process model files', () => {
      const typeDefinitions = (generator as any).initializeTypeDefinitions(modelIds);
      const { generatedCount, skippedCount, errors, interfaceNames, updatedTypeDefinitions }
        = (generator as any).processModelFiles(modelFiles, mockPaths.models, typeDefinitions, metadata);

      expect(generatedCount).toEqual(11);
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
        'processes',
        'tabitems',
        'workitems',
        'workcategories',
        'faqitems',
        'sections',
        'sociallinks',
        'references',
        'meta-tags',
        'testimonail-items',
      ];

      expectedInterfaces.forEach((interfaceName) => {
        expect(finalizedTypeDefinitions).toContain(`'${interfaceName}':`);
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
  'testimonail-items': {
      model: 'workitems'
      type: 'one-to-one'
  }
  'workitems': {
      model: 'workcategories'
      type: 'one-to-one'
  }
}`;

      expect(finalizedTypeDefinitions).toContain(expectedRelations);
    });

    it('should correctly generate locale content map', () => {
      const localeContentMap = (generator as any).generateLocaleContentMap(metadata);

      // Genel locale tipi kontrolü
      expect(localeContentMap).toContain('export type AvailableLocale = \'en\' | \'tr\';');

      // Model bazlı locale tipleri kontrolü
      const expectedModels = [
        'services',
        'processes',
        'tabitems',
        'workitems',
        'workcategories',
        'faqitems',
        'sections',
        'meta-tags',
        'testimonail-items',
      ];

      // Her model için locale tip tanımı kontrolü
      expectedModels.forEach((modelId) => {
        const typeName = (generator as any).formatTypeName(modelId);
        expect(localeContentMap).toContain(`export type ${typeName}Locales =`);
      });

      // LocaleContentMap tip tanımı kontrolü
      expect(localeContentMap).toContain('export type LocaleContentMap = {');
      expectedModels.forEach((modelId) => {
        const typeName = (generator as any).formatTypeName(modelId);
        expect(localeContentMap).toContain(`  '${modelId}': ${typeName}Locales[];`);
      });

      // Doğrulama fonksiyonları kontrolü
      expect(localeContentMap).toContain('export const isValidLocale = (locale: string): locale is AvailableLocale =>');
      expectedModels.forEach((modelId) => {
        const typeName = (generator as any).formatTypeName(modelId);
        expect(localeContentMap).toContain(`export const isValid${typeName}Locale = (locale: string): locale is ${typeName}Locales =>`);
      });
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

    it('should correctly generate types', () => {
      (generator as any).generateTypes();
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
  });
});
