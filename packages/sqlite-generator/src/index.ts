import type BetterSQLite3 from 'better-sqlite3';
import type { ModelField, ModelMetadata } from './types';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { DatabaseConnection } from './core/database/connection';
import { TableManager } from './core/database/table';
import { RelationGenerator } from './core/generator/relation';
import { TableGenerator } from './core/generator/table';
import { TypeScriptGenerator } from './core/generator/type';
import { LocalizationManager } from './core/localization/manager';
import { IndexOptimizer } from './core/optimizer/index';
import { QueryOptimizer } from './core/optimizer/query';
import { ContentValidator } from './core/validator/content';
import { ModelValidator } from './core/validator/model';

export interface ContentrainSQLiteConfig {
  modelsDir: string
  contentDir: string
  outputDir: string
  dbName?: string
}

export class ContentrainSQLiteGenerator {
  private config: ContentrainSQLiteConfig;
  private db: BetterSQLite3.Database | null = null;
  private connection: DatabaseConnection;
  private table!: TableManager;
  private tableGenerator!: TableGenerator;
  private relationGenerator!: RelationGenerator;
  private modelValidator: ModelValidator;
  private contentValidator: ContentValidator;
  private indexOptimizer!: IndexOptimizer;
  private queryOptimizer!: QueryOptimizer;
  private localizationManager: LocalizationManager;
  private modelMetadataCache: Record<string, ModelMetadata> = {};
  private modelFieldsCache: Record<string, ModelField[]> = {};

  constructor(config: ContentrainSQLiteConfig) {
    this.config = {
      ...config,
      dbName: config.dbName || 'contentrain.db',
    };

    // Veritabanı bağımsız servisleri başlat
    this.connection = new DatabaseConnection();
    this.modelValidator = new ModelValidator();
    this.contentValidator = new ContentValidator();
    this.localizationManager = new LocalizationManager();
  }

  private async initializeModelData(): Promise<void> {
    // Model metadata'yı oku ve cache'le
    const metadata = await this.readModelMetadata();
    for (const model of metadata) {
      this.modelMetadataCache[model.modelId] = model;

      if (!model.isServerless) {
        // Model fields'ları oku ve cache'le
        const fields = await this.readModelFields(model.modelId);
        this.modelFieldsCache[model.modelId] = fields;
      }
    }
  }

  private initializeDatabaseServices(db: BetterSQLite3.Database): void {
    // Veritabanı bağımlı servisleri başlat
    this.table = new TableManager(db, this.modelMetadataCache, this.modelFieldsCache);
    this.tableGenerator = new TableGenerator(db);
    this.relationGenerator = new RelationGenerator(db);
    this.indexOptimizer = new IndexOptimizer(db);
    this.queryOptimizer = new QueryOptimizer(db);
  }

  async readModelMetadata(): Promise<ModelMetadata[]> {
    const metadataPath = join(this.config.modelsDir, 'metadata.json');
    const metadata = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(metadata);
  }

  async readModelFields(modelId: string): Promise<ModelField[]> {
    const fieldPath = join(this.config.modelsDir, `${modelId}.json`);
    const fields = await fs.readFile(fieldPath, 'utf-8');
    return JSON.parse(fields);
  }

  async readLocalizationCodes(modelId: string): Promise<string[]> {
    const metadata = await this.readModelMetadata();
    const model = metadata.find(m => m.modelId === modelId);

    if (!model?.localization)
      return [];

    const contentPath = join(this.config.contentDir, modelId);
    const files = await fs.readdir(contentPath);

    return files
      .filter(f => f.endsWith('.json') && f !== `${modelId}.json`)
      .map(f => f.replace('.json', ''));
  }

  private async loadContentFile(
    model: string,
    locale: string = 'default',
  ): Promise<any[]> {
    try {
      const metadata = await this.readModelMetadata();
      const modelConfig = metadata.find(m => m.modelId === model);

      if (!modelConfig)
        throw new Error(`Model not found: ${model}`);

      let contentPath: string;

      if (modelConfig.localization) {
        if (!locale || locale === 'default') {
          locale = 'tr'; // SQLite generator için varsayılan dil tr
        }
        contentPath = join(this.config.contentDir, model, `${locale}.json`);
      }
      else {
        if (locale !== 'default') {
          console.warn(`Locale "${locale}" specified for non-localized model "${model}". This parameter will be ignored.`);
        }
        contentPath = join(this.config.contentDir, model, `${model}.json`);
      }

      console.log('İçerik dosyası okunuyor:', { model, locale, contentPath });
      const content = await fs.readFile(contentPath, 'utf-8');

      try {
        return JSON.parse(content);
      }
      catch {
        console.error('İçerik okuma hatası:', {
          model,
          locale,
          contentPath,
        });
        throw new Error(`Failed to load content: Invalid JSON format in ${contentPath}`);
      }
    }
    catch (error: any) {
      if (error.message.includes('Invalid JSON format')) {
        console.error('İçerik okuma hatası:', {
          model,
          locale,
        });
        throw error;
      }
      throw new Error(
        `Failed to load content file for ${model}${locale ? ` (${locale})` : ''}: ${
          error?.message || 'Unknown error'
        }`,
      );
    }
  }

