import type {
  ContentItem,
  DefaultContentResult,
  LocalizedContentResult,
  RelationItem,
  TranslationItem,
} from './types/content';
import type { ModelConfig } from './types/model';

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { DatabaseAdapter } from './adapters/DatabaseAdapter';
import { ContentAnalyzer } from './analyzer/ContentAnalyzer';
import { ModelAnalyzer } from './analyzer/ModelAnalyzer';
import { RelationAnalyzer } from './analyzer/RelationAnalyzer';
import { TypeGenerator } from './generators/TypeGenerator';
import { MigrationManager } from './migration/MigrationManager';
import { SchemaBuilder } from './schema/SchemaBuilder';
import { ContentrainError, ErrorCode, ValidationError } from './types/errors';
import { DatabaseOptimizer } from './utils/DatabaseOptimizer';
import { SecurityManager } from './utils/SecurityManager';

export { DatabaseAdapter } from './adapters/DatabaseAdapter';
export { TypeGenerator } from './generators/TypeGenerator';
export { MigrationManager } from './migration/MigrationManager';
export { SchemaBuilder } from './schema/SchemaBuilder';

export * from './types/content';
export * from './types/errors';
export * from './types/model';
export { DatabaseOptimizer } from './utils/DatabaseOptimizer';
export { SecurityManager } from './utils/SecurityManager';

/**
 * SQLite Generator yapılandırması
 */
export interface SQLiteGeneratorConfig {
  /**
   * Model tanımlarının bulunduğu dizin
   */
  modelsDir: string

  /**
   * İçerik dosyalarının bulunduğu dizin
   */
  contentDir: string

  /**
   * Çıktı dizini
   */
  outputDir: string

  /**
   * Veritabanı dosya adı
   */
  dbName?: string

  /**
   * Tip tanımları dosya adı
   */
  typesFile?: string

  /**
   * Önbellek yapılandırması
   */
  cache?: {
    enabled?: boolean
    ttl?: number
  }

  /**
   * Güvenlik yapılandırması
   */
  security?: {
    validateInput?: boolean
    maxInputLength?: number
  }

  /**
   * Veritabanı optimizasyon yapılandırması
   */
  optimization?: {
    enableWAL?: boolean
    cacheSize?: number
    pageSize?: number
    journalSize?: number
  }
}

/**
 * SQLite Generator ana sınıfı
 */
export class SQLiteGenerator {
  private config: Required<SQLiteGeneratorConfig>;
  private dbAdapter?: DatabaseAdapter;
  private typeGenerator: TypeGenerator;
  private schemaBuilder?: SchemaBuilder;
  private migrationManager?: MigrationManager;
  private securityManager: SecurityManager;
  private databaseOptimizer?: DatabaseOptimizer;
  private contentAnalyzer: ContentAnalyzer;
  private modelAnalyzer: ModelAnalyzer;

  constructor(config: SQLiteGeneratorConfig) {
    // Varsayılan yapılandırma
    this.config = {
      modelsDir: config.modelsDir,
      contentDir: config.contentDir,
      outputDir: config.outputDir,
      dbName: config.dbName ?? 'contentrain.db',
      typesFile: config.typesFile ?? 'contentrain.d.ts',
      cache: {
        enabled: config.cache?.enabled ?? true,
        ttl: config.cache?.ttl ?? 300,
      },
      security: {
        validateInput: config.security?.validateInput ?? true,
        maxInputLength: config.security?.maxInputLength ?? 1000,
      },
      optimization: {
        enableWAL: config.optimization?.enableWAL ?? true,
        cacheSize: config.optimization?.cacheSize ?? 2000,
        pageSize: config.optimization?.pageSize ?? 4096,
        journalSize: config.optimization?.journalSize ?? 67108864,
      },
    };

    // Temel bileşenleri oluştur
    this.typeGenerator = new TypeGenerator(join(this.config.outputDir, this.config.typesFile));
    this.securityManager = new SecurityManager();
    this.contentAnalyzer = new ContentAnalyzer(this.config.contentDir);
    this.modelAnalyzer = new ModelAnalyzer();
  }

