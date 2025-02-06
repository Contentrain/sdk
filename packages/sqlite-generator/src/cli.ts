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
  .description('JSON içeriğini SQLite veritabanına dönüştürür')
  .option('-m, --models <dir>', 'Model tanımlarının bulunduğu dizin', 'contentrain/models')
  .option('-c, --content <dir>', 'İçerik dosyalarının bulunduğu dizin', 'contentrain')
  .option('-o, --output <dir>', 'Çıktı dizini', 'db')
  .option('-d, --db-name <name>', 'Veritabanı dosya adı', 'contentrain.db')
  .option('-t, --types-file <name>', 'Tip tanımları dosya adı', 'contentrain.d.ts')
  .option('--cache-enabled', 'Önbelleği etkinleştir', true)
  .option('--cache-ttl <seconds>', 'Önbellek süresi (saniye)', '300')
  .option('--validate-input', 'Girdi doğrulamasını etkinleştir', true)
  .option('--max-input-length <length>', 'Maksimum girdi uzunluğu', '1000')
  .option('--enable-wal', 'WAL modunu etkinleştir', true)
  .option('--cache-size <size>', 'Önbellek boyutu (KB)', '2000')
  .option('--page-size <size>', 'Sayfa boyutu (byte)', '4096')
  .option('--journal-size <size>', 'Günlük boyutu (byte)', '67108864')
  .action(async (options) => {
    try {
      const generator = new SQLiteGenerator({
        modelsDir: join(cwd(), options.models),
        contentDir: join(cwd(), options.content),
        outputDir: join(cwd(), options.output),
        dbName: options.dbName,
        typesFile: options.typesFile,
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
      console.info(`Tip tanımları oluşturuldu: ${join(cwd(), options.output, options.typesFile)}`);
    }
    catch (error) {
      console.error('\nHata:', error instanceof Error ? error.message : String(error));
      if (error instanceof ContentrainError) {
        console.error('Detaylar:', error.details);
      }
      exit(1);
    }
  });

program.parse();
