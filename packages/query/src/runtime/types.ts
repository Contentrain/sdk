import type { ContentrainBaseModel } from '@contentrain/types';

export interface BuildInfo {
  timestamp: number
  version: string
  error?: string
}

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
