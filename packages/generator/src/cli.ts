#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { program } from 'commander';
import { ContentrainGenerator } from './index';

async function ensureDirectoryExists(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  try {
    await fs.access(dir);
  }
  catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function main() {
  program
    .name('contentrain-generator')
    .description('Contentrain için TypeScript tip tanımları oluşturur')
    .option('-o, --output <path>', 'Çıktı dosyası yolu', 'types/contentrain.ts')
    .option('-m, --models <path>', 'Model tanımları klasörü yolu', 'contentrain/models')
    .parse();

  const options = program.opts();
  const outputPath = join(process.cwd(), options.output ?? 'types/contentrain.ts');

  try {
    const generator = new ContentrainGenerator({
      modelsDir: options.models,
      outputDir: dirname(outputPath),
    });
    await generator.generateTypes();

    await ensureDirectoryExists(outputPath);
    await fs.writeFile(outputPath, '', 'utf-8');

    console.log(`✨ Tip tanımları başarıyla oluşturuldu: ${outputPath}`);
  }
  catch (error) {
    console.error('❌ Tip tanımları oluşturulurken hata oluştu:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void main();
