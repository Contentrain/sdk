import { addImportsDir, addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit'
import defu from 'defu'

export interface ContentrainOptions {
  path: string
  defaultLocale?: string
  storage?: {
    driver?: 'memory' | 'fs'
    base?: string
  }
}

// Re-export types
export * from './runtime/types/contentrain'

declare module '@nuxt/schema' {
  interface ConfigSchema {
    contentrain?: ContentrainOptions
  }
}

export default defineNuxtModule<ContentrainOptions>({
  meta: {
    name: '@contentrain/nuxt-json',
    configKey: 'contentrain',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },

  defaults: {
    storage: {
      driver: process.env.NODE_ENV === 'production' ? 'fs' : 'memory',
      base: '.contentrain',
    },
  },

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const resolve = resolver.resolve.bind(resolver)

    // Runtime config
    const privateConfig: Record<string, unknown> = {}

    nuxt.options.runtimeConfig.contentrain = defu(
      nuxt.options.runtimeConfig.contentrain || {},
      privateConfig,
    )

    // Public config
    const publicConfig: Record<string, unknown> = {
      path: options.path,
      defaultLocale: options.defaultLocale,
    }

    nuxt.options.runtimeConfig.public.contentrain = defu(
      nuxt.options.runtimeConfig.public.contentrain || {},
      publicConfig,
    )

    // Add composables
    const composablePath = resolve('./runtime/composables')
    addImportsDir(composablePath)

    // Add API handlers
    addServerHandler({
      route: '/_contentrain/api/models',
      handler: resolve('./runtime/server/api/models/index.get'),
      method: 'get',
    })

    addServerHandler({
      route: '/_contentrain/api/models/:id',
      handler: resolve('./runtime/server/api/models/[id].get'),
      method: 'get',
    })

    addServerHandler({
      route: '/_contentrain/api/query',
      handler: resolve('./runtime/server/api/query.get'),
      method: 'get',
    })

    // Add Nitro plugin
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.plugins = nitroConfig.plugins || []
      nitroConfig.plugins.push(resolve('./runtime/server/plugins/contentrain'))

      // Storage configuration
      nitroConfig.storage = nitroConfig.storage || {}
      nitroConfig.storage.data = {
        driver: options.storage?.driver || 'memory',
        base: options.storage?.base || '.contentrain',
      }
    })

    // Add types
    nuxt.hook('prepare:types', (options) => {
      options.references.push({ types: '@contentrain/nuxt-json' })
    })
  },
})
