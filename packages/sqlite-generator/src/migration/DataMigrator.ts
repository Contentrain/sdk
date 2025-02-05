import type { ContentItem, RawContentItem, RelationItem, TranslationItem } from '../types/content';
import type { Database, PreparedStatement } from '../types/database';
import type { ContentrainBaseType, ModelConfig } from '../types/model';
import { DefaultContentTransformer } from '../normalizer/ContentTransformer';
import { FieldNormalizer } from '../normalizer/FieldNormalizer';
import { ErrorCode, MigrationError } from '../types/errors';
import { ValidationManager } from '../validation/ValidationManager';

export class DataMigrator {
  private fieldNormalizer: FieldNormalizer;
  private validationManager: ValidationManager;
  private contentTransformer: DefaultContentTransformer;
  private readonly BATCH_SIZE = 1000;

  constructor(private db: Database) {
    this.fieldNormalizer = new FieldNormalizer();
    this.validationManager = new ValidationManager();
    this.contentTransformer = new DefaultContentTransformer();
  }

  /**
   * Migrates model data to database
   */
  public async migrateModelData(model: ModelConfig, items: RawContentItem[]): Promise<void> {
    const tableName = this.fieldNormalizer.normalizeTableName(model.id);
    const modelStmt = this.prepareModelStatement(tableName, model);

    try {
      await this.db.transaction(async () => {
        for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
          const batch = items.slice(i, i + this.BATCH_SIZE);
          await this.processBatch(batch, modelStmt, model);
        }
      });
    }
    catch (error) {
      throw new MigrationError({
        code: ErrorCode.MODEL_MIGRATION_FAILED,
        message: 'Failed to migrate model data',
        details: { modelId: model.id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Migrates translation data to database
   */
  public async migrateTranslationData(model: ModelConfig, translations: TranslationItem[]): Promise<void> {
    if (!translations.length) {
      return;
    }

    const tableName = `${this.fieldNormalizer.normalizeTableName(model.id)}_translations`;
    const stmt = this.prepareTranslationStatement(tableName, model);

    try {
      await this.db.transaction(async () => {
        for (let i = 0; i < translations.length; i += this.BATCH_SIZE) {
          const batch = translations.slice(i, i + this.BATCH_SIZE);
          await this.processTranslationBatch(batch, stmt, model);
        }
      });
    }
    catch (error) {
      throw new MigrationError({
        code: ErrorCode.TRANSLATION_MIGRATION_FAILED,
        message: 'Failed to migrate translation data',
        details: { modelId: model.id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Migrates relation data to database
   */
  public async migrateRelationData(
    sourceId: string,
    relations: RelationItem[],
    models: ModelConfig[],
  ): Promise<void> {
    for (const relation of relations) {
      // Kaynak verinin varlığını kontrol et
      const sourceExists = await this.checkRecordExists(
        relation.sourceModel,
        relation.sourceId,
      );
      if (!sourceExists) {
        throw new MigrationError({
          code: ErrorCode.SOURCE_RECORD_NOT_FOUND,
          message: 'Source record not found',
          details: {
            model: relation.sourceModel,
            id: relation.sourceId,
          },
        });
      }

      // Hedef verinin varlığını kontrol et
      const targetExists = await this.checkRecordExists(
        relation.targetModel,
        relation.targetId,
      );
      if (!targetExists) {
        throw new MigrationError({
          code: ErrorCode.TARGET_RECORD_NOT_FOUND,
          message: 'Target record not found',
          details: {
            model: relation.targetModel,
            id: relation.targetId,
          },
        });
      }

      // İlişki tipini kontrol et
      const sourceModel = models.find(m => m.id === relation.sourceModel);
      const relationField = sourceModel?.fields.find(
        f => f.fieldId === relation.fieldId,
      );

      if (!relationField || relationField.fieldType !== 'relation') {
        throw new MigrationError({
          code: ErrorCode.INVALID_RELATION_FIELD,
          message: 'Invalid relation field',
          details: {
            model: relation.sourceModel,
            fieldId: relation.fieldId,
          },
        });
      }

      // İlişki kısıtlamalarını kontrol et
      if (relationField.componentId === 'one-to-one') {
        const existingRelation = await this.findExistingRelation(
          relation.sourceModel,
          relation.fieldId,
          relation.targetModel,
        );

        if (existingRelation) {
          throw new MigrationError({
            code: ErrorCode.ONE_TO_ONE_VIOLATION,
            message: 'One-to-one relation violation',
            details: {
              sourceModel: relation.sourceModel,
              sourceId: relation.sourceId,
              targetModel: relation.targetModel,
              fieldId: relation.fieldId,
            },
          });
        }
      }

      // İlişkiyi kaydet
      await this.insertRelation(relation);
    }
  }

  /**
   * Processes a batch of model data
   */
  private async processBatch(
    batch: RawContentItem[],
    stmt: PreparedStatement,
    model: ModelConfig,
  ): Promise<void> {
    for (const item of batch) {
      if (!this.validationManager.isValidContentItem(item)) {
        throw new MigrationError({
          code: ErrorCode.MODEL_MIGRATION_FAILED,
          message: 'Invalid content item',
          details: { item: JSON.stringify(item) },
        });
      }

      const normalizedItem = this.normalizeContentItem(item);
      const modelValues = this.extractModelValues(model, normalizedItem);

      try {
        stmt.run(modelValues);
      }
      catch (error) {
        throw new MigrationError({
          code: ErrorCode.MODEL_MIGRATION_FAILED,
          message: 'Failed to insert model data',
          details: {
            modelId: model.id,
            itemId: normalizedItem.id,
          },
          cause: error instanceof Error ? error : undefined,
        });
      }
    }
  }

  /**
   * Processes a batch of translation data
   */
  private async processTranslationBatch(
    batch: TranslationItem[],
    stmt: PreparedStatement,
    model: ModelConfig,
  ): Promise<void> {
    for (const translation of batch) {
      if (!this.validationManager.isValidTranslationItem(translation)) {
        throw new MigrationError({
          code: ErrorCode.TRANSLATION_MIGRATION_FAILED,
          message: 'Invalid translation item',
          details: { item: JSON.stringify(translation) },
        });
      }

      const values = await this.extractTranslationValues(model, translation);

      try {
        stmt.run(values);
      }
      catch (error) {
        throw new MigrationError({
          code: ErrorCode.TRANSLATION_MIGRATION_FAILED,
          message: 'Failed to insert translation data',
          details: {
            modelId: model.id,
            itemId: translation.id,
            locale: translation.locale,
          },
          cause: error instanceof Error ? error : undefined,
        });
      }
    }
  }

  /**
   * Processes a batch of relation data
   */
  private async processRelationBatch(
    batch: RelationItem[],
    stmt: PreparedStatement,
  ): Promise<void> {
    for (const relation of batch) {
      if (!this.validationManager.isValidRelationItem(relation)) {
        throw new MigrationError({
          code: ErrorCode.RELATION_MIGRATION_FAILED,
          message: 'Invalid relation item',
          details: { item: JSON.stringify(relation) },
        });
      }

      const values = this.extractRelationValues(relation);

      try {
        stmt.run(values);
      }
      catch (error) {
        throw new MigrationError({
          code: ErrorCode.RELATION_MIGRATION_FAILED,
          message: 'Failed to insert relation data',
          details: {
            sourceModel: relation.sourceModel,
            sourceId: relation.sourceId,
            targetModel: relation.targetModel,
            targetId: relation.targetId,
          },
          cause: error instanceof Error ? error : undefined,
        });
      }
    }
  }

  /**
   * Normalizes content item
   */
  private normalizeContentItem(item: RawContentItem): ContentItem {
    return this.contentTransformer.normalizeContent(item);
  }

  /**
   * Prepares statement for model data
   */
  private prepareModelStatement(tableName: string, model: ModelConfig): PreparedStatement {
    const fields = model.fields
      .filter(field => !field.system && !field.localized)
      .map((field) => {
        const fieldName = this.fieldNormalizer.normalize(field.fieldId);
        return field.fieldType === 'relation'
          ? `${fieldName}_id`
          : fieldName;
      });

    const systemFields = ['id', 'created_at', 'updated_at', 'status'];
    const allFields = [...systemFields, ...fields];

    const sql = `
      INSERT INTO ${tableName} (${allFields.join(', ')})
      VALUES (${allFields.map(f => `@${f}`).join(', ')})
    `;

    return this.db.prepare(sql);
  }

  /**
   * Prepares statement for translation data
   */
  private prepareTranslationStatement(tableName: string, model: ModelConfig): PreparedStatement {
    const fields = model.fields
      .filter(field => field.localized)
      .map((field) => {
        const fieldName = this.fieldNormalizer.normalize(field.fieldId);
        return field.fieldType === 'relation'
          ? `${fieldName}_id`
          : fieldName;
      });

    const systemFields = ['id', 'locale'];
    const allFields = [...systemFields, ...fields];

    const sql = `
      INSERT INTO ${tableName} (${allFields.join(', ')})
      VALUES (${allFields.map(f => `@${f}`).join(', ')})
    `;

    return this.db.prepare(sql);
  }

  /**
   * Prepares statement for relation data
   */
  private prepareRelationStatement(): PreparedStatement {
    const fields = [
      'id',
      'source_model',
      'source_id',
      'target_model',
      'target_id',
      'field_id',
      'type',
    ];

    const sql = `
      INSERT INTO tbl_contentrain_relations (${fields.join(', ')})
      VALUES (${fields.map(f => `@${f}`).join(', ')})
    `;

    return this.db.prepare(sql);
  }

  /**
   * Extracts model values
   */
  private extractModelValues(model: ModelConfig, item: ContentItem): Record<string, unknown> {
    const values: Record<string, unknown> = {
      id: item.id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      status: item.status,
    };

    for (const field of model.fields) {
      if (field.system || field.localized) {
        continue;
      }

      const normalizedName = this.fieldNormalizer.normalize(field.fieldId);
      const value = item[field.fieldId];

      if (field.fieldType === 'relation') {
        const columnName = `${normalizedName}_id`;
        values[columnName] = Array.isArray(value) ? value[0] ?? null : value ?? null;
      }
      else {
        values[normalizedName] = this.normalizeValue(value, field.fieldType);
      }
    }

    return values;
  }

  /**
   * Extracts translation values
   */
  private async extractTranslationValues(
    model: ModelConfig,
    item: TranslationItem,
  ): Promise<Record<string, unknown>> {
    const values: Record<string, unknown> = {
      id: item.id,
      locale: item.locale,
    };

    for (const field of model.fields) {
      if (!field.localized) {
        continue;
      }

      const normalizedName = this.fieldNormalizer.normalize(field.fieldId);
      const value = item[field.fieldId];

      if (field.fieldType === 'relation') {
        const columnName = `${normalizedName}_id`;
        values[columnName] = Array.isArray(value) ? value[0] ?? null : value ?? null;
      }
      else {
        values[normalizedName] = this.normalizeValue(value, field.fieldType);
      }
    }

    return values;
  }

  /**
   * Extracts relation values
   */
  private extractRelationValues(relation: RelationItem): Record<string, unknown> {
    return {
      id: relation.id,
      source_model: relation.sourceModel,
      source_id: relation.sourceId,
      target_model: relation.targetModel,
      target_id: relation.targetId,
      field_id: relation.fieldId,
      type: relation.type,
    };
  }

  /**
   * Normalizes field value
   */
  private normalizeValue(value: unknown, fieldType: ContentrainBaseType): unknown {
    if (value === undefined || value === null) {
      return null;
    }

    switch (fieldType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return value instanceof Date ? value.toISOString() : String(value);
      case 'array':
        return Array.isArray(value) ? JSON.stringify(value) : String(value);
      case 'media':
        return String(value);
      case 'relation':
        return Array.isArray(value) ? value[0] ?? null : value ?? null;
      default:
        return String(value);
    }
  }

  private async checkRecordExists(
    modelId: string,
    recordId: string,
  ): Promise<boolean> {
    const tableName = this.fieldNormalizer.normalizeTableName(modelId);
    const result = await this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE id = @id`,
      { id: recordId },
    );
    return (result?.count ?? 0) > 0;
  }

  private async findExistingRelation(
    sourceModel: string,
    fieldId: string,
    targetModel: string,
  ): Promise<RelationItem | undefined> {
    return this.db.get<RelationItem>(
      `SELECT * FROM contentrain_relations
       WHERE source_model = @sourceModel
       AND field_id = @fieldId
       AND target_model = @targetModel`,
      {
        sourceModel,
        fieldId,
        targetModel,
      },
    );
  }

  private async insertRelation(relation: RelationItem): Promise<void> {
    const stmt = this.prepareRelationStatement();
    const values = this.extractRelationValues(relation);
    stmt.run(values);
  }
}
