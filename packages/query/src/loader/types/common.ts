// Common Types
export type LoaderType = 'json' | 'sqlite';
export type RelationType = 'one-to-one' | 'one-to-many';
export type ContentrainStatus = 'publish' | 'draft' | 'changed';
// Logger Interface
export interface ILogger {
    debug: (message: string, context?: Record<string, unknown>) => void
    info: (message: string, context?: Record<string, unknown>) => void
    warn: (message: string, context?: Record<string, unknown>) => void
    error: (message: string, context?: Record<string, unknown>) => void
}

// Base Loader Interface
export interface IBaseLoader<TData, TResult> {
    load: (modelId: string) => Promise<TResult>
    resolveRelations: <TRelation>(
        modelId: string,
        relationKey: keyof TData,
        data: TData[]
    ) => Promise<TRelation[]>
    clearCache: () => Promise<void>
}
