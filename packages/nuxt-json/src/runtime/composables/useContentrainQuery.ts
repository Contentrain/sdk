import { ref } from 'vue'
import type { Ref } from 'vue'
import type {
  Content,
  LocalizedContent,
  QueryFilter,
  QueryResult,
  QuerySort,
} from '../types/contentrain'

export class ContentrainQuery<M extends Content | LocalizedContent> {
  private _locale?: string
  private _filters: QueryFilter[] = []
  private _sort: QuerySort[] = []
  private _limit?: number
  private _offset?: number
  private _includes: string[] = []
  private readonly _data: Ref<M[]>
  private readonly _total: Ref<number>
  private readonly _loading: Ref<boolean>
  private readonly _error: Ref<Error | null>

  constructor(private modelId: string) {
    this._data = ref([]) as Ref<M[]>
    this._total = ref(0)
    this._loading = ref(false)
    this._error = ref(null)
  }

  locale(locale: string): this {
    this._locale = locale
    return this
  }

  where(field: keyof M & string, operator: QueryFilter['operator'], value: unknown): this {
    this._filters.push({ field, operator, value })
    return this
  }

  orderBy(field: keyof M & string, direction: 'asc' | 'desc' = 'asc'): this {
    this._sort.push({ field, direction })
    return this
  }

  limit(limit: number): this {
    this._limit = limit
    return this
  }

  offset(offset: number): this {
    this._offset = offset
    return this
  }

  include(relation: string): this {
    if (!this._includes.includes(relation)) {
      this._includes.push(relation)
    }
    return this
  }

  async get(): Promise<QueryResult<M>> {
    const params = new URLSearchParams()

    if (this._locale) {
      params.append('locale', this._locale)
    }

    if (this._filters.length) {
      params.append('filters', JSON.stringify(this._filters))
    }

    if (this._sort.length) {
      params.append('sort', JSON.stringify(this._sort))
    }

    if (this._limit) {
      params.append('limit', this._limit.toString())
    }

    if (this._offset) {
      params.append('offset', this._offset.toString())
    }

    if (this._includes.length) {
      params.append('include', JSON.stringify(this._includes))
    }

    params.append('modelId', this.modelId)

    const apiUrl = `/_contentrain/api/query?${params.toString()}`
    console.log('Making request to:', apiUrl)

    try {
      this._loading.value = true
      console.log('Request params:', {
        modelId: this.modelId,
        locale: this._locale,
        filters: this._filters,
        sort: this._sort,
        limit: this._limit,
        offset: this._offset,
        includes: this._includes,
      })

      const response = await $fetch<QueryResult<M>>(apiUrl, {
        onRequest({ options }) {
          console.log('Request options:', options)
        },
        onResponse({ response }) {
          console.log('Response status:', response.status)
          console.log('Response data:', response._data)
        },
        onRequestError({ error }) {
          console.error('Request error:', error)
        },
        onResponseError({ response }) {
          console.error('Response error:', response._data)
        },
      })

      console.log('API Response:', response)
      this._data.value = response.data
      this._total.value = response.total
      return response
    }
    catch (error) {
      console.error('Query error:', error)
      this._error.value = error as Error
      this._data.value = []
      this._total.value = 0
      return { data: [], total: 0, pagination: { limit: 10, offset: 0, total: 0 } }
    }
    finally {
      this._loading.value = false
    }
  }

  async first(): Promise<M | null> {
    this._limit = 1
    const result = await this.get()
    return result.data[0] || null
  }

  async count(): Promise<number> {
    await this.get()
    return this._total.value
  }

  get data(): Ref<M[]> {
    return this._data
  }

  get total(): Ref<number> {
    return this._total
  }

  get loading(): Ref<boolean> {
    return this._loading
  }

  get error(): Ref<Error | null> {
    return this._error
  }
}

export function useContentrainQuery<M extends Content | LocalizedContent>(modelId: string): ContentrainQuery<M> {
  return new ContentrainQuery<M>(modelId)
}
