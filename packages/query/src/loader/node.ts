import type {
  ContentrainBaseModel,
  ContentrainField,
  ContentrainModelMetadata,
  ContentrainModelType,
} from '@contentrain/types';
import type { ModelMetadata } from '../types';
import type { DataLoader } from './types';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export class FileSystemLoader implements DataLoader {
  private metadataCache: Map<string, ModelMetadata> = new Map();

  constructor(private basePath: string) {}

  private async readJsonFile<T>(filePath: string): Promise<T> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
    catch (error) {
      throw new Error(`Failed to read JSON file: ${filePath}`, { cause: error });
    }
  }

  private async getModelMetadata(modelId: string): Promise<ModelMetadata> {
    if (this.metadataCache.has(modelId)) {
      return this.metadataCache.get(modelId)!;
    }

    const metadataPath = join(this.basePath, 'models', 'metadata.json');
    const metadata = await this.readJsonFile<ContentrainModelMetadata[]>(metadataPath);
    const modelMetadata = metadata.find(m => m.modelId === modelId);

    if (!modelMetadata) {
      throw new Error(`Model metadata not found: ${modelId}`);
    }

    const modelPath = join(this.basePath, 'models', `${modelId}.json`);
    const modelFields = await this.readJsonFile<ContentrainField[]>(modelPath);

    const modelMeta: ModelMetadata = {
      name: modelMetadata.name,
      modelId: modelMetadata.modelId,
      localization: modelMetadata.localization || false,
      type: modelMetadata.type === 'MD' ? 'Markdown' : 'JSON',
      fields: modelFields,
      relations: {},
    };

    this.metadataCache.set(modelId, modelMeta);
    return modelMeta;
  }

  async loadModel<T extends ContentrainBaseModel>(
    model: string,
    locale?: string,
  ): Promise<T[]> {
    try {
      const metadata = await this.getModelMetadata(model);
      const filePath = metadata.localization && locale
        ? join(this.basePath, model, `${locale}.json`)
        : join(this.basePath, model, 'index.json');

      return await this.readJsonFile<T[]>(filePath);
    }
    catch (error) {
      console.error(`Error loading model ${model}:`, error);
      return [];
    }
  }

  async loadRelation<T extends ContentrainBaseModel>(
    model: string,
    id: string,
    locale?: string,
  ): Promise<T | null> {
    try {
      const items = await this.loadModel<T>(model, locale);
      return items.find(item => item.ID === id) || null;
    }
    catch (error) {
      console.error(`Error loading relation ${model}:`, error);
      return null;
    }
  }
}
