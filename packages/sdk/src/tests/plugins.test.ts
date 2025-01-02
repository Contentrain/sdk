import { describe, it, expect, vi } from 'vitest'
import { PluginManager } from '../plugins'
import { QueryBuilder } from '../core/query-builder'
import { Contentrain } from '../core/contentrain'

describe('Plugin System', () => {
  it('should execute hooks', async () => {
    const manager = new PluginManager()
    const mockFn = vi.fn()
    
    const testPlugin = {
      name: 'test',
      hooks: {
        beforeQuery: mockFn
      }
    }

    const contentrain = new Contentrain()
    const query = new QueryBuilder<any>('test', contentrain)

    manager.register(testPlugin)
    await manager.runHook('beforeQuery', query)
    
    expect(mockFn).toHaveBeenCalledWith(query)
  })
}) 