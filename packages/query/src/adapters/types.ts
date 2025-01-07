import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter, RuntimeOptions } from '../runtime/types';

export interface AdapterOptions extends RuntimeOptions {
  ssr?: boolean
  hydration?: boolean
  prefetch?: boolean
  suspense?: boolean
}

export interface AdapterHooks<T extends ContentrainBaseModel = ContentrainBaseModel> {
  onBeforeQuery?: (model: string) => Promise<void> | void
  onAfterQuery?: (model: string, data: T[]) => Promise<void> | void
  onError?: (error: Error) => Promise<void> | void
  onCacheHit?: (model: string) => Promise<void> | void
  onCacheMiss?: (model: string) => Promise<void> | void
}

export interface AdapterResult<T> {
  data: T
  error: Error | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  refetch: () => Promise<void>
  invalidate: () => Promise<void>
}

export interface FrameworkAdapter {
  runtime: RuntimeAdapter
  initialize: (options: AdapterOptions) => Promise<void>
  query: <T extends ContentrainBaseModel>(
    model: string,
    options?: AdapterOptions
  ) => Promise<AdapterResult<T[]>>
  getOne: <T extends ContentrainBaseModel>(
    model: string,
    id: string,
    options?: AdapterOptions
  ) => Promise<AdapterResult<T | null>>
  prefetch: (models: string[]) => Promise<void>
  subscribe: (hooks: AdapterHooks) => () => void
  cleanup: () => Promise<void>
}
