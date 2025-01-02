import { IContentrainPlugin } from "../plugins"

// Base model interface
export interface IBaseModel {
  ID: string
  createdAt: string
  updatedAt: string
  status: string
  [key: string]: any // İndex signature ekledik
}

export interface IContentrainConfig {
  rootDir?: string
  modelsDir?: string
  plugins?: IContentrainPlugin[]
}

export type FilterOperator = 
  | 'eq' 
  | 'ne' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'in' 
  | 'nin'
  | 'contains'

export interface IFilterCondition<T> {
  field: keyof T
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin'
  value: any
}

export interface ISortCondition<T> {
  field: keyof T
  direction: 'asc' | 'desc'
}

export interface IGenerateTypesOptions {
  rootDir?: string
  modelsDir?: string
  output?: string
  watch?: boolean
  plugins?: IContentrainPlugin[]
}

export interface IGenerateTypesResult {
  success: boolean
  error?: string
} 