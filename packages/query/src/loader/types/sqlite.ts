import type { ContentrainStatus } from './common';

// Record Types
export interface IDBRecord {
    id: string
    created_at: string
    updated_at: string
    status: ContentrainStatus
    scheduled?: boolean
    _relations?: {
        [key: string]: IDBRecord | IDBRecord[]
    }
}

export interface IDBTranslationRecord extends IDBRecord {
    readonly locale: string
    readonly [key: string]: unknown
}

export interface IDBRelation {
    readonly id: string
    readonly source_model: string
    readonly source_id: string
    readonly target_model: string
    readonly target_id: string
    readonly field_id: string
    readonly type: 'one-to-one' | 'one-to-many'
    readonly created_at: string
    readonly updated_at: string
}

// Loader Types
export interface ISQLiteLoaderOptions {
    databasePath: string
    cache?: boolean
    maxCacheSize?: number
    modelTTL?: number | Record<string, number>
    defaultLocale?: string
    sorting?: {
        field: string
        direction: 'asc' | 'desc'
    }
}

export interface ISQLiteContent<TData extends IDBRecord> {
    readonly default: TData[]
    readonly translations?: Record<string, IDBTranslationRecord[]>
}

export interface ISQLiteLoaderResult<TData extends IDBRecord> {
    readonly model: {
        readonly metadata: {
            readonly modelId: string
            readonly name: string
            readonly type: 'SQLite'
            readonly localization: boolean
            readonly isServerless: boolean
        }
        readonly fields: Array<{
            readonly name: string
            readonly fieldId: string
            readonly type: string
        }>
    }
    readonly content: ISQLiteContent<TData>
}

// Connection Types
export interface ISQLiteConnection {
    query: <T>(sql: string, params?: unknown[]) => Promise<T[]>
    get: <T>(sql: string, params?: unknown[]) => Promise<T | undefined>
    close: () => void
}

// Manager Types
export interface ISQLiteContentManager {
    findById: <T extends IDBRecord>(model: string, id: string) => Promise<T | undefined>
    findAll: <T extends IDBRecord>(model: string, conditions?: Partial<T>) => Promise<T[]>
}

export interface ISQLiteRelationManager {
    loadRelations: (model: string, sourceIds: string[], fieldId: string) => Promise<IDBRelation[]>
    loadRelatedContent: <T extends IDBRecord>(relations: IDBRelation[], locale?: string) => Promise<T[]>
    getRelationTypes: (model: string) => Promise<Record<string, 'one-to-one' | 'one-to-many'>>
}

export interface ISQLiteTranslationManager {
    hasTranslations: (model: string) => Promise<boolean>
    loadTranslations: (model: string, ids: string[], locale?: string) => Promise<Record<string, IDBTranslationRecord>>
    getLocales: (model: string) => Promise<string[]>
    getMainColumns: (model: string) => Promise<string[]>
    getTranslationColumns: (model: string) => Promise<string[]>
}
