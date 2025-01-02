/**
 * Bu dosya orijinal implementasyondan alınan test senaryolarını içerir.
 * Yeni özellikler eklerken bu senaryoların çalışmaya devam ettiğinden emin olun.
 */

// 1. Tip Üretimi
const typeGeneration = {
  input: {
    modelId: 'blog-posts',
    fields: [
      { fieldId: 'title', fieldType: 'string', componentId: 'single-line-text' },
      { fieldId: 'author', fieldType: 'relation', componentId: 'one-to-one' }
    ]
  },
  expectedOutput: `
    interface IBlogPosts extends BaseModel {
      title: string
      author: string
      authorData?: IAuthor
    }
  `
}

// 2. Query Builder
const queryExamples = {
  basic: `
    const posts = await contentrain
      .query<IBlogPosts>('blog-posts')
      .where('status', 'publish')
      .execute()
  `,
  withRelations: `
    const posts = await contentrain
      .query<IBlogPosts>('blog-posts')
      .with('author')
      .where('status', 'publish')
      .execute()
  `
}

// 3. Validation Örnekleri
const validationExamples = {
  required: {
    field: { fieldId: 'title', validations: { 'required-field': { value: true } } },
    check: (value: any) => value !== undefined && value !== null
  },
  type: {
    field: { fieldId: 'rating', componentId: 'rating', fieldType: 'number' },
    check: (value: any) => typeof value === 'number'
  }
} 