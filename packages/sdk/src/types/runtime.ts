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

// İlişkisel alan tiplerini belirlemek için
export type RelationalFields<T> = {
  [K in keyof T]: K extends `${string}Id` ? K : never
}[keyof T]

// With sorgusu için kullanılacak tip
export type WithRelation<T extends IBaseModel, K extends RelationalFields<T>> = T & {
  [P in K as `${string & P}Data`]: P extends `${infer R}Id` 
    ? R extends keyof ContentrainTypeMap
      ? T[P] extends string[]
        ? ContentrainTypeMap[R][]
        : ContentrainTypeMap[R]
      : never
    : never
}

// Mevcut WithRelations tipini güncelle
export type WithRelations<T extends IBaseModel> = T & {
  [K in RelationalFields<T> as `${string & K}Data`]?: K extends `${infer R}Id` 
    ? ContentrainTypeMap[R] 
    : never
}

// Type map interface
export interface IContentrainTypeMap {
  [key: string]: IBaseModel // İndex signature ekledik
} 