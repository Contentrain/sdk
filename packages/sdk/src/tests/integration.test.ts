import { describe, it, expect } from 'vitest'
import { Contentrain } from '../core/contentrain'
import { LoggerPlugin } from '../plugins/logger'

describe('Integration', () => {
  it('should work with plugins and relations', async () => {
    const contentrain = new Contentrain()
    contentrain.use(LoggerPlugin)

    const posts = await contentrain
      .query('blog-posts')
      .with('author')
      .where('status', 'eq', 'publish')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .execute()

    expect(posts).toHaveLength(5)
    expect(posts[0]).toHaveProperty('authorData')
  })
}) 