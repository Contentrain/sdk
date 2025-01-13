#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { Command } from 'commander';
import { ContentrainTypesGenerator } from '.';

const program = new Command();

program
  .name('contentrain-generate')
  .description('Contentrain model şemalarından TypeScript tip tanımları üretir')
  .version('1.0.0')
  .option('-m, --models <path>', 'Model dizininin yolu')
  .option('-o, --output <path>', 'Çıktı dizininin yolu')
  .option('-c, --content <path>', 'İçerik dizininin yolu')
  .option('-d, --debug', 'Debug modunda çalıştır')
  .parse(process.argv);

const options = program.opts();

try {
  // Komut satırı argümanlarını mutlak yola çevir
  const resolvedOptions = {
    modelsDir: options.models ? path.resolve(process.cwd(), options.models) : undefined,
    outputDir: options.output ? path.resolve(process.cwd(), options.output) : undefined,
    contentDir: options.content ? path.resolve(process.cwd(), options.content) : undefined,
  };

  if (options.debug) {
    console.log('CLI Options:', options);
    console.log('Resolved Options:', resolvedOptions);
  }

  // Eğer komut satırı argümanları verilmemişse, config dosyasını kullan
  const generator = new ContentrainTypesGenerator(resolvedOptions);

  if (options.debug) {
    console.log('Generator Configuration:', {
      modelsDir: generator.getConfig().modelsDir,
      contentDir: generator.getConfig().contentDir,
      outputDir: generator.getConfig().outputDir,
    });
  }

  generator.generate();
}
catch (error: unknown) {
  if (options.debug) {
    if (error instanceof Error) {
      console.error('❌ Hata detayları:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });
    }
    else {
      console.error('❌ Hata detayları:', error);
    }
  }
  else {
    console.error('❌ Tip tanımları oluşturulurken hata:', error instanceof Error ? error.message : String(error));
    console.error('Daha fazla detay için -d veya --debug seçeneğini kullanın');
  }
  process.exit(1);
}
