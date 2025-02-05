import type { ContentItem, ContentResult, DefaultContentResult, LocalizedContentResult, RawContentItem, TranslationItem, TranslationMap } from '../types/content';
import type { ModelConfig, ModelField } from '../types/model';
import { Buffer } from 'node:buffer';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fastGlob from 'fast-glob';
import { DefaultContentTransformer } from '../normalizer/ContentTransformer';
import { FieldNormalizer } from '../normalizer/FieldNormalizer';
import { ContentrainError, ErrorCode, ValidationError } from '../types/errors';
import { SecurityManager } from '../utils/SecurityManager';
import { ValidationManager } from '../validation/ValidationManager';

export class ContentAnalyzer {
  private securityManager: SecurityManager;
  private fieldNormalizer: FieldNormalizer;
  private validationManager: ValidationManager;
  private contentTransformer: DefaultContentTransformer;
  private readonly MAX_CONTENT_SIZE = 10485760; // 10MB

  constructor(
    private contentDir: string,
    securityManager?: SecurityManager,
  ) {
    this.securityManager = securityManager ?? new SecurityManager();
    this.fieldNormalizer = new FieldNormalizer();
    this.validationManager = new ValidationManager();
    this.contentTransformer = new DefaultContentTransformer();
  }

  /**
   * Analyzes model content
   */
  async analyzeContent(model: ModelConfig): Promise<ContentResult> {
    const modelDir = join(this.contentDir, model.id);

    try {
      if (model.localization) {
        return await this.readLocalizedContent(modelDir, model.id);
      }
      return await this.readDefaultContent(modelDir, model.id);
    }
    catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError({
        code: ErrorCode.CONTENT_READ_ERROR,
        message: 'Failed to read content',
        details: { modelId: model.id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Reads localized content
   */
  private async readLocalizedContent(modelDir: string, modelId: string): Promise<LocalizedContentResult> {
    const translations: TranslationMap = {};
    const localeFiles = await this.findLocaleFiles(modelDir);

    if (!localeFiles.length) {
      throw new ValidationError({
        code: ErrorCode.NO_LOCALE_FILES_FOUND,
        message: 'No locale files found',
        details: { modelId, dir: modelDir },
      });
    }

    let defaultItems: ContentItem[] = [];
    const defaultLocale = 'tr'; // Default locale for Contentrain

    // First read the default locale
    const defaultFile = localeFiles.find(f => f.endsWith(`${defaultLocale}.json`));
    if (!defaultFile) {
      throw new ValidationError({
        code: ErrorCode.DEFAULT_LOCALE_NOT_FOUND,
        message: 'Default locale not found',
        details: { modelId, locale: defaultLocale },
      });
    }

    try {
      const content = await this.readJSONFile(defaultFile);
      if (!Array.isArray(content)) {
        throw new ValidationError({
          code: ErrorCode.INVALID_CONTENT_FORMAT,
          message: 'Invalid content format',
          details: { modelId, file: defaultFile, expected: 'array', received: typeof content },
        });
      }

      const validItems = content.filter(item => this.validationManager.isValidContentItem(item));
      if (validItems.length === 0) {
        throw new ValidationError({
          code: ErrorCode.NO_VALID_CONTENT,
          message: 'No valid content found',
          details: { modelId, file: defaultFile },
        });
      }

      defaultItems = validItems.map(item => this.normalizeContentItem(item));
      translations[defaultLocale] = validItems.map((item) => {
        const normalized = this.normalizeContentItem(item);
        return { ...normalized, locale: defaultLocale };
      });

      // Then read other locales
      for (const file of localeFiles) {
        const locale = this.getLocaleFromPath(file);
        if (locale === defaultLocale)
          continue;

        if (!this.isValidLocale(locale)) {
          console.warn(`[${modelId}] Invalid locale found: ${locale}`);
          continue;
        }

        const localeContent = await this.readJSONFile(file);
        if (!Array.isArray(localeContent)) {
          throw new ValidationError({
            code: ErrorCode.INVALID_CONTENT_FORMAT,
            message: 'Invalid content format',
            details: { modelId, file, expected: 'array', received: typeof localeContent },
          });
        }

        const validLocaleItems = localeContent.filter(item => this.validationManager.isValidContentItem(item));
        if (validLocaleItems.length === 0) {
          console.warn(`[${modelId}] No valid content found in locale: ${locale}`);
          continue;
        }

        translations[locale] = validLocaleItems.map((item) => {
          const normalized = this.normalizeContentItem(item);
          return { ...normalized, locale };
        });
      }
    }
    catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ContentrainError({
        code: ErrorCode.CONTENT_ANALYSIS_FAILED,
        message: 'Failed to analyze localized content',
        details: { modelId },
        cause: error instanceof Error ? error : undefined,
      });
    }

    return { items: defaultItems, translations };
  }

  /**
   * Reads default content
   */
  private async readDefaultContent(modelDir: string, modelId: string): Promise<DefaultContentResult> {
    const contentFile = join(modelDir, `${modelId}.json`);

    try {
      const items = await this.readJSONFile(contentFile);
      if (!Array.isArray(items)) {
        throw new ValidationError({
          code: ErrorCode.INVALID_CONTENT_FORMAT,
          message: 'Invalid content format',
          details: { modelId, expected: 'array', received: typeof items },
        });
      }

      const validItems = items.filter(item => this.validationManager.isValidContentItem(item));
      if (!validItems.length) {
        throw new ValidationError({
          code: ErrorCode.NO_VALID_CONTENT,
          message: 'No valid content found',
          details: { modelId },
        });
      }

      return { items: validItems.map(item => this.normalizeContentItem(item)) };
    }
    catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ContentrainError({
        code: ErrorCode.CONTENT_ANALYSIS_FAILED,
        message: 'Failed to analyze content',
        details: { modelId },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Finds locale files
   */
  private async findLocaleFiles(modelDir: string): Promise<string[]> {
    const pattern = '*.json';
    const files = await fastGlob(pattern, {
      cwd: modelDir,
      absolute: true,
    });

    return files.filter((file) => {
      const fileName = file.split('/').pop()!;
      return /^[a-z]{2}(?:-[A-Z]{2})?\.json$/.test(fileName);
    });
  }

  /**
   * Gets locale from file path
   */
  private getLocaleFromPath(filePath: string): string {
    const fileName = filePath.split('/').pop()!;
    return fileName.replace('.json', '');
  }

  /**
   * Validates locale
   */
  private isValidLocale(locale: string): boolean {
    return /^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale);
  }

  /**
   * Normalizes content item
   */
  private normalizeContentItem(item: RawContentItem): ContentItem {
    return this.contentTransformer.normalizeContent(item);
  }

  /**
   * Detects circular references
   */
  private detectCircular(obj: unknown, path: string[] = [], seen = new WeakSet()): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    if (seen.has(obj)) {
      throw new ValidationError({
        code: ErrorCode.CIRCULAR_DEPENDENCY,
        message: 'Circular reference detected',
        details: { path: path.join('.') },
      });
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.detectCircular(item, [...path, `[${index}]`], seen);
      });
    }
    else {
      for (const [key, value] of Object.entries(obj)) {
        this.detectCircular(value, [...path, key], seen);
      }
    }
  }

  /**
   * Reads and validates JSON file
   */
  private async readJSONFile(filePath: string): Promise<unknown> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const contentSize = Buffer.byteLength(content);

      if (contentSize > this.MAX_CONTENT_SIZE) {
        throw new ValidationError({
          code: ErrorCode.CONTENT_TOO_LARGE,
          message: 'Content too large',
          details: { size: contentSize, maxSize: this.MAX_CONTENT_SIZE },
        });
      }

      const parsed = JSON.parse(content);
      this.validationManager.validateJSONContent(parsed);

      return parsed;
    }
    catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new ValidationError({
          code: ErrorCode.FILE_NOT_FOUND,
          message: 'File not found',
          details: { path: filePath },
        });
      }
      throw new ValidationError({
        code: ErrorCode.FILE_READ_ERROR,
        message: 'Failed to read file',
        details: { path: filePath },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Validates JSON content
   */
  public validateJSONContent(content: unknown): void {
    if (!content || typeof content !== 'object') {
      throw new ValidationError({
        code: ErrorCode.INVALID_CONTENT_FORMAT,
        message: 'Invalid content format',
        details: { content: JSON.stringify(content) },
      });
    }

    // Content size check
    const contentSize = Buffer.byteLength(JSON.stringify(content));
    if (contentSize > 10485760) { // 10MB
      throw new ValidationError({
        code: ErrorCode.CONTENT_TOO_LARGE,
        message: 'Content too large',
        details: { size: contentSize, maxSize: 10485760 },
      });
    }

    // Circular reference check
    try {
      const seen = new WeakSet();
      const detectCircular = (obj: unknown): void => {
        if (obj && typeof obj === 'object') {
          if (seen.has(obj)) {
            throw new ValidationError({
              code: ErrorCode.CIRCULAR_DEPENDENCY,
              message: 'Circular reference detected',
            });
          }
          seen.add(obj);
          for (const value of Object.values(obj)) {
            detectCircular(value);
          }
        }
      };
      detectCircular(content);
    }
    catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Circular reference check failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private validateRequiredFields(item: RawContentItem): void {
    const requiredFields = ['ID', 'createdAt', 'updatedAt', 'status'];
    for (const field of requiredFields) {
      if (!item[field]) {
        throw new ValidationError({
          code: ErrorCode.MISSING_REQUIRED_FIELD,
          message: `Missing required field: ${field}`,
          details: { field },
        });
      }
    }
  }

  private validateFieldTypes(item: RawContentItem, fields: ModelField[]): void {
    for (const field of fields) {
      const value = item[field.fieldId];
      if (value === undefined)
        continue;

      switch (field.fieldType) {
        case 'string':
          if (value !== null && typeof value !== 'string') {
            throw new ValidationError({
              code: ErrorCode.INVALID_FIELD_TYPE,
              message: `Invalid field type for ${field.fieldId}`,
              details: { field: field.fieldId, expected: 'string', received: typeof value },
            });
          }
          break;
        case 'number':
          if (value !== null && typeof value !== 'number') {
            throw new ValidationError({
              code: ErrorCode.INVALID_FIELD_TYPE,
              message: `Invalid field type for ${field.fieldId}`,
              details: { field: field.fieldId, expected: 'number', received: typeof value },
            });
          }
          break;
        case 'boolean':
          if (value !== null && typeof value !== 'boolean') {
            throw new ValidationError({
              code: ErrorCode.INVALID_FIELD_TYPE,
              message: `Invalid field type for ${field.fieldId}`,
              details: { field: field.fieldId, expected: 'boolean', received: typeof value },
            });
          }
          break;
        case 'array':
          if (value !== null && !Array.isArray(value)) {
            throw new ValidationError({
              code: ErrorCode.INVALID_FIELD_TYPE,
              message: `Invalid field type for ${field.fieldId}`,
              details: { field: field.fieldId, expected: 'array', received: typeof value },
            });
          }
          break;
        case 'date':
          if (value !== null && !this.isValidDate(value)) {
            throw new ValidationError({
              code: ErrorCode.INVALID_FIELD_TYPE,
              message: `Invalid field type for ${field.fieldId}`,
              details: { field: field.fieldId, expected: 'date', received: typeof value },
            });
          }
          break;
        case 'media':
          if (value !== null && typeof value !== 'string') {
            throw new ValidationError({
              code: ErrorCode.INVALID_FIELD_TYPE,
              message: `Invalid field type for ${field.fieldId}`,
              details: { field: field.fieldId, expected: 'string', received: typeof value },
            });
          }
          break;
        case 'relation':
          if (value !== null && typeof value !== 'string' && !Array.isArray(value)) {
            throw new ValidationError({
              code: ErrorCode.INVALID_FIELD_TYPE,
              message: `Invalid field type for ${field.fieldId}`,
              details: { field: field.fieldId, expected: 'string | string[]', received: typeof value },
            });
          }
          break;
      }
    }
  }

  private isValidDate(value: unknown): boolean {
    if (typeof value !== 'string')
      return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  /**
   * Reads model content
   */
  async readModelContent(contentDir: string, model: ModelConfig): Promise<RawContentItem[]> {
    const contentPath = join(contentDir, model.id);

    if (!existsSync(contentPath)) {
      throw new ValidationError({
        code: ErrorCode.CONTENT_DIR_NOT_FOUND,
        message: 'Content directory not found',
        details: { contentPath },
      });
    }

    const files = await readdir(contentPath);
    if (!files || files.length === 0) {
      throw new ValidationError({
        code: ErrorCode.NO_CONTENT_FILES,
        message: 'No content files found',
        details: { contentPath },
      });
    }

    const contentFile = files.find(f => f === `${model.id}.json`);
    if (!contentFile) {
      throw new ValidationError({
        code: ErrorCode.MODEL_CONTENT_FILE_NOT_FOUND,
        message: 'Model content file not found',
        details: { modelId: model.id, contentPath },
      });
    }

    const content = await readFile(join(contentPath, contentFile), 'utf-8');
    try {
      const items = JSON.parse(content) as RawContentItem[];
      return this.validateContentItems(items, model);
    }
    catch (error) {
      throw new ValidationError({
        code: ErrorCode.INVALID_JSON_FORMAT,
        message: 'Invalid JSON format',
        details: { contentPath },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Validates content items
   */
  private validateContentItems(items: RawContentItem[], model: ModelConfig): RawContentItem[] {
    return items.map((item) => {
      this.validationManager.validateRequiredFields(item);
      this.validationManager.validateFieldTypes(item, model.fields);
      return item;
    });
  }

  private validateTranslations(
    items: RawContentItem[],
    translations: Record<string, RawContentItem[]>,
  ): void {
    const itemIds = new Set(items.map(item => item.ID));
    const requiredFields = ['ID', 'createdAt', 'updatedAt', 'status'];

    for (const [locale, translatedItems] of Object.entries(translations)) {
      for (const item of translatedItems) {
        // ID eşleşmesi kontrolü
        if (!itemIds.has(item.ID)) {
          throw new ValidationError({
            code: ErrorCode.TRANSLATION_ID_MISMATCH,
            message: 'Translation ID mismatch',
            details: { locale, id: item.ID },
          });
        }

        // Zorunlu alanları kontrol et
        for (const field of requiredFields) {
          if (!item[field]) {
            throw new ValidationError({
              code: ErrorCode.MISSING_REQUIRED_FIELD_IN_TRANSLATION,
              message: 'Missing required field in translation',
              details: { locale, id: item.ID, field },
            });
          }
        }
      }
    }
  }
}
