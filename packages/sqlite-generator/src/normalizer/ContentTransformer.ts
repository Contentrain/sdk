import type { ContentItem, ContentTransformer, RawContentItem } from '../types/content';
import { FieldNormalizer } from './FieldNormalizer';

export class DefaultContentTransformer implements ContentTransformer {
  private fieldNormalizer: FieldNormalizer;

  constructor() {
    this.fieldNormalizer = new FieldNormalizer();
  }

  /**
   * Raw içeriği normalize eder
   */
  public normalizeContent(raw: RawContentItem): ContentItem {
    const normalized: Record<string, unknown> = {
      id: raw.ID,
      created_at: raw.createdAt,
      updated_at: raw.updatedAt,
      status: raw.status,
    };

    // Sistem alanları dışındaki tüm alanları normalize et
    for (const [key, value] of Object.entries(raw)) {
      if (['ID', 'createdAt', 'updatedAt', 'status'].includes(key)) {
        continue;
      }

      const normalizedKey = this.fieldNormalizer.normalize(key);
      normalized[normalizedKey] = this.normalizeValue(value);
    }

    return normalized as ContentItem;
  }

  /**
   * Normalize edilmiş içeriği raw formata dönüştürür
   */
  public denormalizeContent(normalized: ContentItem): RawContentItem {
    const raw: Record<string, unknown> = {
      ID: normalized.id,
      createdAt: normalized.created_at,
      updatedAt: normalized.updated_at,
      status: normalized.status,
    };

    // Sistem alanları dışındaki tüm alanları denormalize et
    for (const [key, value] of Object.entries(normalized)) {
      if (['id', 'created_at', 'updated_at', 'status'].includes(key)) {
        continue;
      }

      const denormalizedKey = this.fieldNormalizer.denormalize(key);
      raw[denormalizedKey] = this.denormalizeValue(value);
    }

    return raw as RawContentItem;
  }

  /**
   * Değeri normalize eder
   */
  private normalizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.normalizeValue(item));
    }

    if (typeof value === 'object') {
      return this.normalizeContent(value as RawContentItem);
    }

    return value;
  }

  /**
   * Değeri denormalize eder
   */
  private denormalizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.denormalizeValue(item));
    }

    if (typeof value === 'object') {
      return this.denormalizeContent(value as ContentItem);
    }

    return value;
  }
}
