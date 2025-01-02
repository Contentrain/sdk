import type { IContentrainPlugin } from './index'
import type { QueryBuilder } from '../core/query-builder'
import type { ContentrainTypeMap } from '../types/runtime'
import type { IGenerateTypesResult } from '../types/base'

export class LoggerPlugin implements IContentrainPlugin {
  name = 'logger'

  hooks = {
    beforeQuery: (query: QueryBuilder<any, ContentrainTypeMap>) => {
      const modelId = query['modelId']
      const filters = query['filters']
      const relations = query['relations']
      const sorts = query['sorts']

      console.log('📝 Query başlatılıyor:', {
        modelId,
        filters: filters.map(f => ({
          field: String(f.field),
          operator: f.operator,
          value: f.value
        })),
        relations,
        sorts: sorts.map(s => ({
          field: String(s.field),
          direction: s.direction
        }))
      })
    },

    afterQuery: (results: unknown[]) => {
      console.log('✨ Query sonuçları:', {
        count: results.length,
        sample: results.slice(0, 1)
      })
    },

    beforeGenerate: () => {
      console.log('🔄 Tip üretimi başlatılıyor...')
    },

    afterGenerate: (result: IGenerateTypesResult) => {
      console.log(result.success 
        ? '✅ Tipler başarıyla oluşturuldu'
        : `❌ Tip üretimi başarısız: ${result.error}`
      )
    }
  }
}

// Default export olarak logger instance'ı
export const logger = new LoggerPlugin()
export default logger 