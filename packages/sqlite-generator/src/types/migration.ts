import type { ContentItem, RelationItem, TranslationItem } from './content';

/**
 * Type of migration operation
 */
export type MigrationType = 'model' | 'translation' | 'relation';

/**
 * Migration item with execution logic
 */
export interface MigrationItem {
    type: MigrationType
    modelId: string
    execute: () => Promise<void>
}

/**
 * Current state of a migration
 */
export interface MigrationState {
    modelId: string
    contentItems: ContentItem[]
    translations?: TranslationItem[]
    relations?: RelationItem[]
    isCompleted: boolean
    error?: string

}

/**
 * Migration job to be executed
 */
export interface MigrationJob {
    type: MigrationType
    modelId: string
    execute: () => Promise<void>
}

/**
 * History of executed migrations
 */
export interface MigrationHistory {
    id: string
    modelId: string
    type: MigrationType
    status: 'completed' | 'failed'
    completedAt: string
    error?: string
}

/**
 * Result of a migration operation
 */
export interface MigrationResult {
    success: boolean
    modelId: string
    type: MigrationType
    error?: string
}

/**
 * Dependency between migrations
 */
export interface MigrationDependency {
    sourceModelId: string
    targetModelId: string
    fieldId: string
    type: 'one-to-one' | 'one-to-many'
}

/**
 * Migration configuration options
 */
export interface MigrationConfig {
    batchSize?: number
    retryCount?: number
    timeout?: number
    validateOnly?: boolean
}
