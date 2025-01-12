#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { Command } from 'commander';
import { ContentrainTypesGenerator } from '.';

const program = new Command();

program
  .name('contentrain-types-generator')
  .description('Contentrain model şemalarından TypeScript tip tanımları üretir')
  .version('1.0.0')
  .option('-m, --models <path>', 'Model dizininin yolu')
  .option('-o, --output <path>', 'Çıktı dizininin yolu')
  .option('-c, --content <path>', 'İçerik dizininin yolu')
  .option('-d, --debug', 'Debug modunda çalıştır')
  .parse(process.argv);

const options = program.opts();

// Komut satırı argümanlarını mutlak yola çevir
const resolvedOptions = {
  modelsDir: options.models ? path.resolve(process.cwd(), options.models) : undefined,
  outputDir: options.output ? path.resolve(process.cwd(), options.output) : undefined,
  contentDir: options.content ? path.resolve(process.cwd(), options.content) : undefined,
};

if (options.debug) {
  console.log('CLI Seçenekleri:', options);
  console.log('Çözümlenmiş Seçenekler:', resolvedOptions);
}

const generator = new ContentrainTypesGenerator(resolvedOptions);

try {
  if (options.debug) {
    console.log('Generator Yapılandırması:', {
      modelsDir: generator.getConfig().modelsDir,
      contentDir: generator.getConfig().contentDir,
      outputDir: generator.getConfig().outputDir,
    });
  }
  generator.generate();
  console.log('✨ Tip tanımları başarıyla oluşturuldu');
}
catch (error: unknown) {
  if (options.debug && error instanceof Error) {
    console.error('❌ Hata detayları:', error.cause);
  }
  console.error('❌ Tip tanımları oluşturulurken hata:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
