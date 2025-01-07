import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeOptions } from '../runtime/types';

export interface AdapterOptions extends RuntimeOptions {
  defaultLocale?: string
}

export interface AdapterResult<T> {
  data: T[]
  total: number
  cached: boolean
  error: Error | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  refetch?: () => Promise<void>
  invalidate?: () => Promise<void>
}

export interface AdapterOneResult<T> extends Omit<AdapterResult<T>, 'data'> {
  data: (T | null)[]
}

export interface AdapterHooks {
  onBeforeQuery?: (model: string) => Promise<void> | void
  onAfterQuery?: (model: string, data: any[]) => Promise<void> | void
  onError?: (error: Error) => Promise<void> | void
  onCacheHit?: (model: string) => Promise<void> | void
  onCacheMiss?: (model: string) => Promise<void> | void
}

export interface FrameworkAdapter {
  initialize: (options: AdapterOptions) => Promise<void>
  query: <T extends ContentrainBaseModel>(model: string, options?: AdapterOptions) => Promise<AdapterResult<T>>
  getOne: <T extends ContentrainBaseModel>(model: string, id: string, options?: AdapterOptions) => Promise<T | null>
  prefetch: (models: string[]) => Promise<void>
  subscribe: (hooks: AdapterHooks) => () => void
  cleanup: () => Promise<void>
}
