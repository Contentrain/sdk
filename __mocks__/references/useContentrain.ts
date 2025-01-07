import type {
  ContentrainTypeMap,
  ModelId,
  ModelRelations,
  LocalizedModels,
  ModelLocales,
  SortDirection,
  RelationType,
  ContentrainMetadata,
  ContentrainModel,
  ContentrainModelField,
  ContentrainValueType,
  ContentrainDataType,
  ContentrainComponentId
} from '../types/contentrain'
import { FilterOperator } from '../types/contentrain'
import { CONTENTRAIN_PATHS, CONTENTRAIN_LOCALES } from '../types/contentrain'
import path from 'node:path'

// Basit filter condition tipi
interface FilterCondition<T> {
  field: keyof T
  operator: FilterOperator
  value: ContentrainValueType<ContentrainDataType, ContentrainComponentId>
}

interface SortCondition<T> {
  field: keyof T
  direction: SortDirection
}

// Localization için
async function getLocalizedData<T extends ModelId>(modelId: T, locale: string) {
  const metadata = await import('./../contentrain/models/metadata.json')
  const model = metadata.default.find(m => m.modelId === modelId)
  const isLocalized = model?.localization || false
  return isLocalized
}

async function fetchContentrainData<T extends ModelId>(
  modelId: T,
  locale?: string
): Promise<ContentrainTypeMap[T][]> {
  try {
    // Path'leri projenin root'undan başlayarak oluştur
    const rootDir = process.cwd()
    const metadataPath = path.join(rootDir, CONTENTRAIN_PATHS.metadata)
    const metadata: { default: ContentrainMetadata } = await import(metadataPath)
    
    const model = metadata.default.find(m => m.modelId === modelId)
    const isLocalized = model?.localization || false

    const contentPath = isLocalized && locale 
      ? path.join(rootDir, CONTENTRAIN_PATHS.root, modelId, `${locale}.json`)
      : path.join(rootDir, CONTENTRAIN_PATHS.root, modelId, `${modelId}.json`)

    const data = await import(contentPath)
    return data.default
  }
  catch (error) {
    console.error(`Error loading contentrain data for ${modelId}:`, error)
    return []
  }
}

// Runtime'da kullanmak için relation mapping'i oluştur
async function getRelationConfig<T extends ModelId, K extends keyof ContentrainTypeMap[T]>(
  modelId: T, 
  field: K
): Promise<{ model: ModelId; type: RelationType } | null> {
  try {
    const modelData: { default: ContentrainModel } = await import(
      path.join(CONTENTRAIN_PATHS.models, `${modelId}.json`)
    )
    
    const fieldData = modelData.default.find(f => f.fieldId === String(field))

    if (fieldData?.fieldType === 'relation' && fieldData.options?.reference?.form?.reference?.value) {
      return {
        model: fieldData.options.reference.form.reference.value as ModelId,
        type: fieldData.componentId as RelationType,
      }
    }
    return null
  }
  catch {
    return null
  }
}

