import type { BaseContentrainType, FieldMetadata, ModelMetadata } from './model';

export interface ContentLoaderOptions {
  contentDir: string
  defaultLocale?: string
  cache?: boolean
  ttl?: number
  maxCacheSize?: number // MB cinsinden
  modelTTL?: {
    [model: string]: number
  }
}

export interface ModelConfig {
  metadata: ModelMetadata
  fields: FieldMetadata[]
}

export interface ContentFile<T extends BaseContentrainType = BaseContentrainType> {
  model: string
  locale?: string
  data: T[]
}

export interface AssetMetadata {
  path: string
  mimetype: string
  size: number
  alt: string
  meta: {
    user: {
      name: string
      email: string
      avatar: string
    }
    createdAt: string
  }
}

export interface LoaderResult<T extends BaseContentrainType = BaseContentrainType> {
  model: ModelConfig
  content: {
    [locale: string]: T[]
  }
  assets?: AssetMetadata[]
}

export interface RelationConfig {
  model: string
  type: 'one-to-one' | 'one-to-many'
  foreignKey: string
}

export interface CacheStats {
  hits: number
  misses: number
  size: number // Byte cinsinden
  lastCleanup: number
}

export interface CacheEntry<T> {
  data: T
  expireAt: number
  size: number
  createdAt: number
}

export interface MemoryCacheOptions {
  maxSize?: number // MB cinsinden
  defaultTTL?: number // milisaniye cinsinden
}
