import type BetterSQLite3 from 'better-sqlite3';
import type { ModelField, ModelMetadata } from './types';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { DatabaseConnection } from './core/database/connection';
import { TableManager } from './core/database/table';
import { RelationGenerator } from './core/generator/relation';
import { TableGenerator } from './core/generator/table';
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

  private initializeDatabaseServices(db: BetterSQLite3.Database): void {
    // Veritabanı bağımlı servisleri başlat
    this.table = new TableManager(db);
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

  async createTables(): Promise<void> {
    const metadata = await this.readModelMetadata();

    for (const model of metadata) {
      if (model.isServerless)
        continue;

      const fields = await this.readModelFields(model.modelId);
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
    const metadata = await this.readModelMetadata();

    // Önce ana tablolara içerikleri aktar
    for (const model of metadata) {
      if (model.isServerless)
        continue;

      const fields = await this.readModelFields(model.modelId);

      try {
        if (model.localization) {
          // Önce mevcut dil kodlarını oku
          const languages = await this.readLocalizationCodes(model.modelId);
          if (languages.length === 0) {
            throw new Error(`No language files found for localized model: ${model.modelId}`);
          }
          console.log('Dil kodları bulundu:', { modelId: model.modelId, languages });

          // Her dil için içeriği işle
          for (const lang of languages) {
            const content = await this.loadContentFile(model.modelId, lang);

            if (lang === languages[0]) {
              // İlk dili ana içerik olarak kullan
              console.log('Ana içerik yükleniyor:', { modelId: model.modelId, lang });
              const normalizedContent = await this.contentValidator.validateContent(content, fields);
              await this.table.importContent(model.modelId, normalizedContent);
            }
            else {
              // Diğer dilleri lokalizasyon tablosuna ekle
              console.log('Lokalize içerik yükleniyor:', { modelId: model.modelId, lang });
              const normalizedI18nContent = await this.contentValidator.validateLocalizedContent(content, fields, lang);
              await this.table.importLocalizedContent(model.modelId, lang, normalizedI18nContent);
            }
          }
        }
        else {
          // Lokalize olmayan model için normal içerik yükle
          console.log('Lokalize olmayan içerik yükleniyor:', { modelId: model.modelId });
          const content = await this.loadContentFile(model.modelId);
          const normalizedContent = await this.contentValidator.validateContent(content, fields);
          await this.table.importContent(model.modelId, normalizedContent);
        }
      }
      catch (error) {
        console.error('İçerik aktarım hatası:', {
          model: model.modelId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }

    // Sonra ilişki tablolarına içerikleri aktar
    for (const model of metadata) {
      if (model.isServerless)
        continue;

      const fields = await this.readModelFields(model.modelId);
      const relations = this.relationGenerator.getRelationFields(fields);

      if (relations.length > 0) {
        try {
          let content: any[];
          if (model.localization) {
            // Lokalize model için dil kodlarını oku ve ilk dili kullan
            const languages = await this.readLocalizationCodes(model.modelId);
            if (languages.length === 0) {
              throw new Error(`No language files found for localized model: ${model.modelId}`);
            }
            content = await this.loadContentFile(model.modelId, languages[0]);
          }
          else {
            content = await this.loadContentFile(model.modelId);
          }

          for (const relation of relations) {
            // İlişki verilerini çıkar
            const relationContent = content
              .map((item: any) => {
                const relationData = item[relation.fieldId];
                if (!relationData)
                  return null;

                if (Array.isArray(relationData)) {
                  return relationData.map((targetId: string) => ({
                    sourceId: String(item.ID),
                    targetId: String(targetId),
                  }));
                }

                return {
                  sourceId: String(item.ID),
                  targetId: String(relationData),
                };
              })
              .filter((item): item is { sourceId: string, targetId: string } => item !== null)
              .flat();

            if (relationContent.length > 0) {
              await this.table.importRelations(model.modelId, relation.fieldId, relationContent);
            }
          }
        }
        catch (error) {
          console.error('İlişki aktarım hatası:', {
            model: model.modelId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      }
    }
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
  }

  async generate(): Promise<void> {
    try {
      // 1. Model metadata oku
      const metadata = await this.readModelMetadata();
      await this.modelValidator.validateMetadata(metadata);

      // 2. Her model için field bilgilerini oku ve valide et
      for (const model of metadata) {
        if (model.isServerless)
          continue;

        const fields = await this.readModelFields(model.modelId);
        await this.modelValidator.validateFields(fields);

        // 3. Lokalize modeller için dil kodlarını oku
        if (model.localization) {
          const languages = await this.readLocalizationCodes(model.modelId);
          await this.localizationManager.validateLanguages(languages);
        }
      }

      // 4. Veritabanı bağlantısını oluştur
      this.db = await this.connection.createDatabase(join(this.config.outputDir, this.config.dbName || 'contentrain.db'));

      // 5. Veritabanı servislerini başlat
      this.initializeDatabaseServices(this.db);

      // 6. Tabloları ve ilişkileri oluştur
      await this.createTables();

      // 7. İçerikleri aktar
      await this.importContent();

      // 8. Veritabanını hazırla ve hedef dizine taşı
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
