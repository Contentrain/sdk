import type { ContentItem, RawContentItem, RelationItem, TranslationItem } from '../types/content';
import type { Database } from '../types/database';
import type {
  MigrationConfig,
  MigrationDependency,
  MigrationResult,
  MigrationState,
} from '../types/migration';
import type { ModelConfig } from '../types/model';
import { DefaultContentTransformer } from '../normalizer/ContentTransformer';
import { ErrorCode, MigrationError, ValidationError } from '../types/errors';
import { ValidationManager } from '../validation/ValidationManager';
import { DataMigrator } from './DataMigrator';

export class MigrationManager {
  private dataMigrator: DataMigrator;
  private validationManager: ValidationManager;
  private contentTransformer: DefaultContentTransformer;
  private migrations: MigrationState[] = [];
  private models: ModelConfig[] = [];
  private readonly defaultConfig: Required<MigrationConfig> = {
    batchSize: 1000,
    retryCount: 3,
    timeout: 30000,
    validateOnly: false,
  };

  constructor(
    private db: Database,
    private config: MigrationConfig = {},
  ) {
    this.dataMigrator = new DataMigrator(db);
    this.validationManager = new ValidationManager();
    this.contentTransformer = new DefaultContentTransformer();
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Executes migrations for all models
   */
  public async executeMigrations(models: ModelConfig[], data: Record<string, {
    items: ContentItem[]
    translations?: TranslationItem[]
    relations?: RelationItem[]
  }>): Promise<MigrationResult[]> {
    this.models = models;
    const results: MigrationResult[] = [];

    try {
      // Validate models and prepare migrations
      this.validateModels();
      this.prepareMigrations(models, data);

      // Sort migrations by dependencies
      const sortedMigrations = this.sortMigrationsByDependencies();

      // Execute migrations in order
      await this.db.transaction(async () => {
        for (const migration of sortedMigrations) {
          try {
            await this.executeMigration(migration);
            migration.isCompleted = true;
            await this.saveMigrationHistory(migration);

            results.push({
              success: true,
              modelId: migration.modelId,
              type: 'model',
            });
          }
          catch (error) {
            migration.error = error instanceof Error ? error.message : String(error);
            results.push({
              success: false,
              modelId: migration.modelId,
              type: 'model',
              error: migration.error,
            });

            if (!this.config.validateOnly) {
              await this.rollbackMigrations();
              throw new MigrationError({
                code: ErrorCode.MIGRATION_FAILED,
                message: 'Migration failed',
                details: { modelId: migration.modelId, error: migration.error },
              });
            }
          }
        }
      });

      return results;
    }
    catch (error) {
      if (!this.config.validateOnly) {
        await this.rollbackMigrations();
      }
      throw new MigrationError({
        code: ErrorCode.MIGRATION_FAILED,
        message: 'Migrations failed',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  /**
   * Validates models before migration
   */
  private validateModels(): void {
    if (!this.models.length) {
      throw new ValidationError({
        code: ErrorCode.NO_MODELS_FOUND,
        message: 'No models to migrate',
      });
    }

    // Her model için validasyon
    for (const model of this.models) {
      this.validationManager.validateModel(model);
    }

    // Model bağımlılıklarını kontrol et
    for (const model of this.models) {
      for (const field of model.fields) {
        if (field.fieldType === 'relation') {
          const targetModel = field.options?.reference?.form?.reference?.value;
          if (targetModel && !this.models.some(m => m.id === targetModel)) {
            throw new ValidationError({
              code: ErrorCode.MISSING_RELATION_TARGET,
              message: 'Missing relation target',
              details: { modelId: model.id, targetModel },
            });
          }
        }
      }
    }
  }

  /**
   * Prepares migrations for execution
   */
  private prepareMigrations(models: ModelConfig[], data: Record<string, {
    items: ContentItem[]
    translations?: TranslationItem[]
    relations?: RelationItem[]
  }>): void {
    this.migrations = models.map(model => ({
      modelId: model.id,
      items: data[model.id]?.items ?? [],
      translations: data[model.id]?.translations,
      relations: data[model.id]?.relations,
      isCompleted: false,
    }));
  }

  /**
   * Sorts migrations by their dependencies
   */
  private sortMigrationsByDependencies(): MigrationState[] {
    const dependencies = this.extractDependencies();
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: MigrationState[] = [];

    const visit = (migration: MigrationState) => {
      if (visited.has(migration.modelId)) {
        return;
      }

      if (visiting.has(migration.modelId)) {
        throw new ValidationError({
          code: ErrorCode.CIRCULAR_DEPENDENCY,
          message: 'Circular dependency',
          details: { modelId: migration.modelId },
        });
      }

      visiting.add(migration.modelId);

      // Visit dependencies first
      const modelDeps = dependencies.filter(d => d.sourceModelId === migration.modelId);
      for (const dep of modelDeps) {
        const depMigration = this.migrations.find(m => m.modelId === dep.targetModelId);
        if (depMigration) {
          visit(depMigration);
        }
      }

      visiting.delete(migration.modelId);
      visited.add(migration.modelId);

      if (!sorted.some(m => m.modelId === migration.modelId)) {
        sorted.push(migration);
      }
    };

    // Visit migrations in reverse order to handle dependencies correctly
    for (let i = this.migrations.length - 1; i >= 0; i--) {
      const migration = this.migrations[i];
      if (!visited.has(migration.modelId)) {
        visit(migration);
      }
    }

    return sorted;
  }

  /**
   * Extracts dependencies between models
   */
  private extractDependencies(): MigrationDependency[] {
    const dependencies: MigrationDependency[] = [];

    for (const model of this.models) {
      for (const field of model.fields) {
        if (field.fieldType === 'relation' && field.options?.reference?.form?.reference?.value) {
          dependencies.push({
            sourceModelId: model.id,
            targetModelId: field.options.reference.form.reference.value,
            fieldId: field.fieldId,
            type: field.componentId === 'one-to-many' ? 'one-to-many' : 'one-to-one',
          });
        }
      }
    }

    return dependencies;
  }

  private transformToRawContent(items: ContentItem[]): RawContentItem[] {
    return items.map(item => this.contentTransformer.denormalizeContent(item));
  }

  /**
   * Executes a single migration
   */
  private async executeMigration(migration: MigrationState): Promise<void> {
    const model = this.findModel(migration.modelId);
    if (!model) {
      throw new MigrationError({
        code: ErrorCode.TARGET_MODEL_NOT_FOUND,
        message: 'Model not found',
        details: { modelId: migration.modelId },
      });
    }

    // Migrate model data
    const rawItems = this.transformToRawContent(migration.items);
    await this.dataMigrator.migrateModelData(model, rawItems);

    // Migrate translations if model is localized
    if (model.localization && migration.translations?.length) {
      await this.dataMigrator.migrateTranslationData(model, migration.translations);
    }

    // Migrate relations if any
    if (migration.relations?.length) {
      await this.dataMigrator.migrateRelationData(
        migration.modelId,
        migration.relations,
        this.models,
      );
    }
  }

  /**
   * Rolls back completed migrations
   */
  private async rollbackMigrations(): Promise<void> {
    const completedMigrations = this.migrations
      .filter(m => m.isCompleted)
      .reverse();

    for (const migration of completedMigrations) {
      try {
        await this.rollbackMigration(migration);
        migration.isCompleted = false;
      }
      catch (error) {
        throw new MigrationError({
          code: ErrorCode.ROLLBACK_FAILED,
          message: 'Rollback failed',
          details: { modelId: migration.modelId, error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
  }

  /**
   * Rolls back a single migration
   */
  private async rollbackMigration(migration: MigrationState): Promise<void> {
    const model = this.findModel(migration.modelId);
    if (!model) {
      return;
    }

    await this.db.transaction(async () => {
      // Clean up relations
      if (migration.relations?.length) {
        await this.db.run(
          'DELETE FROM tbl_contentrain_relations WHERE source_model = @id',
          { id: model.id },
        );
      }

      // Clean up translations
      if (model.localization && migration.translations?.length) {
        const translationTable = `tbl_${model.id}_translations`;
        await this.db.run(
          `DELETE FROM ${translationTable} WHERE id IN (SELECT id FROM tbl_${model.id})`,
        );
      }

      // Clean up model data
      const modelTable = `tbl_${model.id}`;
      await this.db.run(
        `DELETE FROM ${modelTable}`,
      );
    });
  }

  /**
   * Finds model by ID
   */
  private findModel(modelId: string): ModelConfig | undefined {
    return this.models.find(m => m.id === modelId);
  }

  /**
   * Gets current migration states
   */
  public getMigrationStates(): MigrationState[] {
    return this.migrations;
  }

  /**
   * Saves migration history
   */
  private async saveMigrationHistory(migration: MigrationState): Promise<void> {
    const history = {
      id: `${migration.modelId}_${Date.now()}`,
      model_id: migration.modelId,
      type: 'model',
      status: migration.isCompleted ? 'completed' : 'failed',
      completed_at: new Date().toISOString(),
      error: migration.error,
    } as Record<string, unknown>;

    await this.db.run(
      `INSERT INTO tbl_migration_history (
        id,
        model_id,
        type,
        status,
        completed_at,
        error
      ) VALUES (
        @id,
        @model_id,
        @type,
        @status,
        @completed_at,
        @error
      )`,
      history,
    );
  }
}
