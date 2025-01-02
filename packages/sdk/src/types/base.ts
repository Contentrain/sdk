import { IContentrainPlugin } from "../plugins"

// Base model interface
export interface IBaseModel {
  ID: string
  createdAt: string
  updatedAt: string
  status: string
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

export interface IContentrainField {
  fieldId: string
  fieldType: string
  componentId: string
  validations?: Record<string, any>
  options?: {
    reference?: {
      form?: {
        reference?: {
          value?: string
        }
      }
    }
  }
}

export interface IRelation {
  field: string
  targetModel: string
  type: 'one' | 'many'
}

export interface IModelRelation {
  model: string
  type: 'one-to-one' | 'one-to-many'
}

// Kullanıcının generate edeceği tip dosyasından gelecek
export interface ModelRelations {
  [modelId: string]: {
    [fieldName: string]: IModelRelation
  }
}

// SDK'nın kullanacağı tip yardımcıları
export type RelationalFields<T, M extends keyof ModelRelations> = keyof ModelRelations[M] 