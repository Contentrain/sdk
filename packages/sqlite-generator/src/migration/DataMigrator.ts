import type { ContentItem, DefaultContentResult, LocalizedContentResult, RawContentItem, RelationItem, TranslationItem } from '../types/content';
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
  public async migrateModelData(model: ModelConfig, contentResult: LocalizedContentResult | DefaultContentResult): Promise<void> {
    console.log('\n=== Model Verisi Migrate Ediliyor ===');
    console.log(`Model: ${model.id}`);
    console.log('Content Result:', {
      itemCount: contentResult.contentItems.length,
      hasTranslations: 'translations' in contentResult,
      translationCount: 'translations' in contentResult ? Object.keys(contentResult.translations).length : 0,
    });
    console.log('Content Items IDs:', contentResult.contentItems.map(item => item.id));

    const tableName = this.fieldNormalizer.normalizeTableName(model.id);
    console.log(`\nHedef tablo: ${tableName}`);

    try {
      await this.db.transaction(async () => {
        // Ana tablo için statement hazırla
        const modelStmt = this.prepareModelStatement(tableName, model);

        // Lokalize edilmiş model ise çeviri tablosu için de statement hazırla
        let translationStmt = null;
        if (model.localization) {
          const translationTableName = `${tableName}_translations`;
          translationStmt = this.prepareTranslationStatement(translationTableName, model);
        }

        // Ana tabloya kayıtları ekle
        console.log('\n=== Ana Tablo Kayıtları İşleniyor ===');
        for (const item of contentResult.contentItems) {
          console.log(`\nKayıt işleniyor - ID: ${item.id}`);
          console.log('Kayıt içeriği:', item);
          await this.insertMainTableRecord(item, modelStmt, model);
        }

        // Çeviri kayıtlarını ekle
        if (model.localization && translationStmt && 'translations' in contentResult) {
          console.log('\n=== Çeviri Kayıtları İşleniyor ===');
          for (const [locale, translations] of Object.entries(contentResult.translations)) {
            console.log(`\nDil: ${locale}, Çeviri sayısı: ${translations.length}`);
            for (const translation of translations) {
              console.log(`Çeviri işleniyor - ID: ${translation.id}, Locale: ${locale}`);
              await this.insertTranslationRecord(translation, locale, translationStmt, model);
            }
          }
        }
      });

      console.log('\n=== Model Verisi Başarıyla Migrate Edildi ===');
    }
    catch (error) {
      console.error('\n!!! Model Verisi Migrate Edilirken Hata Oluştu !!!');
      console.error('Hata:', error);
      throw new MigrationError({
        code: ErrorCode.MODEL_MIGRATION_FAILED,
        message: 'Failed to migrate model data',
        details: { modelId: model.id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private groupItemsById(items: RawContentItem[]): Map<string, Map<string, RawContentItem>> {
    console.log('\n=== Kayıtlar ID\'ye Göre Gruplandırılıyor ===');
    const groupedItems = new Map<string, Map<string, RawContentItem>>();

    for (const item of items) {
      const id = item.ID;
      const locale = this.getLocaleFromItem(item);

      if (!groupedItems.has(id)) {
        groupedItems.set(id, new Map());
      }

      const localeMap = groupedItems.get(id)!;
      if (localeMap.has(locale)) {
        console.warn(`Uyarı: ${id} ID'li kayıt ${locale} dili için zaten mevcut, üzerine yazılıyor`);
      }
      localeMap.set(locale, item);
    }

    // Gruplama istatistikleri
    console.log('\nGruplama sonuçları:');
    console.log(`Toplam benzersiz ID: ${groupedItems.size}`);
    for (const [id, localeMap] of groupedItems) {
      console.log(`ID: ${id}, Dil sayısı: ${localeMap.size}, Diller: ${Array.from(localeMap.keys()).join(', ')}`);
    }

    return groupedItems;
  }

  private async insertMainTableRecord(
    item: ContentItem,
    stmt: PreparedStatement,
    model: ModelConfig,
  ): Promise<void> {
    try {
      const tableName = this.fieldNormalizer.normalizeTableName(model.id);
      console.log('\n=== Ana Tablo Kaydı Kontrol Ediliyor ===');
      console.log(`Tablo: ${tableName}`);
      console.log(`ID: ${item.id}`);

      // Mevcut kaydı kontrol et
      const existingRecord = await this.db.get(
        `SELECT id FROM ${tableName} WHERE id = @id`,
        { id: item.id },
      );

      console.log('Mevcut kayıt kontrolü:', {
        id: item.id,
        exists: !!existingRecord,
      });

      const values = this.extractModelValues(model, item);
      console.log('Hazırlanan değerler:', values);

      if (existingRecord) {
        console.log(`ID ${item.id} için mevcut kayıt bulundu, güncelleniyor...`);
        const updateResult = await this.db.run(
          `UPDATE ${tableName} SET ${Object.keys(values)
            .filter(key => key !== 'id')
            .map(key => `${key} = @${key}`)
            .join(', ')}
                WHERE id = @id`,
          { ...values, id: item.id },
        );
        console.log('Güncelleme sonucu:', updateResult);
      }
      else {
        console.log(`ID ${item.id} için yeni kayıt ekleniyor...`);
        const insertResult = stmt.run(values);
        console.log('Ekleme sonucu:', insertResult);
      }
    }
    catch (error) {
      console.error('Ana tablo kaydı eklenirken hata:', error);
      throw new MigrationError({
        code: ErrorCode.MODEL_MIGRATION_FAILED,
        message: 'Failed to insert main record',
        details: {
          id: item.id,
          modelId: model.id,
        },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private async insertTranslationRecord(
    item: ContentItem,
    locale: string,
    stmt: PreparedStatement,
    model: ModelConfig,
  ): Promise<void> {
    try {
      const translationValues = this.extractTranslationValues(model, {
        ...item,
        locale,
      });

      console.log(`\n=== Çeviri Kaydı Ekleniyor (${locale}) ===`);
      console.log('ID:', item.id);
      console.log('Değerler:', translationValues);

      stmt.run(translationValues);
      console.log('Çeviri kaydı başarıyla eklendi');
    }
    catch (error) {
      console.error('Çeviri kaydı eklenirken hata:', error);
      throw new MigrationError({
        code: ErrorCode.TRANSLATION_MIGRATION_FAILED,
        message: 'Failed to insert translation record',
        details: {
          id: item.id,
          locale,
          modelId: model.id,
        },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private extractModelValues(model: ModelConfig, item: ContentItem): Record<string, unknown> {
    console.log('\n=== Model Değerleri Çıkarılıyor ===');

    // 1. Sistem alanlarını ekle
    const values: Record<string, unknown> = {
      id: item.id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      status: item.status,
    };
    console.log('Sistem alanları:', values);

    // 2. Model alanlarını işle
    for (const field of model.fields) {
      // Sistem alanlarını atla (zaten ekledik)
      if (field.system)
        continue;

      // Lokalize model ise ve alan lokalize ise atla (çeviri tablosuna gidecek)
      if (model.localization && field.localized)
        continue;

      const normalizedName = this.fieldNormalizer.normalize(field.fieldId);
      const value = item[field.fieldId];

      if (field.fieldType === 'relation') {
        // İlişki alanı için _id ekle
        const columnName = `${normalizedName}_id`;
        const relationValue = Array.isArray(value) ? value[0] ?? null : value ?? null;
        values[columnName] = relationValue;
        console.log(`İlişki alanı: ${columnName} =`, relationValue);
      }
      else {
        // Normal alan
        const normalizedValue = this.normalizeValue(value, field.fieldType);
        values[normalizedName] = normalizedValue;
        console.log(`Alan: ${normalizedName} =`, normalizedValue);
      }
    }

    return values;
  }

  private extractTranslationValues(
    model: ModelConfig,
    item: TranslationItem,
  ): Record<string, unknown> {
    console.log('\n=== Çeviri Değerleri Çıkarılıyor ===');

    // 1. Temel alanları ekle
    const values: Record<string, unknown> = {
      id: item.id,
      locale: item.locale,
    };
    console.log('Temel alanlar:', values);

    // 2. Lokalize edilmiş alanları ekle
    for (const field of model.fields) {
      // Sadece lokalize edilmiş ve ilişki olmayan alanları işle
      if (!field.localized || field.fieldType === 'relation')
        continue;

      const normalizedName = this.fieldNormalizer.normalize(field.fieldId);
      const value = item[field.fieldId];
      const normalizedValue = this.normalizeValue(value, field.fieldType);

      values[normalizedName] = normalizedValue;
      console.log(`Çeviri alanı: ${normalizedName} =`, normalizedValue);
    }

    return values;
  }

  private normalizeValue(value: unknown, fieldType: ContentrainBaseType): unknown {
    if (value === undefined || value === null) {
      return null;
    }

    try {
      switch (fieldType) {
        case 'string':
          return String(value);

        case 'number': {
          const num = Number(value);
          return Number.isNaN(num) ? null : num;
        }

        case 'boolean':
          return Boolean(value);

        case 'date': {
          if (value instanceof Date)
            return value.toISOString();
          const date = new Date(value as string);
          return Number.isNaN(date.getTime()) ? null : date.toISOString();
        }

        case 'array':
          if (Array.isArray(value))
            return JSON.stringify(value);
          try {
            return JSON.stringify(JSON.parse(value as string));
          }
          catch {
            return JSON.stringify([value]);
          }

        case 'media':
          return String(value);

        case 'relation':
          if (Array.isArray(value))
            return value[0] ?? null;
          return value ?? null;

        default:
          console.warn(`Bilinmeyen alan tipi: ${String(fieldType)}, string olarak işleniyor`);
          return String(value);
      }
    }
    catch (error) {
      console.error('Değer normalizasyonu hatası:', {
        value,
        fieldType,
        error,
      });
      return null;
    }
  }

  private getLocaleFromItem(item: RawContentItem): string {
    // __locale bilgisi MigrationManager tarafından eklenmeli
    const locale = (item as any).__locale;
    if (!locale) {
      throw new MigrationError({
        code: ErrorCode.MISSING_LOCALE_FILE,
        message: 'Locale information is missing',
        details: { item },
      });
    }
    return locale.toLowerCase();
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
          this.processTranslationBatch(batch, stmt, model);
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
   * Processes a batch of translation data
   */
  private processTranslationBatch(
    translations: TranslationItem[],
    stmt: PreparedStatement,
    model: ModelConfig,
  ): void {
    console.log('\n=== Çeviri Batch İşleniyor ===');
    console.log(`Model: ${model.id}`);
    console.log(`Çeviri sayısı: ${translations.length}`);

    for (const translation of translations) {
      if (!this.validationManager.isValidTranslationItem(translation)) {
        throw new MigrationError({
          code: ErrorCode.TRANSLATION_MIGRATION_FAILED,
          message: 'Invalid translation item',
          details: { translation: JSON.stringify(translation) },
        });
      }

      const translationValues = this.extractTranslationValues(model, translation);
      console.log('\nÇeviri değerleri:', translationValues);

      try {
        stmt.run(translationValues);
        console.log('Çeviri başarıyla eklendi');
      }
      catch (error) {
        console.error('Çeviri eklenirken hata oluştu:', error);
        throw new MigrationError({
          code: ErrorCode.TRANSLATION_MIGRATION_FAILED,
          message: 'Failed to insert translation',
          details: {
            modelId: model.id,
            translationId: translation.id,
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
    console.log('\n=== Model Statement Hazırlanıyor ===');
    console.log(`Tablo: ${tableName}`);
    console.log('Model:', {
      id: model.id,
      fields: model.fields.map(f => ({
        fieldId: f.fieldId,
        type: f.fieldType,
        localized: f.localized,
        system: f.system,
      })),
    });

    // Benzersiz alan listesi oluştur
    const uniqueFields = new Map<string, string>();

    // Sistem alanlarını ekle
    const systemFields = ['id', 'created_at', 'updated_at', 'status'];
    systemFields.forEach((field) => {
      uniqueFields.set(field, field);
      console.log(`Sistem alanı eklendi: ${field}`);
    });

    // Model alanlarını ekle
    model.fields
      .filter((field) => {
        console.log(`Alan kontrol ediliyor: ${field.fieldId}`, {
          system: field.system,
          fieldType: field.fieldType,
          localized: field.localized,
        });

        // Sistem alanları zaten eklendi
        if (field.system) {
          console.log(`Sistem alanı atlanıyor: ${field.fieldId}`);
          return false;
        }

        // İlişki alanları her zaman ana tabloda
        if (field.fieldType === 'relation') {
          console.log(`İlişki alanı ana tabloya eklenecek: ${field.fieldId}`);
          return true;
        }

        // Lokalize edilmemiş alanlar ana tabloda
        if (!field.localized) {
          console.log(`Lokalize edilmemiş alan ana tabloya eklenecek: ${field.fieldId}`);
          return true;
        }

        console.log(`Alan çeviri tablosuna gidecek: ${field.fieldId}`);
        return false;
      })
      .forEach((field) => {
        const normalizedName = this.fieldNormalizer.normalize(field.fieldId);
        const finalName = field.fieldType === 'relation' ? `${normalizedName}_id` : normalizedName;

        if (uniqueFields.has(finalName)) {
          console.log(`Alan zaten mevcut: ${finalName}`);
        }
        else {
          uniqueFields.set(finalName, finalName);
          console.log(`Alan eklendi: ${finalName}`);
        }
      });

    const allFields = Array.from(uniqueFields.values());
    console.log('\nTüm alanlar:', allFields);

    const sql = `
        INSERT INTO ${tableName} (${allFields.join(', ')})
        VALUES (${allFields.map(f => `@${f}`).join(', ')})
    `;

    console.log('\nOluşturulan SQL:', sql);
    return this.db.prepare(sql);
  }

  /**
   * Prepares statement for translation data
   */
  private prepareTranslationStatement(tableName: string, model: ModelConfig): PreparedStatement {
    console.log('\n=== Çeviri Statement Hazırlanıyor ===');
    console.log(`Tablo: ${tableName}`);
    console.log('Model:', {
      id: model.id,
      fields: model.fields.map(f => ({
        fieldId: f.fieldId,
        type: f.fieldType,
        localized: f.localized,
        system: f.system,
      })),
    });

    // Sadece lokalize edilmiş alanları filtrele
    const localizedFields = model.fields.filter(field => field.localized);
    console.log('\nLokalize edilmiş alanlar:', localizedFields.map(f => f.fieldId));

    const fields = localizedFields.map((field) => {
      const fieldName = this.fieldNormalizer.normalize(field.fieldId);
      console.log(`Alan normalize edildi: ${field.fieldId} -> ${fieldName}`);
      return fieldName;
    });

    const systemFields = ['id', 'locale'];
    const allFields = [...systemFields, ...fields];
    console.log('\nTüm alanlar:', allFields);

    const sql = `
      INSERT INTO ${tableName} (${allFields.join(', ')})
      VALUES (${allFields.map(f => `@${f}`).join(', ')})
    `;

    console.log('\nOluşturulan SQL:', sql);
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

  private extractTranslations(items: RawContentItem[], model: ModelConfig): TranslationItem[] {
    const translations: TranslationItem[] = [];

    for (const item of items) {
      const normalizedItem = this.normalizeContentItem(item);
      const translatedFields = model.fields.filter(f => f.localized);

      // Her dil için çeviri kaydı oluştur
      const locales = ['tr', 'en']; // TODO: Dilleri konfigürasyondan al
      for (const locale of locales) {
        const translation: TranslationItem = {
          id: normalizedItem.id,
          locale,
          created_at: normalizedItem.created_at,
          updated_at: normalizedItem.updated_at,
          status: normalizedItem.status,
        };

        // Lokalize edilebilir alanları ekle
        for (const field of translatedFields) {
          if (field.fieldType !== 'relation') {
            translation[field.fieldId] = normalizedItem[field.fieldId];
          }
        }

        translations.push(translation);
      }
    }

    return translations;
  }
}
