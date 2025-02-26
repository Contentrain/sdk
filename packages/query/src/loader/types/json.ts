import type { ContentrainStatus } from './common';

// Record Types
export interface IBaseJSONRecord {
    readonly ID: string
    readonly createdAt: string
    readonly updatedAt: string
    readonly status: ContentrainStatus
    readonly scheduled: boolean
    readonly _relations?: {
        [key: string]: IBaseJSONRecord | IBaseJSONRecord[]
    }
}

// Loader Types
export interface IJSONLoaderOptions {
    readonly contentDir: string
    readonly cache?: boolean
    readonly ttl?: number
    readonly maxCacheSize?: number
    readonly defaultLocale?: string
    readonly modelTTL?: Record<string, number>
}

export interface IJSONContent<TData extends IBaseJSONRecord> {
    readonly [locale: string]: TData[]
}

export interface IJSONContentFile<TData extends IBaseJSONRecord> {
    readonly model: string
    readonly locale?: string
    readonly data: TData[]
}

export interface IJSONModelConfig {
    readonly metadata: {
        readonly modelId: string
        readonly name: string
        readonly type: 'JSON'
        readonly localization: boolean
        readonly isServerless: boolean
        readonly createdBy: string
    }
    readonly fields: Array<{
        readonly name: string
        readonly fieldId: string
        readonly modelId: string
        readonly fieldType: string
        readonly componentId: string
        readonly options: {
            readonly reference?: {
                readonly form?: {
                    readonly reference?: {
                        readonly value: string
                    }
                }
            }
        }
        readonly validations: Record<string, unknown>
    }>
}

export interface IJSONLoaderResult<TData extends IBaseJSONRecord> {
    readonly model: IJSONModelConfig
    readonly content: IJSONContent<TData>
    readonly assets?: Array<{
        readonly id: string
        readonly name: string
        readonly path: string
        readonly size: number
        readonly type: string
        readonly createdAt: string
        readonly updatedAt: string
    }>
}

// Manager Types
export interface IJSONContentManager {
    loadModelContent: <T extends IBaseJSONRecord>(
        modelId: string,
        locale?: string
    ) => Promise<IJSONContentFile<T>>
    loadAssets: () => Promise<any[]>
    getModelLocales: (modelId: string) => Promise<string[]>
    loadModelConfig: (modelId: string) => Promise<IJSONModelConfig>
}

export interface IJSONRelationConfig {
    readonly model: string
    readonly type: 'one-to-one' | 'one-to-many'
    readonly foreignKey: string
}

export interface IJSONRelationManager {
    loadRelations: (modelId: string) => Promise<IJSONRelationConfig[]>
    resolveRelation: <T extends IBaseJSONRecord, R extends IBaseJSONRecord>(
        modelId: string,
        relationField: keyof T,
        data: T[],
        locale?: string
    ) => Promise<R[]>
}
