import { Contentrain } from '@contentrain/sdk'
import type { ContentrainTypeMap } from './types/contentrain'

async function main() {
  const contentrain = new Contentrain<ContentrainTypeMap>({
    rootDir: process.cwd()
  })

  try {
    console.log('Config:', {
      rootDir: process.cwd()
    })

    const posts = await contentrain
      .query('blog-posts')
      .where('status', 'eq', 'publish')
      .execute()

    console.log('Raw posts:', posts)
    
    console.log(`${posts.length} blog post bulundu:`)
    posts.forEach(post => {
      console.log(`- ${post.title} (${post.ID})`)
    })
  } catch (error) {
    console.error('Hata detayı:', error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
  }
}

main().catch(console.error) 