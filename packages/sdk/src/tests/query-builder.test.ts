import { describe, it, expect, beforeAll } from 'vitest'
import { Contentrain } from '../core/contentrain'
import { join } from 'node:path'
import type { IBlogPost, IAuthor } from './fixtures/types'

describe('QueryBuilder', () => {
  let contentrain: Contentrain

  beforeAll(() => {
    contentrain = new Contentrain({
      rootDir: join(__dirname, 'fixtures')
    })
  })

  it('should filter blog posts by status', async () => {
    const posts = await contentrain
      .query<IBlogPost>('blog-posts')
      .where('status', 'eq', 'publish')
      .execute()

    expect(posts.length).toBeGreaterThan(0)
    expect(posts.every(p => p.status === 'publish')).toBe(true)
  })

  it('should load author relations', async () => {
    const posts = await contentrain
      .query<IBlogPost>('blog-posts')
      .with('author')
      .execute()

    expect(posts[0].authorData).toBeDefined()
    expect(posts[0].authorData?.name).toBeDefined()
  })

  it('should sort by date', async () => {
    const posts = await contentrain
      .query<IBlogPost>('blog-posts')
      .orderBy('createdAt', 'desc')
      .execute()

    const dates = posts.map(p => new Date(p.createdAt).getTime())
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })
}) 