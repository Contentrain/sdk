import type { QueryBuilder } from '../core/query-builder'
import type { IBaseModel } from '../types/base'
import type { ContentrainTypeMap } from '../types/runtime'
import type { IGenerateTypesResult } from '../types/base'

// Hook tipleri
type QueryHook = (query: QueryBuilder<any, ContentrainTypeMap>) => Promise<void> | void
type ResultsHook = (results: unknown[]) => Promise<void> | void
type GenerateHook = () => Promise<void> | void
type GenerateResultHook = (result: IGenerateTypesResult) => Promise<void> | void

export interface IContentrainPlugin {
  name: string
  hooks: {
    beforeQuery?: QueryHook
    afterQuery?: ResultsHook
    beforeGenerate?: GenerateHook
    afterGenerate?: GenerateResultHook
  }
}

export class PluginManager {
  private plugins: IContentrainPlugin[] = []

  register(plugin: IContentrainPlugin) {
    this.plugins.push(plugin)
  }

  async runHook(name: keyof IContentrainPlugin['hooks'], arg?: any): Promise<void> {
    for (const plugin of this.plugins) {
      const hook = plugin.hooks[name]
      if (typeof hook === 'function') {
        await Promise.resolve(hook(arg))
      }
    }
  }
}

// Singleton instance
export const pluginManager = new PluginManager() 