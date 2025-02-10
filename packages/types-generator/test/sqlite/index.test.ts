import type { SQLiteSourceConfig } from '../../src/types/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentrainTypesGenerator } from '../../src';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('sQLite Source Tests', () => {
  const paths = {
    database: path.join(__dirname, '../../../../playground/contentrain-db/contentrain.db'),
    output: path.join(__dirname, '../temp/types'),
  };

  let generator: ContentrainTypesGenerator;

  beforeEach(() => {
    // Test öncesi çıktı dizinini temizle
    if (fs.existsSync(paths.output)) {
      fs.rmSync(paths.output, { recursive: true, force: true });
    }

    const config: SQLiteSourceConfig = {
      source: {
        type: 'sqlite',
        databasePath: paths.database,
      },
      output: {
        dir: paths.output,
      },
    };

    generator = new ContentrainTypesGenerator(config);
  });

  afterEach(() => {
    // Test sonrası çıktı dizinini temizle
    if (fs.existsSync(paths.output)) {
      fs.rmSync(paths.output, { recursive: true, force: true });
    }
  });

  describe('temel İşlevler', () => {
    it('veritabanı tablolarını doğru şekilde okumalı', () => {
      const analyzer = (generator as any).analyzer;
      const tables = analyzer.getTables();
      expect(tables).toContain('tbl_workitems');
      expect(tables).toContain('tbl_processes');
      expect(tables).toContain('tbl_faqitems');
    });

    it('tablo kolonlarını doğru şekilde okumalı', () => {
      const analyzer = (generator as any).analyzer;

      // Ana tablo kolonları
      const mainColumns = analyzer.getColumns('tbl_workitems');
      expect(mainColumns).toContainEqual(expect.objectContaining({
        name: 'id',
        type: 'string',
        notNull: false,
      }));
      expect(mainColumns).toContainEqual(expect.objectContaining({
        name: 'category_id',
        type: 'string',
        notNull: false,
      }));
      expect(mainColumns).toContainEqual(expect.objectContaining({
        name: 'status',
        type: 'string',
        notNull: true,
      }));

      // Çeviri tablosu kolonları
      const translationColumns = analyzer.getColumns('tbl_workitems_translations');
      expect(translationColumns).toContainEqual(expect.objectContaining({
        name: 'title',
        type: 'string',
      }));
      expect(translationColumns).toContainEqual(expect.objectContaining({
        name: 'description',
        type: 'string',
      }));
    });

    it('ilişkileri doğru şekilde okumalı', () => {
      const analyzer = (generator as any).analyzer;
      const relations = analyzer.getRelations('workitems');

      expect(relations).toContainEqual(expect.objectContaining({
        fieldName: 'category',
        targetTable: 'workcategories',
        type: 'one-to-one',
      }));
    });
  });

  describe('tip Üretimi', () => {
    it('temel model için tip tanımlarını doğru şekilde üretmeli', () => {
      const analyzer = (generator as any).analyzer;
      const tableInfo = {
        name: 'work_items',
        columns: [
          { name: 'title', type: 'string', notNull: true },
          { name: 'description', type: 'string', notNull: false },
          { name: 'category_id', type: 'string', notNull: true },
        ],
        relations: [],
      };

      const { typeDefinition } = analyzer.generateTypeForTable(tableInfo);
      expect(typeDefinition).toContain('"title": string');
      expect(typeDefinition).toContain('"description"?: string');
      expect(typeDefinition).toContain('"category_id": string');
    });

    it('ilişkili model için tip tanımlarını doğru şekilde üretmeli', () => {
      const analyzer = (generator as any).analyzer;
      const tableInfo = {
        name: 'work_items',
        columns: [
          { name: 'title', type: 'string', notNull: true },
          { name: 'category_id', type: 'string', notNull: true },
        ],
        relations: [
          {
            fieldName: 'category',
            targetTable: 'work_categories',
            type: 'one-to-one',
          },
        ],
      };

      const { typeDefinition, relations } = analyzer.generateTypeForTable(tableInfo);
      expect(typeDefinition).toContain('"_relations"?: {');
      expect(typeDefinition).toContain('"category": IWorkCategories');
      expect(relations.category).toBeDefined();
      expect(relations.category.model).toBe('IWorkCategories');
    });

    it('çoklu ilişkiler için tip tanımlarını doğru şekilde üretmeli', () => {
      const analyzer = (generator as any).analyzer;
      const tableInfo = {
        name: 'tab_items',
        columns: [
          { name: 'title', type: 'string', notNull: true },
          { name: 'category_id', type: 'string', notNull: true },
        ],
        relations: [
          {
            fieldName: 'category',
            targetTable: 'work_categories',
            type: 'one-to-many',
          },
        ],
      };

      const { typeDefinition, relations } = analyzer.generateTypeForTable(tableInfo);
      expect(typeDefinition).toContain('"_relations"?: {');
      expect(typeDefinition).toContain('"category": IWorkCategories[]');
      expect(relations.category).toBeDefined();
      expect(relations.category.type).toBe('one-to-many');
    });
  });

  describe('dosya İşlemleri', () => {
    it('tip tanımlarını doğru şekilde yazmalı', async () => {
      // Test öncesi çıktı dizinini oluştur
      if (!fs.existsSync(paths.output)) {
        fs.mkdirSync(paths.output, { recursive: true });
      }

      await generator.generate();

      // Dosyanın oluşturulması için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 100));

      const outputPath = path.join(paths.output, 'contentrain.d.ts');

      // Dosya var mı kontrol et
      const fileExists = fs.existsSync(outputPath);
      expect(fileExists).toBe(true);

      if (!fileExists) {
        throw new Error(`Output file not found: ${outputPath}`);
      }

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('export interface IWorkitems');
      expect(content).toContain('export interface IProcesses');
      expect(content).toContain('export interface IFaqitems');
      expect(content).toContain('export interface IWorkcategories');
    });
  });

  describe('hata Yönetimi', () => {
    it('geçersiz veritabanı yolu için hata fırlatmalı', () => {
      const invalidConfig: SQLiteSourceConfig = {
        source: {
          type: 'sqlite',
          databasePath: '/invalid/path/db.sqlite',
        },
        output: {
          dir: paths.output,
        },
      };

      expect(() => {
        const generator = new ContentrainTypesGenerator(invalidConfig);
        return generator;
      }).toThrow();
    });

    it('geçersiz tablo adı için boş dizi döndürmeli', () => {
      const analyzer = (generator as any).analyzer;
      const columns = analyzer.getColumns('invalid_table');
      expect(columns).toEqual([]);
    });
  });

  describe('tip Dönüşümleri', () => {
    it('sQLite tiplerini TypeScript tiplerine doğru şekilde dönüştürmeli', () => {
      const analyzer = (generator as any).analyzer;
      expect(analyzer.mapSQLiteTypeToTS('INTEGER')).toBe('number');
      expect(analyzer.mapSQLiteTypeToTS('REAL')).toBe('number');
      expect(analyzer.mapSQLiteTypeToTS('TEXT')).toBe('string');
      expect(analyzer.mapSQLiteTypeToTS('BLOB')).toBe('Buffer');
      expect(analyzer.mapSQLiteTypeToTS('BOOLEAN')).toBe('boolean');
    });
  });

  describe('çeviri Desteği', () => {
    it('çeviri tablolarını doğru şekilde tespit etmeli', () => {
      const analyzer = (generator as any).analyzer;
      const tables = analyzer.getTables();
      expect(tables).toContain('tbl_workitems_translations');
      expect(tables).toContain('tbl_processes_translations');
    });

    it('çevirili ve çevirisiz alanları doğru şekilde ayırmalı', () => {
      const analyzer = (generator as any).analyzer;
      const mainColumns = analyzer.getColumns('tbl_workitems');
      const translationColumns = analyzer.getColumns('tbl_workitems_translations');

      interface Column { name: string }

      // Ana tabloda olması gereken kolonlar
      expect(mainColumns.map((c: Column) => c.name)).toContain('id');
      expect(mainColumns.map((c: Column) => c.name)).toContain('status');
      expect(mainColumns.map((c: Column) => c.name)).toContain('created_at');
      expect(mainColumns.map((c: Column) => c.name)).toContain('updated_at');

      // Çeviri tablosunda olması gereken kolonlar
      expect(translationColumns.map((c: Column) => c.name)).toContain('id');
      expect(translationColumns.map((c: Column) => c.name)).toContain('locale');
      expect(translationColumns.map((c: Column) => c.name)).toContain('title');
      expect(translationColumns.map((c: Column) => c.name)).toContain('description');
    });
  });
});
