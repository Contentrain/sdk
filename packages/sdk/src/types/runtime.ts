import type { IBaseModel } from './base'

export const CONTENTRAIN_PATHS = {
  root: 'contentrain',
  models: 'contentrain/models',
  metadata: 'contentrain/models/metadata.json'
} as const

// SDK'nın base tipleri
export interface ContentrainTypeMap {
  [modelId: string]: IBaseModel
}

// Compile-time tip güvenliği için
export type ModelId<T extends ContentrainTypeMap = ContentrainTypeMap> = keyof T & string

// Query sonuçları için helper tip
export type RelationData<T extends IBaseModel> = {
  [K in keyof T as `${string & K}Data`]?: T[K] extends string 
    ? IBaseModel 
    : T[K] extends string[] 
    ? IBaseModel[] 
    : never
}

// Model tipi ile relation datayı birleştir
export type WithRelations<T extends IBaseModel> = T & RelationData<T> 



// Type map interface
export interface IContentrainTypeMap {
  [key: string]: IBaseModel // İndex signature ekledik
} 