import type { ContentrainBaseModel } from '@contentrain/types';

export interface BuildOptions {
  models: string[]
  output: string
  transformers?: ContentTransformer[]
  indexing?: IndexingOptions
}

export interface IndexingOptions {
  fields: string[]
  language?: string
  searchOptions?: SearchOptions
}

export interface SearchOptions {
  minScore?: number
  fuzzy?: boolean
  boost?: Record<string, number>
}

export interface ContentTransformer {
  name: string
  transform: (content: ContentrainBaseModel) => Promise<ContentrainBaseModel>
}

export interface BuildResult {
  stats: {
    totalModels: number
    totalDocuments: number
    buildTime: number
  }
  output: {
    path: string
    size: number
  }
  indexes: {
    [key: string]: {
      count: number
      fields: string[]
    }
  }
}