  /**
   * SQLite veritabanı ve tip tanımlarını oluşturur
   */
  public async generate(): Promise<void> {
    try {
      // 1. Dizinleri doğrula
      this.validateDirectories();

      // 2. Veritabanı bağlantısını başlat
      await this.initializeDatabase();

      // 3. Model ve içerikleri analiz et
      const { models, content } = await this.analyzeContent();

      // 4. Tip tanımlarını oluştur
      await this.typeGenerator.generateTypes(models);

      // 5. Veritabanı şemasını oluştur
      await this.schemaBuilder?.buildSchema(models);

      // 6. Verileri migrate et
      await this.migrationManager?.executeMigrations(models, content);

      // 7. Veritabanını optimize et
      this.databaseOptimizer?.optimize();

      console.info('SQLite veritabanı ve tip tanımları başarıyla oluşturuldu.');
    }
    catch (error) {
      console.error('Hata:', error instanceof Error ? error.message : String(error));
      if (error instanceof ContentrainError) {
        console.error('Detaylar:', error.details);
      }
      throw error;
    }
    finally {
      // Bağlantıyı kapat
      this.dbAdapter?.close();
    }
  }

  /**
   * Dizinleri doğrular
   */
  private validateDirectories(): void {
    if (!existsSync(this.config.modelsDir)) {
      throw new ValidationError({
        code: ErrorCode.MODELS_DIR_NOT_FOUND,
        message: 'Models directory not found',
        details: { path: this.config.modelsDir },
      });
    }

    if (!existsSync(this.config.contentDir)) {
      throw new ValidationError({
        code: ErrorCode.CONTENT_DIR_NOT_FOUND,
        message: 'Content directory not found',
        details: { path: this.config.contentDir },
      });
    }

    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Veritabanı bağlantısını başlatır
   */
  private async initializeDatabase(): Promise<void> {
    const dbPath = join(this.config.outputDir, this.config.dbName);
    this.dbAdapter = new DatabaseAdapter(dbPath);
    await this.dbAdapter.initialize();

    this.schemaBuilder = new SchemaBuilder(this.dbAdapter, this.securityManager);
    this.migrationManager = new MigrationManager(this.dbAdapter);
    this.databaseOptimizer = new DatabaseOptimizer(this.dbAdapter);

    if (this.config.optimization.enableWAL) {
      this.databaseOptimizer.optimize();
    }
  }

  /**
   * Analyzes content and prepares for migration
   */
  private async analyzeContent(): Promise<{
    models: ModelConfig[]
    content: Record<string, {
      contentItems: ContentItem[]
      translations?: TranslationItem[]
      relations?: RelationItem[]
    }>
  }> {
    // Modelleri analiz et
    const models = await this.modelAnalyzer.analyzeModels(this.config.modelsDir);

    // İlişkileri doğrula
    const relationAnalyzer = new RelationAnalyzer(models);
    relationAnalyzer.validateRelations();

    // İçerikleri analiz et
    const content: Record<string, {
      contentItems: ContentItem[]
      translations?: TranslationItem[]
      relations?: RelationItem[]
    }> = {};

    for (const model of models) {
      const result = await this.contentAnalyzer.analyzeContent(model);

      if (this.isLocalizedContent(result)) {
        content[model.id] = {
          contentItems: result.contentItems,
          translations: Object.values(result.translations).flat(),
        };
      }
      else {
        content[model.id] = {
          contentItems: result.contentItems,
        };
      }
    }

    return { models, content };
  }

  /**
   * Type guard for LocalizedContentResult
   */
  private isLocalizedContent(content: LocalizedContentResult | DefaultContentResult): content is LocalizedContentResult {
    return 'translations' in content;
  }
}
