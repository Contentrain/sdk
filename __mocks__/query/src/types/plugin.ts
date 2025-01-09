import type { ConfigEnv, UserConfig, ViteDevServer } from 'vite';

export interface ContentrainPluginOptions {
  /**
   * Contentrain içeriklerinin bulunduğu dizin
   * @default 'contentrain'
   */
  contentDir?: string

  /**
   * İşlenecek dosya pattern'leri
   * @default ['**\/*.json']
   */
  include?: string[]

  /**
   * Hariç tutulacak dosya pattern'leri
   * @default ['node_modules/**']
   */
  exclude?: string[]

  /**
   * Hot reload desteği
   * @default true
   */
  hot?: boolean

  /**
   * Cache süresi (ms)
   * @default 300000 (5 dakika)
   */
  cacheTime?: number
}

export interface ContentrainPluginContext {
  server: ViteDevServer
  config: UserConfig
  command: ConfigEnv['command']
  mode: string
}

export interface ContentrainUpdateEvent {
  type: 'contentrain:update'
  data: {
    path: string
    file?: string
  }
}

export interface ContentrainHMRPayload {
  type: 'reload' | 'update'
  path: string
  timestamp: number
}
