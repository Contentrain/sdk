import type { ContentItem, DefaultContentResult, LocalizedContentResult, RelationItem, TranslationItem, TranslationMap } from '../types/content';
import type { Database } from '../types/database';
import type {
  MigrationConfig,
  MigrationDependency,
  MigrationResult,
  MigrationState,
} from '../types/migration';
import type { ModelConfig } from '../types/model';
import { ErrorCode, MigrationError, ValidationError } from '../types/errors';
import { ValidationManager } from '../validation/ValidationManager';
import { DataMigrator } from './DataMigrator';

export class MigrationManager {
  private dataMigrator: DataMigrator;
  private validationManager: ValidationManager;
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
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Executes migrations for all models
   */
  public async executeMigrations(models: ModelConfig[], data: Record<string, {
    contentItems: ContentItem[]
    translations?: TranslationItem[]
    relations?: RelationItem[]
  }>): Promise<MigrationResult[]> {
    this.models = models;
    const results: MigrationResult[] = [];

    try {
      // Migrasyonları hazırla
      this.prepareMigrations(models, data);

      // Bağımlılıklara göre sırala
      const sortedMigrations = this.sortMigrationsByDependencies();

      // Sıralı şekilde migrate et
      await this.db.transaction(async () => {
        for (const migration of sortedMigrations) {
          try {
            await this.executeMigration(migration);

            migration.isCompleted = true;
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
      throw new MigrationError({
        code: ErrorCode.MIGRATION_FAILED,
        message: 'Migrations failed',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  /**
   * Prepares migrations for execution
   */
  private prepareMigrations(models: ModelConfig[], data: Record<string, {
    contentItems: ContentItem[]
    translations?: TranslationItem[]
    relations?: RelationItem[]
  }>): void {
    this.migrations = models.map((model) => {
      const modelData = data[model.id];
      return {
        modelId: model.id,
        contentItems: modelData?.contentItems ?? [],
        translations: modelData?.translations,
        relations: modelData?.relations,
        isCompleted: false,
      };
    });
  }

  /**
   * Executes a single migration
   */
  private async executeMigration(migration: MigrationState): Promise<void> {
    console.log('\n=== Model Migrasyonu Başlıyor ===');
    console.log('Model ID:', migration.modelId);
    console.log('İçerik sayısı:', migration.contentItems.length);
    console.log('Çeviri var mı:', !!migration.translations);
    console.log('İlişki var mı:', !!migration.relations);
    console.log('İlişki sayısı:', migration.relations?.length ?? 0);

    const model = this.findModel(migration.modelId);
    if (!model) {
      throw new MigrationError({
        code: ErrorCode.TARGET_MODEL_NOT_FOUND,
        message: 'Model not found',
        details: { modelId: migration.modelId },
      });
    }

    // Model lokalize ise
    if (model.localization && migration.translations) {
      const result: LocalizedContentResult = {
        contentItems: migration.contentItems,
        translations: this.groupTranslationsByLocale(migration.translations),
      };
      await this.dataMigrator.migrateModelData(model, result);
    }
    // Model lokalize değilse
    else {
      const result: DefaultContentResult = {
        contentItems: migration.contentItems,
      };
      await this.dataMigrator.migrateModelData(model, result);
    }

    // İlişkileri migrate et
    if (migration.relations && migration.relations.length > 0) {
      console.log('\nİlişkiler migrate ediliyor...');
      console.log('İlişki sayısı:', migration.relations.length);
      console.log('İlişkiler:', JSON.stringify(migration.relations, null, 2));

      await this.dataMigrator.migrateRelationData(
        migration.modelId,
        migration.relations,
        this.models,
      );
      console.log('İlişki migrasyonu tamamlandı.');
    }
    else {
      console.log('\nMigre edilecek ilişki bulunamadı.');
    }
  }

  private groupTranslationsByLocale(translations: TranslationItem[]): TranslationMap {
    const result: TranslationMap = {};
    for (const translation of translations) {
      if (!result[translation.locale]) {
        result[translation.locale] = [];
      }
      result[translation.locale].push(translation);
    }
    return result;
  }

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
   * Sorts migrations by their dependencies
   */
  private sortMigrationsByDependencies(): MigrationState[] {
    const dependencies = this.extractDependencies();
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: MigrationState[] = [];

    const visit = (migration: MigrationState) => {
      if (visited.has(migration.modelId))
        return;

      if (visiting.has(migration.modelId)) {
        throw new ValidationError({
          code: ErrorCode.CIRCULAR_DEPENDENCY,
          message: 'Circular dependency detected',
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

    // Visit migrations in reverse order
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
}
