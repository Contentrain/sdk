import { describe, it, expect } from 'vitest'
import { generateTypes } from '../core/type-generator'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

describe('Type Generator', () => {
  it('should generate types from models', async () => {
    const result = await generateTypes({
      output: 'test-types.d.ts'
    })

    expect(result.success).toBe(true)

    const content = await readFile('test-types.d.ts', 'utf-8')
    expect(content).toContain('interface IBlogPost extends BaseModel')
  })
}) 