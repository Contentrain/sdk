/**
 * Query builder mantığının referans implementasyonu.
 * Sorgu özelliklerini değiştirirken bu mantığı koruyun.
 */

interface QueryBuilderContext {
  // 1. Temel Operasyonlar
  operations: {
    where: 'field filtering',
    with: 'relation loading',
    orderBy: 'sorting',
    limit: 'result limiting'
  },

  // 2. Tip Güvenliği
  typeChecks: {
    modelId: 'keyof ContentrainTypeMap',
    fields: 'keyof T',
    relations: 'keyof ModelRelations[T]'
  },

  // 3. Veri Dönüşümleri
  transformations: {
    camelToKebab: 'for field names',
    loadRelations: 'add Data suffix',
    filterOperators: ['eq', 'neq', 'gt', 'lt', 'contains']
  }
} 