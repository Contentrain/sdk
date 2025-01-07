import type {
  ContentrainBaseModel,
  ContentrainError,
  ContentrainErrorCode,
  ContentrainField,
  ContentrainModelMetadata,
  FilterOperator,
  SortDirection,
} from '@contentrain/types';

// Query Options
export interface QueryOptions {
  defaultLocale?: string
  basePath?: string
  cacheStrategy?: 'memory' | 'none'
  cacheTTL?: number
}

// Cache Types
export interface CacheOptions {
  ttl?: number
  namespace?: string
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

// Error Types
export class QueryError extends Error implements ContentrainError {
  constructor(
    message: string,
    public code: ContentrainErrorCode,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'QueryError';
  }
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
