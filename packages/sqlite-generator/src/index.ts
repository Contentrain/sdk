import type { ContentItem, RawContentItem, RelationItem } from './types/content';
import type { ModelConfig } from './types/model';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseAdapter } from './adapters/DatabaseAdapter';
import { ContentAnalyzer } from './analyzer/ContentAnalyzer';
import { ModelAnalyzer } from './analyzer/ModelAnalyzer';
import { RelationAnalyzer } from './analyzer/RelationAnalyzer';
import { DataMigrator } from './migration/DataMigrator';
import { DefaultContentTransformer } from './normalizer/ContentTransformer';
import { SchemaBuilder } from './schema/SchemaBuilder';
import { ErrorCode, ValidationError } from './types/errors';

/**
 * Configuration for ContentrainSQL
 */
export interface ContentrainSQLConfig {
  modelsDir: string
  contentDir: string
  outputPath: string
  dbName: string
}

/**
 * Main class for converting JSON content to SQLite database
 */
export class ContentrainSQL {
  private modelAnalyzer: ModelAnalyzer;
  private contentAnalyzer: ContentAnalyzer;
  private relationAnalyzer!: RelationAnalyzer;
  private schemaBuilder!: SchemaBuilder;
  private dataMigrator!: DataMigrator;
  private models: ModelConfig[] = [];
  private dbAdapter!: DatabaseAdapter;
  private contentTransformer: DefaultContentTransformer;

  constructor(private config: ContentrainSQLConfig) {
    console.info('\n=== ContentrainSQL start ===');
    this.modelAnalyzer = new ModelAnalyzer();
    this.contentAnalyzer = new ContentAnalyzer(config.contentDir);
    this.contentTransformer = new DefaultContentTransformer();
  }

  /**
   * Generates SQLite database from JSON content
   */
  async generate(): Promise<void> {
    try {
      this.validateDirectories();
      await this.initializeDatabase();
      await this.prepare();
      await this.migrate();
    }
    catch (error) {
      console.error('\n=== Error ===');
      console.error('Type:', error instanceof Error ? error.constructor.name : 'Unknown');
      console.error('Message:', error instanceof Error ? error.message : String(error));
      if (error instanceof ValidationError) {
        console.error('Details:', error.details);
        if (error.cause) {
          console.error('Cause:', error.cause.message);
        }
      }
      throw error;
    }
    finally {
      console.info('\n=== Connection closed ===');
      this.close();
    }
  }

  /**
   * Validates required directories
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

    if (!existsSync(this.config.outputPath)) {
      mkdirSync(this.config.outputPath, { recursive: true });
    }
  }

  /**
   * Initializes database connection
   */
  private async initializeDatabase(): Promise<void> {
    const dbPath = join(this.config.outputPath, this.config.dbName);
    this.dbAdapter = new DatabaseAdapter(dbPath);
    await this.dbAdapter.initialize();

    this.schemaBuilder = new SchemaBuilder(this.dbAdapter);
    this.dataMigrator = new DataMigrator(this.dbAdapter);
  }

  /**
   * Closes database connection
   */
  private close(): void {
    if (this.dbAdapter) {
      this.dbAdapter.close();
    }
  }

  /**
   * Prepares models and schema
   */
  private async prepare(): Promise<void> {
    try {
      this.models = await this.modelAnalyzer.analyzeModels(this.config.modelsDir);

      if (!this.models || this.models.length === 0) {
        throw new ValidationError({
          code: ErrorCode.NO_MODELS_FOUND,
          message: 'No models found',
          details: { modelsDir: this.config.modelsDir },
        });
      }

      this.relationAnalyzer = new RelationAnalyzer(this.models);
      this.relationAnalyzer.validateRelations();
      await this.schemaBuilder.buildSchema(this.models);
    }
    catch (error) {
      console.error('\n=== Model Preparation Error ===');
      console.error('Type:', error instanceof Error ? error.constructor.name : 'Unknown');
      console.error('Message:', error instanceof Error ? error.message : String(error));
      if (error instanceof ValidationError) {
        console.error('Details:', error.details);
        if (error.cause) {
          console.error('Cause:', error.cause.message);
        }
      }
      throw error;
    }
  }

  /**
   * Migrates content to database
   */
  private async migrate(): Promise<void> {
    try {
      const sortedModels = this.sortModelsByRelations();
      for (const model of sortedModels) {
        const result = await this.contentAnalyzer.analyzeContent(model);
        await this.migrateContent(model, result.items);

        if (model.localization && result.translations) {
          const translations = Object.values(result.translations).flat();
          if (translations.length > 0) {
            await this.dataMigrator.migrateTranslationData(model, translations);
          }
        }
      }
    }
    catch (error) {
      console.error('\n=== Data Migration Error ===');
      console.error('Type:', error instanceof Error ? error.constructor.name : 'Unknown');
      console.error('Message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Sorts models by their relations to handle dependencies
   */
  private sortModelsByRelations(): ModelConfig[] {
    const sorted: ModelConfig[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (modelId: string) => {
      if (visited.has(modelId))
        return;
      if (visiting.has(modelId)) {
        console.warn(`Circular dependency detected: ${modelId}`);
        return;
      }

      visiting.add(modelId);

      const model = this.models.find(m => m.id === modelId);
      if (!model) {
        console.warn(`Model not found: ${modelId}`);
        return;
      }

      const relations = model.fields
        .filter(field => field.options?.reference?.value)
        .map(field => field.options!.reference!.form.reference.value);

      for (const relationId of relations) {
        visit(relationId);
      }

      visiting.delete(modelId);
      visited.add(modelId);

      if (!sorted.some(m => m.id === model.id)) {
        sorted.push(model);
      }
    };

    for (const model of this.models) {
      visit(model.id);
    }

    return sorted;
  }

  private transformToRawContent(items: ContentItem[]): RawContentItem[] {
    return items.map(item => this.contentTransformer.denormalizeContent(item));
  }

  public async migrateContent(model: ModelConfig, items: ContentItem[]): Promise<void> {
    const rawItems = this.transformToRawContent(items);
    await this.dataMigrator.migrateModelData(model, rawItems);
  }
}