export function useContentrain<T extends ModelId>(
  modelId: T,
  locale?: T extends LocalizedModels ? ModelLocales<T> : never
) {
  type Model = ContentrainTypeMap[T]

  // Model field cache
  let modelFieldsCache: ContentrainModel | undefined

  // Model fields'ı al
  async function getModelFields(): Promise<ContentrainModel> {
    if (modelFieldsCache) return modelFieldsCache

    try {
      const modelData = await import(
        path.join(CONTENTRAIN_PATHS.models, `${modelId}.json`)
      )
      modelFieldsCache = modelData.default
      return modelData.default
    } catch (error) {
      console.error(`Error loading model fields for ${modelId}:`, error)
      return [] as ContentrainModel
    }
  }

  class ContentrainQuery {
    private filters: FilterCondition<Model>[] = []
    private sorts: SortCondition<Model>[] = []
    private relations: Array<keyof ModelRelations[T]> = []
    private dataPromise: Promise<Model[]>
    private validations: Promise<boolean>[] = [] // Validation promise'leri

    constructor() {
      if (Object.keys(CONTENTRAIN_LOCALES).includes(modelId) && !locale) {
        throw new Error(`Model ${modelId} requires a locale parameter`)
      }
      this.dataPromise = fetchContentrainData(modelId, locale)
    }

    // Validation'ı promise olarak ekle
    private addValidation(validation: Promise<boolean>) {
      this.validations.push(validation)
      return this
    }

    // Where metodları
    where(field: keyof Model, value: any): this {
      const validation = validateValue(field, value)
      this.addValidation(validation)
      
      this.filters.push({ 
        field, 
        operator: FilterOperator.Equals, 
        value 
      })
      return this
    }

    whereContains(field: keyof Model, value: string): this {
      const validation = validateStringField(field)
      this.addValidation(validation)

      this.filters.push({ 
        field, 
        operator: FilterOperator.Contains, 
        value 
      })
      return this
    }

    whereIn(field: keyof Model, values: any[]): this {
      const validations = values.map(v => validateValue(field, v))
      validations.forEach(v => this.addValidation(v))

      this.filters.push({ 
        field, 
        operator: FilterOperator.In, 
        value: values 
      })
      return this
    }

    whereNotIn(field: keyof Model, values: any[]): this {
      this.filters.push({ field, operator: FilterOperator.NotIn, value: values })
      return this
    }

    orderBy(field: keyof Model, direction: SortDirection = 'asc'): this {
      this.sorts.push({ field, direction })
      return this
    }

    with<K extends keyof ModelRelations[T]>(field: K): this {
      this.relations.push(field)
      return this
    }

    // String operasyonları için type guards
    private isString(value: unknown): value is string {
      return typeof value === 'string'
    }

    private isNumber(value: unknown): value is number {
      return typeof value === 'number'
    }

    private isComparable(value: unknown): value is number | string | Date {
      return this.isNumber(value) || this.isString(value) || value instanceof Date
    }

    // Filtre uygulama
    private applyFilters(item: Model) {
      return this.filters.every((filter) => {
        const value = item[filter.field]
        const filterValue = filter.value

        // String operasyonları için type guard
        const isStringValue = (val: unknown): val is string => {
          return typeof val === 'string'
        }

        // Karşılaştırma operasyonları için type guard
        const isComparableValue = (val: unknown): val is number | string | Date => {
          return typeof val === 'number' || typeof val === 'string' || val instanceof Date
        }

        // Array operasyonları için type guard
        const isArrayValue = <T>(val: unknown): val is T[] => {
          return Array.isArray(val)
        }

        switch (filter.operator) {
          case FilterOperator.Contains:
            if (!isStringValue(value) || !isStringValue(filterValue)) {
              return false
            }
            return value.toLowerCase().includes(filterValue.toLowerCase())

          case FilterOperator.In:
            if (!isArrayValue(filterValue)) {
              return false
            }
            return filterValue.includes(value as any)

          case FilterOperator.NotIn:
            if (!isArrayValue(filterValue)) {
              return false
            }
            return !filterValue.includes(value as any)

          case FilterOperator.Equals:
            return value === filterValue

          case FilterOperator.NotEquals:
            return value !== filterValue

          case FilterOperator.GreaterThan:
          case FilterOperator.GreaterThanOrEqual:
          case FilterOperator.LessThan:
          case FilterOperator.LessThanOrEqual:
            if (!isComparableValue(value) || !isComparableValue(filterValue)) {
              return false
            }
            
            switch (filter.operator) {
              case FilterOperator.GreaterThan:
                return value > filterValue
              case FilterOperator.GreaterThanOrEqual:
                return value >= filterValue
              case FilterOperator.LessThan:
                return value < filterValue
              case FilterOperator.LessThanOrEqual:
                return value <= filterValue
            }
            break

          default:
            return true
        }
      })
    }

    private applySorts(a: Model, b: Model) {
      for (const sort of this.sorts) {
        const aValue = a[sort.field]
        const bValue = b[sort.field]

        if (aValue === bValue)
          continue

        const modifier = sort.direction === 'asc' ? 1 : -1
        return aValue > bValue ? modifier : -modifier
      }
      return 0
    }

    private async loadRelatedData<K extends keyof ModelRelations[T]>(
      parentData: Model[], 
      field: K
    ) {
      const config = await getRelationConfig(modelId, field)
      if (!config) return parentData

      const relatedItems = await fetchContentrainData(config.model)
      const relatedType = config.type

      return parentData.map((item) => {
        const fieldValue = item[field as keyof Model]
        const dataField = `${String(field)}-data` as keyof Model

        // ID karşılaştırmaları için type guard
        const isValidId = (value: unknown): value is string => {
          return typeof value === 'string' && value.length > 0
        }

        // Array ID karşılaştırmaları için type guard
        const isValidIdArray = (value: unknown): value is string[] => {
          return Array.isArray(value) && value.every(isValidId)
        }

        if (relatedType === 'one-to-many' && isValidIdArray(fieldValue)) {
          return {
            ...item,
            [dataField]: relatedItems.filter(related => 
              isValidId(related.ID) && fieldValue.includes(related.ID)
            )
          }
        }
        else if (relatedType === 'one-to-one' && isValidId(fieldValue)) {
          return {
            ...item,
            [dataField]: relatedItems.find(related => 
              isValidId(related.ID) && related.ID === fieldValue
            )
          }
        }

        return item
      })
    }

    async getResults(): Promise<Model[]> {
      // Önce tüm validasyonları kontrol et
      const validationResults = await Promise.all(this.validations)
      if (validationResults.some(result => !result)) {
        throw new Error('Validation failed')
      }

      let result = await this.dataPromise

      if (this.filters.length) {
        result = result.filter(item => this.applyFilters(item))
      }

      if (this.sorts.length) {
        result = result.sort((a, b) => this.applySorts(a, b))
      }

      if (this.relations.length) {
        for (const field of this.relations) {
          result = await this.loadRelatedData(result, field)
        }
      }

      return result
    }

    async findOne(): Promise<Model | null> {
      const results = await this.getResults()
      return results[0] || null
    }
  }

  // Helper fonksiyonlar
  async function validateValue(field: keyof Model, value: any): Promise<boolean> {
    const modelFields = await getModelFields()
    const fieldData = modelFields.find((f: ContentrainModelField) => f.fieldId === String(field))

    if (!fieldData) return false

    switch (fieldData.componentId) {
      case 'integer':
      case 'decimal':
      case 'rating':
      case 'percent':
        return typeof value === 'number'
      
      case 'checkbox':
      case 'switch':
        return typeof value === 'boolean'
      
      case 'date':
      case 'date-time':
        return typeof value === 'string' && !isNaN(Date.parse(value))
      
      case 'single-line-text':
      case 'multi-line-text':
      case 'email':
      case 'url':
      case 'slug':
        return typeof value === 'string'
    }

    return true
  }

  async function validateStringField(field: keyof Model): Promise<boolean> {
    const modelFields = await getModelFields()
    const fieldData = modelFields.find((f: ContentrainModelField) => f.fieldId === String(field))

    return fieldData?.fieldType === 'string'
  }

  return new ContentrainQuery()
}
