import type { ContentrainBaseModel } from '@contentrain/types';

export interface RuntimeOptions {
  basePath: string
  defaultLocale?: string
  cache?: RuntimeCacheOptions
}

export interface RuntimeCacheOptions {
  strategy: 'memory' | 'indexeddb' | 'filesystem' | 'none'
  ttl?: number
  namespace?: string
}

export interface RuntimeResult<T extends ContentrainBaseModel = ContentrainBaseModel> {
  data: T[]
  metadata: {
    total: number
    cached: boolean
    buildInfo?: {
      timestamp: number
      version: string
    }
  }
}

export interface RuntimeContext {
  locale?: string
  namespace?: string
  buildOutput?: string
}

export interface RuntimeAdapter {
  initialize: (options: RuntimeOptions) => Promise<void>
  loadModel: <T extends ContentrainBaseModel>(
    model: string,
    context?: RuntimeContext
  ) => Promise<RuntimeResult<T>>
  loadRelation: <T extends ContentrainBaseModel>(
    model: string,
    id: string,
    context?: RuntimeContext
  ) => Promise<T | null>
  invalidateCache: (model?: string) => Promise<void>
  cleanup: () => Promise<void>
}