  private async sortModelsByDependency(): Promise<string[]> {
    const graph = new Map<string, Set<string>>();
    const visited = new Set<string>();
    const sorted: string[] = [];

    // Graf oluştur
    for (const [modelId, model] of Object.entries(this.modelMetadataCache)) {
      if (model.isServerless)
        continue;

      const fields = this.modelFieldsCache[modelId];
      const relations = fields.filter(f => f.fieldType === 'relation');

      graph.set(modelId, new Set());
      for (const relation of relations) {
        const targetModel = relation.options?.reference?.form?.reference?.value;
        if (targetModel) {
          graph.get(modelId)!.add(targetModel);
        }
      }
    }

    // Topolojik sıralama
    const visit = (modelId: string) => {
      if (visited.has(modelId))
        return;
      visited.add(modelId);

      const dependencies = graph.get(modelId) || new Set();
      for (const dep of dependencies) {
        visit(dep);
      }

      sorted.push(modelId);
    };

    for (const modelId of graph.keys()) {
      visit(modelId);
    }

    return sorted;
  }

  async createTables(): Promise<void> {
    for (const model of Object.values(this.modelMetadataCache)) {
      if (model.isServerless)
        continue;

      const fields = this.modelFieldsCache[model.modelId];
      await this.tableGenerator.createMainTable(model.modelId, fields);

      if (model.localization) {
        const localizableFields = this.tableGenerator.getLocalizableFields(fields);
        await this.tableGenerator.createLocalizationTable(model.modelId, localizableFields);
      }

      const relations = this.relationGenerator.getRelationFields(fields);
      await this.relationGenerator.createRelations(model.modelId, relations);
    }
  }

  async importContent(): Promise<void> {
    console.log('İçerik aktarımı başlıyor...');

    // Modelleri bağımlılık sırasına göre sırala
    const sortedModels = await this.sortModelsByDependency();
    console.log('Model sıralaması:', sortedModels);

    // Her model için sıralı işlem yap
    for (const modelId of sortedModels) {
      const model = this.modelMetadataCache[modelId];
      if (model.isServerless) {
        console.log(`${modelId} modeli serverless, atlanıyor...`);
        continue;
      }

      try {
        const fields = this.modelFieldsCache[model.modelId];
        console.log(`${model.modelId} modeli için işlemler başlıyor...`);

        // 1. Ana içeriği aktar
        let mainContent: any[];
        if (model.localization) {
          const languages = await this.readLocalizationCodes(model.modelId);
          if (languages.length === 0) {
            throw new Error(`${model.modelId} modeli için dil dosyası bulunamadı`);
          }
          mainContent = await this.loadContentFile(model.modelId, languages[0]);
          console.log(`${model.modelId} modeli için ${languages[0]} dilinden ana içerik yüklendi`);
        }
        else {
          mainContent = await this.loadContentFile(model.modelId);
          console.log(`${model.modelId} modeli için ana içerik yüklendi`);
        }

        if (!mainContent || !Array.isArray(mainContent)) {
          console.log(`${model.modelId} modeli için içerik bulunamadı`);
          continue;
        }

        // Ana içeriği validate et ve aktar
        const normalizedContent = await this.contentValidator.validateContent(mainContent, fields);
        await this.table.importContent(model.modelId, normalizedContent);
        console.log(`${model.modelId} modeli için ana içerik aktarıldı`);

        // 2. Lokalize içerikleri aktar (varsa)
        if (model.localization) {
          const languages = await this.readLocalizationCodes(model.modelId);
          for (const lang of languages.slice(1)) {
            const i18nContent = await this.loadContentFile(model.modelId, lang);
            if (!i18nContent || !Array.isArray(i18nContent)) {
              console.log(`${model.modelId} modeli için ${lang} dilinde içerik bulunamadı`);
              continue;
            }

            console.log(`${model.modelId} modeli için ${lang} dili aktarılıyor...`);
            const normalizedI18nContent = await this.contentValidator.validateLocalizedContent(
              i18nContent,
              fields,
              lang,
            );
            await this.table.importLocalizedContent(model.modelId, lang, normalizedI18nContent);
            console.log(`${model.modelId} modeli için ${lang} dili aktarıldı`);
          }
        }

        // 3. İlişkileri aktar (varsa)
        const relations = this.relationGenerator.getRelationFields(fields);
        if (relations.length > 0) {
          for (const relation of relations) {
            console.log(`${model.modelId} modeli için ${relation.fieldId} ilişkisi aktarılıyor...`);

            const relationContent = mainContent
              .map((item: any) => {
                const relationData = item[relation.fieldId];
                if (!relationData)
                  return null;

                return Array.isArray(relationData)
                  ? relationData.map((targetId: string) => ({
                      sourceId: String(item.ID),
                      targetId: String(targetId),
                    }))
                  : {
                      sourceId: String(item.ID),
                      targetId: String(relationData),
                    };
              })
              .filter((item): item is { sourceId: string, targetId: string } | { sourceId: string, targetId: string }[] => item !== null)
              .flat();

            if (relationContent.length > 0) {
              await this.table.importRelations(model.modelId, relation.fieldId, relationContent);
              console.log(`${model.modelId} modeli için ${relation.fieldId} ilişkisi aktarıldı`);
            }
          }
        }

        console.log(`${model.modelId} modeli için tüm işlemler tamamlandı`);
      }
      catch (error) {
        console.error(`${model.modelId} modeli için işlem hatası:`, error);
        throw error;
      }
    }

    console.log('İçerik aktarımı tamamlandı');
  }

