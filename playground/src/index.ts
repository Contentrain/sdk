import { Contentrain } from '@contentrain/sdk'
import type { ContentrainTypeMap, IBlogPost } from './types/contentrain'

// Artık tip hatası vermeyecek
const contentrain = new Contentrain<ContentrainTypeMap>()

async function getBlogPosts(): Promise<IBlogPost[]> {
  const posts = await contentrain
    .query('blog-posts')
    .where('status', 'eq', 'publish')
    .with('author')
    .execute()

  return posts
}

// Örnek kullanım
async function main() {
  console.log('🚀 Contentrain SDK Test')
  const posts = await getBlogPosts()
  console.log(`📚 Toplam ${posts.length} blog post bulundu`)
}

// Çalıştır
main().catch(console.error) 