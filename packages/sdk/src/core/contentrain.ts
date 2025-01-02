import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { QueryBuilder } from './query-builder'
import type { IContentrainConfig, IContentrainField } from '../types/base'
import { CONTENTRAIN_PATHS } from '../types/runtime'
import type { ContentrainTypeMap, ModelId } from '../types/runtime'
import { PluginManager } from '../plugins'
import type { IContentrainPlugin } from '../plugins'

export class ContentrainError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ContentrainError'
  }
}

/**
 * Contentrain SDK ana sınıfı
 * @example
 * ```ts
 * const contentrain = new Contentrain<ContentrainTypeMap>()
 * 
 * const posts = await contentrain
 *   .query('blog-posts')
 *   .where('status', 'eq', 'publish')
 *   .with('author')
 *   .execute()
 * ```
 */
export class Contentrain<T extends ContentrainTypeMap = ContentrainTypeMap> {
  private modelCache: Map<string, any[]> = new Map()
  private config: Required<IContentrainConfig>
  private pluginManager = new PluginManager()

  constructor(config: IContentrainConfig = {}) {
    this.config = {
      rootDir: config.rootDir || process.cwd(),
      modelsDir: config.modelsDir || CONTENTRAIN_PATHS.models,
      plugins: config.plugins || []
    }

    // Register plugins
    this.config.plugins.forEach(plugin => this.use(plugin))
  }

  /**
   * Plugin ekle
   */
  use(plugin: IContentrainPlugin): this {
    this.pluginManager.register(plugin)
    return this
  }

  /**
   * Model sorgusu oluştur
   */
  query<K extends ModelId<T>>(modelId: K): QueryBuilder<T[K], T> {
    const builder = new QueryBuilder<T[K], T>(modelId, this)
    void this.pluginManager.runHook('beforeQuery', builder)
    return builder
  }

  /**
   * Model verilerini getir
   * @internal
   */
  async getModel<K extends ModelId<T>>(modelId: K): Promise<T[K][]> {
    try {
      // Debug için
      const modelPath = join(
        this.config.rootDir,
        'contentrain',  // contentrain dizini
        modelId,        // model dizini (örn: blog-posts)
        `${modelId}.json` // dosya adı
      )

      console.log('Getting model:', {
        modelId,
        modelPath,
        exists: existsSync(modelPath)
      })

      // Cache'den kontrol et
      if (this.modelCache.has(modelId)) {
        return this.modelCache.get(modelId)!
      }

      // Model dosyasını oku
      const data = await readFile(modelPath, 'utf-8')
      const parsed = JSON.parse(data) as T[K][]

      // Cache'e kaydet
      this.modelCache.set(modelId, parsed)
      
      // Plugin hook'unu çalıştır
      await this.pluginManager.runHook('afterQuery', parsed)
      
      return parsed
    } catch (error) {
      console.error('Model load error:', error)
      throw new ContentrainError(
        `Model yüklenemedi: ${modelId}`,
        'MODEL_NOT_FOUND',
        error
      )
    }
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.modelCache.clear()
  }

  async getModelFields(modelId: ModelId<T>): Promise<IContentrainField[]> {
    const modelPath = join(
      this.config.rootDir,
      this.config.modelsDir,
      `${modelId}.json`
    )
    
    const data = await readFile(modelPath, 'utf-8')
    return JSON.parse(data)
  }
} 