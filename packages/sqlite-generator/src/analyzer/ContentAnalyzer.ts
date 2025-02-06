import type { ContentItem, DefaultContentResult, LocalizedContentResult, RawContentItem, TranslationMap } from '../types/content';
import type { ModelConfig } from '../types/model';
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
  async analyzeContent(model: ModelConfig): Promise<LocalizedContentResult | DefaultContentResult> {
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
    console.log('\n=== Lokalize İçerik Okunuyor ===');
    console.log(`Model: ${modelId}`);
    console.log(`Dizin: ${modelDir}`);

    const translations: TranslationMap = {};
    const mainTableContentItems = new Map<string, ContentItem>();
    const localeFiles = await this.findLocaleFiles(modelDir);

    console.log('Bulunan dil dosyaları:', localeFiles);

    if (!localeFiles.length) {
      throw new ValidationError({
        code: ErrorCode.NO_LOCALE_FILES_FOUND,
        message: 'No locale files found',
        details: { modelId, dir: modelDir },
      });
    }

    // Her dil dosyasını oku
    for (const file of localeFiles) {
      const locale = this.getLocaleFromPath(file);
      console.log(`\nDil dosyası işleniyor: ${file}`);
      console.log(`Locale: ${locale}`);

      if (!this.isValidLocale(locale)) {
        console.warn(`[${modelId}] Geçersiz locale bulundu: ${locale}`);
        continue;
      }

      try {
        const content = await this.readJSONFile(file);
        console.log('Dosya içeriği okundu, kayıt sayısı:', Array.isArray(content) ? content.length : 'Geçersiz format');

        if (!Array.isArray(content)) {
          throw new ValidationError({
            code: ErrorCode.INVALID_CONTENT_FORMAT,
            message: 'Invalid content format',
            details: { modelId, file, expected: 'array', received: typeof content },
          });
        }

        const validItems = content.filter(item => this.validationManager.isValidContentItem(item));
        console.log(`Geçerli kayıt sayısı: ${validItems.length}`);

        // Ana tablo için içerikleri hazırla
        for (const item of validItems) {
          const normalized = this.normalizeContentItem(item);
          console.log(`Ana tablo kaydı işleniyor - ID: ${normalized.id}`);
          if (mainTableContentItems.has(normalized.id)) {
            console.log(`ID ${normalized.id} zaten ana tablo listesinde mevcut`);
          }
          mainTableContentItems.set(normalized.id, normalized);
        }

        // Çevirileri ekle
        translations[locale] = validItems.map((item) => {
          const normalized = this.normalizeContentItem(item);
          return { ...normalized, locale };
        });
        console.log(`${locale} diline ${translations[locale].length} çeviri eklendi`);
      }
      catch (error) {
        console.error(`Dosya işlenirken hata: ${file}`, error);
        if (error instanceof ValidationError)
          throw error;
        throw new ContentrainError({
          code: ErrorCode.CONTENT_ANALYSIS_FAILED,
          message: 'Failed to analyze localized content',
          details: { modelId, locale },
          cause: error instanceof Error ? error : undefined,
        });
      }
    }

    console.log('\n=== İçerik Okuma Özeti ===');
    console.log(`Toplam benzersiz ID sayısı: ${mainTableContentItems.size}`);
    console.log(`Dil sayısı: ${Object.keys(translations).length}`);
    console.log(`Diller: ${Object.keys(translations).join(', ')}`);

    return {
      contentItems: Array.from(mainTableContentItems.values()),
      translations,
    };
  }

  /**
   * Reads default content
   */
  private async readDefaultContent(modelDir: string, modelId: string): Promise<DefaultContentResult> {
    const contentFile = join(modelDir, `${modelId}.json`);
    const contentMap = new Map<string, Map<string, ContentItem>>();

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

      const normalizedItems = validItems.map(item => this.normalizeContentItem(item));

      // ContentMap'i doldur (lokalize olmayan modeller için tek bir dil var)
      for (const item of normalizedItems) {
        const localeMap = new Map<string, ContentItem>();
        localeMap.set('default', item);
        contentMap.set(item.id, localeMap);
      }

      return {
        contentItems: normalizedItems,
      };
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
}
