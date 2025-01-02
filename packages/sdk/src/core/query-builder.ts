import type { IBaseModel, IFilterCondition, FilterOperator, ISortCondition } from '../types/base'
import type { ContentrainTypeMap, WithRelations } from '../types/runtime'
import { Contentrain } from './contentrain'

export class QueryBuilder<T extends IBaseModel, TMap extends ContentrainTypeMap = ContentrainTypeMap> {
  protected filters: IFilterCondition<T>[] = []
  protected sorts: ISortCondition<T>[] = []
  protected relations: (keyof T & string)[] = []
  protected pageNumber?: number
  protected pageSize?: number

  constructor(
    protected modelId: keyof TMap & string,
    protected client: Contentrain<TMap>
  ) {}

  // Query Methods
  where<K extends keyof T>(field: K, operator: FilterOperator, value: T[K]): this {
    this.filters.push({ field, operator, value } as IFilterCondition<T>)
    return this
  }

  // Relation Loading
  with(relation: keyof T & string): this {
    this.relations.push(relation)
    return this
  }

  // Sorting
  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
    this.sorts.push({ field, direction })
    return this
  }

  // Pagination
  page(number: number): this {
    this.pageNumber = Math.max(1, number)
    return this
  }

  perPage(size: number): this {
    this.pageSize = Math.max(1, size)
    return this
  }

  // Execution
  async execute(): Promise<WithRelations<T>[]> {
    const results = await this.client.getModel(this.modelId) as unknown as T[]
    return this.processResults(results)
  }

  // Helper Methods
  protected async processResults(results: T[]): Promise<WithRelations<T>[]> {
    let processedResults = [...results]

    // Apply filters
    if (this.filters.length) {
      processedResults = this.applyFilters(processedResults)
    }

    // Apply sorting
    if (this.sorts.length) {
      processedResults = this.applySorting(processedResults)
    }

    // Load relations
    if (this.relations.length) {
      processedResults = await this.loadRelations(processedResults)
    }

    // Apply pagination
    if (this.pageSize) {
      const offset = ((this.pageNumber || 1) - 1) * this.pageSize
      processedResults = processedResults.slice(offset, offset + this.pageSize)
    }

    return processedResults as WithRelations<T>[]
  }

  protected applyFilters(results: T[]): T[] {
    return results.filter(item => 
      this.filters.every(filter => this.matchFilter(item, filter))
    )
  }

  protected applySorting(results: T[]): T[] {
    return [...results].sort((a, b) => {
      for (const sort of this.sorts) {
        const aVal = a[sort.field]
        const bVal = b[sort.field]
        if (aVal === bVal) continue
        
        const modifier = sort.direction === 'asc' ? 1 : -1
        return aVal > bVal ? modifier : -modifier
      }
      return 0
    })
  }

  protected async loadRelations(results: T[]): Promise<WithRelations<T>[]> {
    const loadedResults = [...results] as WithRelations<T>[]

    for (const relation of this.relations) {
      const relatedModel = await this.client.getModel(relation) as IBaseModel[]
      
      for (const item of loadedResults) {
        const relationId = item[relation]
        if (!relationId) continue

        const dataKey = `${String(relation)}Data` as keyof WithRelations<T>

        if (Array.isArray(relationId)) {
          item[dataKey] = relatedModel.filter(r => relationId.includes(r.ID)) as any
        } else {
          item[dataKey] = relatedModel.find(r => r.ID === relationId) as any
        }
      }
    }

    return loadedResults
  }

  protected matchFilter(item: T, filter: IFilterCondition<T>): boolean {
    const value = item[filter.field]
    const filterValue = filter.value

    switch (filter.operator) {
      case 'eq': return value === filterValue
      case 'ne': return value !== filterValue
      case 'gt': return value > filterValue
      case 'gte': return value >= filterValue
      case 'lt': return value < filterValue
      case 'lte': return value <= filterValue
      case 'in': return Array.isArray(filterValue) && filterValue.includes(value)
      case 'nin': return Array.isArray(filterValue) && !filterValue.includes(value)
      default: return false
    }
  }
} 