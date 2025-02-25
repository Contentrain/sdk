import type { ModelMetadata } from './contentrain'

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    'contentrain:loaded': (ctx: { models: ModelMetadata[] }) => void | Promise<void>
  }
}
