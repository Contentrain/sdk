import type { ContentrainBaseModel } from '@contentrain/types';
import type { BuildOptions, BuildResult } from './types';
import { promises as fs, watch } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Indexer } from './indexer';
import { TransformerManager } from './transformer';

export class ContentrainBuilder {
  private transformerManager: TransformerManager;
  private indexer: Indexer | null = null;
  private watcher: ReturnType<typeof watch> | null = null;

  constructor() {
    this.transformerManager = new TransformerManager();
  }

  async build(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now();

    // Output dizinini oluştur
    await fs.mkdir(options.output, { recursive: true });

    // İndeksleme seçenekleri varsa indexer'ı başlat
    if (options.indexing) {
      this.indexer = new Indexer(options.indexing);
    }

    // Transformer'ları ekle
    if (options.transformers) {
      options.transformers.forEach(transformer =>
        this.transformerManager.addTransformer(transformer),
      );
    }

    const stats = {
      totalModels: 0,
      totalDocuments: 0,
      buildTime: 0,
    };

    const indexes: { [key: string]: { count: number, fields: string[] } } = {};

    // Her model için işlem yap
    for (const model of options.models) {
      const modelPath = path.join(process.cwd(), '.contentrain', model);
      const modelExists = await fs.stat(modelPath).catch(() => false);

      if (!modelExists) {
        console.warn(`Model not found: ${model}`);
        continue;
      }

      // Model verilerini oku
      const files = await fs.readdir(modelPath);
      const documents: ContentrainBaseModel[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(modelPath, file), 'utf-8');
          const document = JSON.parse(content);

          // Transform işlemini uygula
          const transformedDoc = await this.transformerManager.transform(document);
          documents.push(transformedDoc);

          // İndeksleme yap
          if (this.indexer) {
            this.indexer.indexDocument(transformedDoc);
          }
        }
      }

      // Model verilerini output dizinine yaz
      const outputPath = path.join(options.output, `${model}.json`);
      await fs.writeFile(outputPath, JSON.stringify(documents, null, 2));

      stats.totalModels++;
      stats.totalDocuments += documents.length;

      // İndeks istatistiklerini topla
      if (this.indexer) {
        indexes[model] = {
          count: documents.length,
          fields: options.indexing?.fields || [],
        };
      }
    }

    stats.buildTime = Date.now() - startTime;

    // Build sonuçlarını döndür
    const result: BuildResult = {
      stats,
      output: {
        path: options.output,
        size: await this.calculateDirectorySize(options.output),
      },
      indexes,
    };

    return result;
  }

  async watch(): Promise<void> {
    if (this.watcher) {
      this.watcher.close();
    }

    const contentPath = path.join(process.cwd(), '.contentrain');

    this.watcher = watch(
      contentPath,
      { encoding: 'utf-8', recursive: true },
      (_eventType: string, filename: string | null) => {
        if (filename) {
          console.log(`File ${filename} changed. Rebuilding...`);
          // Rebuild işlemi burada tetiklenecek
        }
      },
    );
  }

  async generateTypes(): Promise<void> {
    // TypeScript tip tanımlarını üret
    // Bu kısım daha sonra implemente edilecek
  }

  private async calculateDirectorySize(directory: string): Promise<number> {
    let size = 0;
    const files = await fs.readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      size += stats.size;
    }

    return size;
  }

  async cleanup(): Promise<void> {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.indexer) {
      this.indexer.clear();
      this.indexer = null;
    }

    this.transformerManager.clear();
  }
}

export * from './indexer';
export * from './transformer';
export * from './types';
