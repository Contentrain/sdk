#!/usr/bin/env node

import { join } from 'node:path';
import { cwd, exit } from 'node:process';
import { Command } from 'commander';
import { SQLiteGenerator } from './index';
import { ContentrainError } from './types/errors';

const program = new Command();

program
  .name('contentrain-sqlite')
  .description('Contentrain SQLite Generator CLI')
  .version('1.0.0');

program
  .command('generate')
  .description('Convert JSON content to SQLite database')
  .option('-m, --models <dir>', 'Directory containing model definitions', 'contentrain/models')
  .option('-c, --content <dir>', 'Directory containing content files', 'contentrain')
  .option('-o, --output <dir>', 'Output directory', 'db')
  .option('-d, --db-name <name>', 'Database file name', 'contentrain.db')
  .option('--cache-enabled', 'Enable caching', true)
  .option('--cache-ttl <seconds>', 'Cache duration (seconds)', '300')
  .option('--validate-input', 'Enable input validation', true)
  .option('--max-input-length <length>', 'Maximum input length', '1000')
  .option('--enable-wal', 'Enable WAL mode', true)
  .option('--cache-size <size>', 'Cache size (KB)', '2000')
  .option('--page-size <size>', 'Page size (byte)', '4096')
  .option('--journal-size <size>', 'Journal size (byte)', '67108864')

  .action(async (options) => {
    try {
      const generator = new SQLiteGenerator({
        modelsDir: join(cwd(), options.models),
        contentDir: join(cwd(), options.content),
        outputDir: join(cwd(), options.output),
        dbName: options.dbName,
        cache: {
          enabled: options.cacheEnabled,
          ttl: Number.parseInt(options.cacheTtl, 10),
        },

        security: {
          validateInput: options.validateInput,
          maxInputLength: Number.parseInt(options.maxInputLength, 10),
        },
        optimization: {
          enableWAL: options.enableWal,
          cacheSize: Number.parseInt(options.cacheSize, 10),
          pageSize: Number.parseInt(options.pageSize, 10),
          journalSize: Number.parseInt(options.journalSize, 10),
        },
      });

      await generator.generate();
      console.info(`\nVeritabanı oluşturuldu: ${join(cwd(), options.output, options.dbName)}`);
    }
    catch (error) {
      if (error instanceof ContentrainError) {
        console.error('Error:', error.message);
        console.error('Details:', error.details);
      }

      else {
        console.error('Error:', error instanceof Error ? error.message : String(error));
      }
      exit(1);
    }
  });

program.parse();
