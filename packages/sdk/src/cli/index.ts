#!/usr/bin/env node
import { Command } from 'commander'
import { generateTypes } from '../core/type-generator'
import type { IGenerateTypesOptions } from '../types/base'
import { logger } from '../plugins/logger'
import type { IContentrainPlugin } from '../plugins/index'

const program = new Command()

program
  .name('contentrain')
  .description('Contentrain CLI tools')
  .version('0.1.0')

program
  .command('generate')
  .description('Generate TypeScript types from Contentrain models')
  .option('-w, --watch', 'Watch for changes and regenerate types')
  .option('-o, --output <path>', 'Output file path', 'src/types/contentrain.d.ts')
  .option('-r, --root <path>', 'Root directory path')
  .option('-m, --models <path>', 'Models directory path')
  .action(async (options: Omit<IGenerateTypesOptions, 'plugins'>) => {
    try {
      const result = await generateTypes({
        ...options,
        plugins: [logger] as IContentrainPlugin[]
      })

      if (!result.success && result.error) {
        console.error('❌ Tip üretimi başarısız:', result.error)
        process.exit(1)
      }

      if (options.watch) {
        console.log('👀 Değişiklikler izleniyor...')
        process.stdin.resume()
      }
    } catch (error) {
      console.error('❌ Beklenmeyen hata:', error)
      process.exit(1)
    }
  })

process.on('SIGINT', () => {
  console.log('\n👋 Contentrain CLI kapatılıyor...')
  process.exit(0)
})

program.parse() 