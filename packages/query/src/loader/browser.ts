import type {
  ContentrainBaseModel,
  ContentrainField,
  ContentrainModelMetadata,
} from '@contentrain/types';
import type { ModelMetadata } from '../types';
import type { DataLoader } from './types';

export class FetchLoader implements DataLoader {
  private metadataCache: Map<string, ModelMetadata> = new Map();

  constructor(private basePath: string) {}

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  private async getModelMetadata(modelId: string): Promise<ModelMetadata> {
    if (this.metadataCache.has(modelId)) {
      return this.metadataCache.get(modelId)!;
    }

    const metadataUrl = `${this.basePath}/models/metadata.json`;
    const metadata = await this.fetchJson<ContentrainModelMetadata[]>(metadataUrl);
    const modelMetadata = metadata.find(m => m.modelId === modelId);

    if (!modelMetadata) {
      throw new Error(`Model metadata not found: ${modelId}`);
    }

    const modelUrl = `${this.basePath}/models/${modelId}.json`;
    const modelFields = await this.fetchJson<ContentrainField[]>(modelUrl);

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
    const metadata = await this.getModelMetadata(model);
    const url = metadata.localization && locale
      ? `${this.basePath}/${model}/${locale}.json`
      : `${this.basePath}/${model}/index.json`;

    return this.fetchJson<T[]>(url);
  }

  async loadRelation<T extends ContentrainBaseModel>(
    model: string,
    id: string,
    locale?: string,
  ): Promise<T | null> {
    const items = await this.loadModel<T>(model, locale);
    return items.find(item => item.ID === id) || null;
  }
}
