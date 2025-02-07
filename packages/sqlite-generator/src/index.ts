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
import { QueryBuilder } from './query/QueryBuilder';
import { SchemaBuilder } from './schema/SchemaBuilder';
import { ContentrainError, ErrorCode, ValidationError } from './types/errors';
import { DatabaseOptimizer } from './utils/DatabaseOptimizer';
import { SecurityManager } from './utils/SecurityManager';

export { DatabaseAdapter } from './adapters/DatabaseAdapter';
export { TypeGenerator } from './generators/TypeGenerator';
export { MigrationManager } from './migration/MigrationManager';
export { QueryBuilder } from './query/QueryBuilder';
export { SchemaBuilder } from './schema/SchemaBuilder';

export * from './types/content';
export * from './types/database';
export * from './types/errors';
export * from './types/model';
export * from './types/query';
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

      // 4. Veritabanı şemasını oluştur
      await this.schemaBuilder?.buildSchema(models);

      // 5. Şema bilgilerini topla
      const dbSchema = await this.collectDatabaseSchema();

      // 6. Tip tanımlarını oluştur
      await this.typeGenerator.generateTypes(models, dbSchema);

      // 7. Verileri migrate et
      await this.migrationManager?.executeMigrations(models, content);

      // 8. Veritabanını optimize et
      this.databaseOptimizer?.optimize();
    }
    catch (error) {
      if (error instanceof ContentrainError) {
        throw error;
      }
      throw new ContentrainError({
        code: ErrorCode.SCHEMA_CREATION_FAILED,
        message: 'Failed to create database schema',
        cause: error instanceof Error ? error : undefined,
      });
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

      // İlişkileri ekle
      const relationFields = model.fields.filter(f => f.fieldType === 'relation');
      if (relationFields.length > 0) {
        // İlişkileri oluştur
        const relations = relationAnalyzer.analyzeRelations(model, result.contentItems);
        if (relations.length > 0) {
          content[model.id].relations = relations;
        }
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

  /**
   * Veritabanı şema bilgilerini toplar
   */
  private async collectDatabaseSchema() {
    if (!this.dbAdapter) {
      throw new Error('Database adapter not initialized');
    }

    // Tüm tabloları al
    const tables = await this.dbAdapter.all<{ name: string }>(
      'SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\'',
    );

    const schema: Record<string, {
      columns: Array<{
        name: string
        type: string
        notNull: boolean
        defaultValue: any
        primaryKey: boolean
      }>
      foreignKeys: Array<{
        from: string
        table: string
        to: string
      }>
      indexes: Array<{
        name: string
        unique: boolean
        columns: string[]
      }>
    }> = {};

    // Her tablo için detaylı bilgi topla
    for (const { name } of tables) {
      // Kolon bilgileri
      const columns = await this.dbAdapter.all(
        `PRAGMA table_info(${name})`,
      );

      // Foreign key bilgileri
      const foreignKeys = await this.dbAdapter.all(
        `PRAGMA foreign_key_list(${name})`,
      );

      // Index bilgileri
      const indexes = await this.dbAdapter.all(
        `PRAGMA index_list(${name})`,
      );

      const indexDetails = await Promise.all(
        indexes.map(async (idx: any) => {
          const columns = await this.dbAdapter!.all(
            `PRAGMA index_info(${idx.name})`,
          );
          return {
            name: idx.name,
            unique: idx.unique === 1,
            columns: columns.map((col: any) => col.name),
          };
        }),
      );

      schema[name] = {
        columns: columns.map((col: any) => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value,
          primaryKey: col.pk === 1,
        })),
        foreignKeys: foreignKeys.map((fk: any) => ({
          from: fk.from,
          table: fk.table,
          to: fk.to,
        })),
        indexes: indexDetails,
      };
    }

    return schema;
  }
}
