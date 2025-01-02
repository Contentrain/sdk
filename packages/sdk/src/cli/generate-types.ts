#!/usr/bin/env node

import { generateTypes } from '../core/type-generator'
import { parseArgs } from 'node:util'

async function main() {
  try {
    const { values } = parseArgs({
      options: {
        rootDir: { type: 'string' },
        output: { type: 'string' },
        watch: { type: 'boolean' }
      }
    })

    const result = await generateTypes({
      rootDir: values.rootDir,
      output: values.output,
      watch: values.watch
    })

    if (!result.success) {
      console.error('Failed to generate types:', result.error)
      process.exit(1)
    }

    if (!values.watch) {
      console.log('Types generated successfully!')
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main() 