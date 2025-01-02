/**
 * Tip üretim mantığının referans implementasyonu.
 * Yeni tip üretim özellikleri eklerken bu mantığı koruyun.
 */

interface TypeGenerationContext {
  // 1. Model Dönüşümleri
  modelToInterface: {
    naming: 'PascalCase with I prefix', // IBlogPosts
    extends: 'BaseModel',
    properties: {
      base: ['ID', 'createdAt', 'updatedAt', 'status'],
      generated: 'from fields array'
    }
  },

  // 2. İlişki Yönetimi
  relations: {
    oneToOne: {
      idField: 'string', // author: string
      dataField: 'interface', // authorData?: IAuthor
    },
    oneToMany: {
      idField: 'string[]', // categories: string[]
      dataField: 'interface[]' // categoriesData?: ICategory[]
    }
  },

  // 3. Validasyon Desteği
  validations: {
    required: 'remove optional marker (?)',
    unique: 'add unique constraint',
    range: 'add numeric range'
  }
} 