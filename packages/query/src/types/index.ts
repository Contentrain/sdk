import type {
  ContentrainBaseModel,
  ContentrainField,
  ContentrainModelMetadata,
  FilterOperator,
  SortDirection,
} from '@contentrain/types';

// Query Error Codes
export const QueryErrorCodes = {
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  MODEL_VALIDATION_ERROR: 'MODEL_VALIDATION_ERROR',
  INVALID_RELATION: 'INVALID_RELATION',
  CONTENTRAIN_MODEL_NOT_FOUND: 'CONTENTRAIN_MODEL_NOT_FOUND',
  CONTENTRAIN_INVALID_RELATION: 'CONTENTRAIN_INVALID_RELATION',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  INVALID_CONFIG: 'INVALID_CONFIG',
  TYPE_GENERATION_ERROR: 'TYPE_GENERATION_ERROR',
} as const;

export type QueryErrorCode = (typeof QueryErrorCodes)[keyof typeof QueryErrorCodes];

export class QueryError extends Error {
  constructor(
    message: string,
    public readonly code: QueryErrorCode,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'QueryError';
  }
}

// Build Info Types
export interface BuildInfo {
  timestamp: number
  version: string
  error?: string
}

// Query Options
export interface QueryOptions {
  defaultLocale?: string
  basePath?: string
  cacheStrategy?: 'memory' | 'indexeddb' | 'none'
  cacheTTL?: number
  buildOutput?: string
}

// Cache Types
export interface CacheOptions {
  ttl?: number
  namespace?: string
}

export interface CacheManager {
  get: <T>(key: string, options?: CacheOptions) => Promise<T | null>
  set: <T>(key: string, value: T, options?: CacheOptions) => Promise<void>
  has: (key: string, options?: CacheOptions) => Promise<boolean>
  delete: (key: string, options?: CacheOptions) => Promise<void>
  clear: (namespace?: string) => Promise<void>
}

// Query Types
export interface QueryCondition<T = any> {
  field: keyof T
  operator: FilterOperator
  value: any
}

export interface SortOption<T = any> {
  field: keyof T
  direction: SortDirection
}

export interface PaginationOptions {
  page: number
  perPage: number
}

export interface QueryState<T> {
  model?: string
  conditions: QueryCondition<T>[]
  relations: string[]
  relationCounts: string[]
  sorts: SortOption<T>[]
  locale?: string
  pagination?: PaginationOptions
  skip?: number
  take?: number
}

// Model Types
export interface ModelRelation {
  model: string
  type: 'one-to-one' | 'one-to-many'
}

export interface ModelMetadata {
  name: string
  modelId: string
  localization: boolean
  type: 'JSON' | 'Markdown'
  fields: ContentrainField[]
  relations?: Record<string, ModelRelation>
}

// Runtime Types
export interface RuntimeMetadata {
  total: number
  cached: boolean
  buildInfo: BuildInfo
}

export interface RuntimeResult<T> {
  data: T[]
  metadata: RuntimeMetadata
}

export interface RuntimeContext {
  locale?: string
  buildOutput?: string
  namespace?: string
}

export interface RuntimeOptions {
  basePath: string
  cache?: {
    strategy: 'memory' | 'indexeddb' | 'filesystem'
    ttl?: number
    namespace?: string
  }
}

export interface RuntimeAdapter {
  initialize: (options: RuntimeOptions) => Promise<void>
  loadModel: <T extends ContentrainBaseModel>(model: string, context?: RuntimeContext) => Promise<RuntimeResult<T>>
  loadRelation: <T extends ContentrainBaseModel>(model: string, id: string, context?: RuntimeContext) => Promise<T | null>
  invalidateCache: (model?: string) => Promise<void>
  cleanup: () => Promise<void>
}

// Type Guards
export function isValidLocale(locale: string, availableLocales: string[]): boolean {
  return availableLocales.includes(locale);
}

export function isValidModel(model: string, availableModels: string[]): boolean {
  return availableModels.includes(model);
}

export function isValidField(field: string, fields: ContentrainField[]): boolean {
  return fields.some((f: ContentrainField) => f.fieldId === field);
}

// Re-exports
export type {
  ContentrainBaseModel,
  ContentrainField,
  ContentrainModelMetadata,
  FilterOperator,
  SortDirection,
};
