import { defineEventHandler, getQuery } from 'h3'
import { useStorage } from 'nitropack/runtime/storage'
import type { ModelData, QueryFilter, QueryResult, QuerySort } from '../../types/contentrain'
import { RelationResolver } from '../services/relation-resolver'
import { STORAGE_KEYS } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const {
    modelId,
    locale,
    filters: filtersStr,
    sort: sortStr,
    limit: limitStr,
    offset: offsetStr,
    include: includeStr,
  } = query
  console.log('Query:', query)
  if (!modelId || typeof modelId !== 'string') {
    throw new Error('Model ID is required')
  }

  const storage = useStorage('data')
  const model = await storage.getItem<ModelData>(STORAGE_KEYS.MODEL_DATA(modelId))
  if (!model) {
    throw new Error(`Model not found: ${modelId}`)
  }

  let content = [...model.content]

  // Apply locale filter
  if (locale && typeof locale === 'string' && model.metadata.localization) {
    content = content.filter(item => 'lang' in item && item.lang === locale)
  }

  // Apply filters
  if (filtersStr && typeof filtersStr === 'string') {
    try {
      const filters = JSON.parse(filtersStr) as QueryFilter[]
      content = content.filter(item =>
        filters.every((filter) => {
          const value = item[filter.field]
          const compareValue = filter.value

          switch (filter.operator) {
            case 'eq':
              return value === compareValue
            case 'ne':
              return value !== compareValue
            case 'gt':
              return typeof value === 'number' && typeof compareValue === 'number' && value > compareValue
            case 'gte':
              return typeof value === 'number' && typeof compareValue === 'number' && value >= compareValue
            case 'lt':
              return typeof value === 'number' && typeof compareValue === 'number' && value < compareValue
            case 'lte':
              return typeof value === 'number' && typeof compareValue === 'number' && value <= compareValue
            case 'in':
              return Array.isArray(compareValue) && compareValue.includes(value)
            case 'nin':
              return Array.isArray(compareValue) && !compareValue.includes(value)
            case 'contains':
              return typeof value === 'string' && typeof compareValue === 'string' && value.includes(compareValue)
            case 'startsWith':
              return typeof value === 'string' && typeof compareValue === 'string' && value.startsWith(compareValue)
            case 'endsWith':
              return typeof value === 'string' && typeof compareValue === 'string' && value.endsWith(compareValue)
            default:
              return true
          }
        }),
      )
    }
    catch (error) {
      console.error('Error parsing filters:', error)
    }
  }

  // Apply sorting
  if (sortStr && typeof sortStr === 'string') {
    try {
      const sort = JSON.parse(sortStr) as QuerySort[]
      content.sort((a, b) => {
        for (const { field, direction } of sort) {
          const aValue = a[field]
          const bValue = b[field]

          if (aValue === bValue) continue

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            const modifier = direction === 'asc' ? 1 : -1
            return aValue > bValue ? modifier : -modifier
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue)
          }
        }
        return 0
      })
    }
    catch (error) {
      console.error('Error parsing sort:', error)
    }
  }

  // Get total before pagination
  const total = content.length

  // Apply pagination
  const limit = limitStr ? Number.parseInt(String(limitStr), 10) : 10
  const offset = offsetStr ? Number.parseInt(String(offsetStr), 10) : 0
  content = content.slice(offset, offset + limit)

  // Resolve relations
  if (includeStr && typeof includeStr === 'string') {
    try {
      const includes = JSON.parse(includeStr) as string[]
      const modelList = await storage.getItem<ModelData[]>(STORAGE_KEYS.MODEL_LIST) || []
      const resolver = new RelationResolver(modelList)
      content = await resolver.resolveRelations(model, content, includes, locale as string | undefined)
    }
    catch (error) {
      console.error('Error resolving relations:', error)
    }
  }

  const response: QueryResult<typeof content[0]> = {
    data: content,
    total,
    pagination: {
      limit,
      offset,
      total,
    },
  }

  return response
})
