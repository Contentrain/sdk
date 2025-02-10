import type { Analyzer } from './types/analyzer';
import type { GeneratorConfig } from './types/config';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import prettier from 'prettier';
import { JSONAnalyzer } from './analyzers/json';
import { SQLiteAnalyzer } from './analyzers/sqlite';
import { isJSONConfig, isSQLiteConfig } from './types/config';

export class ContentrainTypesGenerator {
  private readonly analyzer: Analyzer;

  constructor(private readonly config: GeneratorConfig) {
    this.analyzer = this.createAnalyzer(config);

    // Source dizininin varlığını kontrol et
    if (isJSONConfig(config)) {
      if (!fs.existsSync(config.source.modelsDir)) {
        console.warn(`Warning: Models directory does not exist: ${config.source.modelsDir}`);
      }
    }
    else if (isSQLiteConfig(config)) {
      if (!fs.existsSync(config.source.databasePath)) {
        console.warn(`Warning: Database file does not exist: ${config.source.databasePath}`);
      }
    }

    // Output dizinini oluştur
    if (!fs.existsSync(config.output.dir)) {
      fs.mkdirSync(config.output.dir, { recursive: true });
      console.log(`Created output directory: ${config.output.dir}`);
    }
  }

  private createAnalyzer(config: GeneratorConfig): Analyzer {
    if (isJSONConfig(config)) {
      return new JSONAnalyzer(config);
    }
    else if (isSQLiteConfig(config)) {
      return new SQLiteAnalyzer(config);
    }
    throw new Error('Invalid source type');
  }

  async generate(): Promise<void> {
    try {
      const { baseTypes, queryTypes } = await this.analyzer.analyze();
      await this.writeTypeDefinitions(`${baseTypes}\n${queryTypes}`);
    }
    finally {
      this.analyzer.close?.();
    }
  }

  private async writeTypeDefinitions(typeDefinitions: string): Promise<void> {
    try {
      const { dir, filename = 'contentrain.d.ts' } = this.config.output;

      // Çıktı dizinini oluştur
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Fazla boş satırları temizle
      const cleanedDefinitions = typeDefinitions
        .replace(/\n{3,}/g, '\n\n') // 2'den fazla boş satırı 2 satıra indir
        .replace(/\n+$/g, '\n'); // Dosya sonundaki boş satırları temizle

      const outputPath = path.join(dir, filename);

      // Prettier ile formatla
      const prettierConfig = await prettier.resolveConfig(process.cwd());
      const formatted = await prettier.format(cleanedDefinitions, {
        ...prettierConfig,
        parser: 'typescript',
      });

      // Senkron olarak dosyayı yaz
      fs.writeFileSync(outputPath, formatted, { encoding: 'utf-8', flag: 'w' });

      // Dosyanın yazıldığını kontrol et
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Failed to write file: ${outputPath}`);
      }

      console.log(`\n✨ Type definitions successfully generated: ${outputPath}`);
    }
    catch (error) {
      throw new Error('Failed to write type definitions', { cause: error });
    }
  }
}
