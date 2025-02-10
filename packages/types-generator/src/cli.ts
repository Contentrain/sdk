#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { Command } from 'commander';
import { ContentrainTypesGenerator } from '.';

const program = new Command();

program
  .name('contentrain-generate')
  .description('Generate types for Contentrain Query')
  .version('2.1.0')
  .option('-m, --models <path>', 'Path to the models directory')
  .option('-o, --output <path>', 'Path to the output directory')
  .option('-c, --content <path>', 'Path to the Contentrain content directory')
  .option('-l, --lint', 'Lint and format the generated types')
  .option('-d, --debug', 'Run in debug mode')
  .parse(process.argv);

async function main() {
  const options = program.opts();

  try {
    // Komut satırı argümanlarını mutlak yola çevir
    const resolvedOptions = {
      modelsDir: options.models ? path.resolve(process.cwd(), options.models) : undefined,
      outputDir: options.output ? path.resolve(process.cwd(), options.output) : undefined,
      contentDir: options.content ? path.resolve(process.cwd(), options.content) : undefined,
      lint: options.lint,
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

    await generator.generate();
  }
  catch (error: unknown) {
    if (options.debug) {
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          cause: error.cause,
          stack: error.stack,
        });
      }

      else {
        console.error('❌ Error details:', error);
      }
    }
    else {
      console.error('❌ Error while generating types:', error instanceof Error ? error.message : String(error));
      console.error('Use the --debug option for more details');
    }

    process.exit(1);
  }
}

// Ana fonksiyonu çalıştır
main().catch((error) => {
  console.error('❌ Beklenmeyen hata:', error);
  process.exit(1);
});
