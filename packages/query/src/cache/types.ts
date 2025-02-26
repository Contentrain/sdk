// Cache Types
export interface ICacheOptions {
    readonly maxSize?: number
    readonly defaultTTL?: number
}

export interface IBaseCacheStats {
    size: number
    hits: number
    misses: number
    lastCleanup: number
}

export interface ICacheStats {
    modelConfigs: number
    contents: number
    cache: IBaseCacheStats | undefined
}

export interface ICacheEntry<T> {
    data: T
    expireAt: number
    size: number
    createdAt: number
}

export interface IMemoryCacheOptions {
    readonly maxSize?: number // MB cinsinden
    readonly defaultTTL?: number // milisaniye cinsinden
}
