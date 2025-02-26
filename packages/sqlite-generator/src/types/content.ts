/**
 * Raw content item from JSON files
 */
export interface RawContentItem extends Record<string, unknown> {
    ID: string
    createdAt: string
    updatedAt: string
    status: 'draft' | 'changed' | 'publish'
}

/**
 * Normalized content item for database
 */
export interface ContentItem extends Record<string, unknown> {
    id: string
    created_at: string
    updated_at: string
    status: 'draft' | 'changed' | 'publish'
}

/**
 * Translation item with locale information
 */
export interface TranslationItem extends ContentItem {
    locale: string
}

/**
 * Relation between content items
 */
export interface RelationItem {
    id: string
    sourceModel: string
    sourceId: string
    targetModel: string
    targetId: string
    fieldId: string
    type: 'one-to-one' | 'one-to-many'
}

/**
 * Map of translations by locale
 */
export type TranslationMap = Record<string, TranslationItem[]>;

/**
 * Content result for localized content
 */
export interface LocalizedContentResult {
    contentItems: ContentItem[]
    translations: TranslationMap
}

/**
 * Content result for non-localized content
 */
export interface DefaultContentResult {
    contentItems: ContentItem[]
}

/**
 * İçerik dönüştürücü
 */
export interface ContentTransformer {
    /**
     * Raw içeriği normalize eder
     */
    normalizeContent: (raw: RawContentItem) => ContentItem

    /**
     * Normalize edilmiş içeriği raw formata dönüştürür
     */
    denormalizeContent: (normalized: ContentItem) => RawContentItem
}
