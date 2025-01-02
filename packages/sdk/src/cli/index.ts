#!/usr/bin/env node
import { Command } from 'commander'
import { generateTypes } from '../core/type-generator'

const program = new Command()

program
  .name('contentrain')
  .description('Contentrain SDK CLI')
  .version('0.1.0')

program
  .command('generate-types')
  .description('Generate TypeScript types from Contentrain models')
  .option('--root <path>', 'Root directory', '.')
  .option('--output <path>', 'Output file path', 'src/types/contentrain.d.ts')
  .option('--watch', 'Watch mode', false)
  .action(async (options) => {
    try {
      console.log('🔄 Tip üretimi başlıyor...')
      
      const result = await generateTypes({
        rootDir: options.root,
        output: options.output,
        watch: options.watch
      })

      if (result.success) {
        console.log('✅ Tipler başarıyla üretildi')
      } else {
        console.error('❌ Tip üretimi başarısız:', result.error)
        process.exit(1)
      }
    } catch (error) {
      console.error('❌ Beklenmeyen hata:', error)
      process.exit(1)
    }
  })

program.parse() 