  async finalizeDatabase(): Promise<void> {
    const metadata = await this.readModelMetadata();

    // Her model için indeksleri oluştur
    for (const model of metadata) {
      if (model.isServerless)
        continue;

      const fields = await this.readModelFields(model.modelId);
      this.indexOptimizer.createIndexes(model.modelId, fields);

      if (model.localization) {
        this.indexOptimizer.createLocalizationIndexes(model.modelId);
      }
    }

    // Veritabanını optimize et
    this.queryOptimizer.optimizeDatabase();
    await this.connection.setReadOnlyMode();
    await this.connection.moveToTargetDir(this.config.outputDir);

    // TypeScript tip tanımlamalarını oluştur
    const dbPath = join(this.config.outputDir, this.config.dbName || 'contentrain.db');
    const outputFile = join(this.config.outputDir, 'contentrain.d.ts');
    const typeScriptGenerator = new TypeScriptGenerator(dbPath, outputFile);
    typeScriptGenerator.generateTypes();
  }

  async generate(): Promise<void> {
    try {
      // 1. Model metadata ve fields'ları oku ve cache'le
      await this.initializeModelData();

      // 2. Model metadata'yı valide et
      await this.modelValidator.validateMetadata(Object.values(this.modelMetadataCache));

      // 3. Her model için field bilgilerini valide et
      for (const model of Object.values(this.modelMetadataCache)) {
        if (model.isServerless)
          continue;

        const fields = this.modelFieldsCache[model.modelId];
        await this.modelValidator.validateFields(fields);

        // 4. Lokalize modeller için dil kodlarını oku
        if (model.localization) {
          const languages = await this.readLocalizationCodes(model.modelId);
          await this.localizationManager.validateLanguages(languages);
        }
      }

      // 5. Veritabanı bağlantısını oluştur
      this.db = await this.connection.createDatabase(join(this.config.outputDir, this.config.dbName || 'contentrain.db'));

      // 6. Veritabanı servislerini başlat
      this.initializeDatabaseServices(this.db);

      // 7. Tabloları ve ilişkileri oluştur
      await this.createTables();

      // 8. İçerikleri aktar
      await this.importContent();

      // 9. Veritabanını hazırla ve hedef dizine taşı
      await this.finalizeDatabase();
    }
    catch (error) {
      if (error instanceof Error) {
        throw new TypeError(`SQLite generation failed: ${error.message}`);
      }
      throw new Error('SQLite generation failed: Unknown error');
    }
    finally {
      if (this.db) {
        this.db.close();
      }
    }
  }
}

export default ContentrainSQLiteGenerator;
