import type { ContentrainBaseModel, ContentrainModelMetadata } from '@contentrain/types';
import type { DataLoader } from './types';
import { QueryError, QueryErrorCodes } from '../types';

export class FetchLoader implements DataLoader {
  constructor(private basePath: string) {}

  private async fetchJson<T>(filePath: string): Promise<T> {
    try {
      const response = await fetch(`${this.basePath}/${filePath}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    }
    catch (error) {
      throw new QueryError(
        `Failed to fetch JSON from ${filePath}`,
        QueryErrorCodes.FILE_READ_ERROR,
        { path: filePath, error },
      );
    }
  }

  async loadModel<T extends ContentrainBaseModel>(modelId: string, locale: string = 'en'): Promise<T[]> {
    try {
      const filePath = `${modelId}/${locale}.json`;
      const data = await this.fetchJson<T[]>(filePath);
      if (!Array.isArray(data)) {
        throw new TypeError('Invalid model data format');
      }
      return data;
    }
    catch (error) {
      throw new QueryError(
        `Failed to load model: ${modelId}`,
        QueryErrorCodes.MODEL_NOT_FOUND,
        { modelId, locale, error },
      );
    }
  }

  async loadModelSchema<T>(modelId: string): Promise<T> {
    try {
      const filePath = `models/${modelId}.json`;
      const fields = await this.fetchJson<T>(filePath);
      return {
        name: modelId,
        modelId,
        fields,
        localization: true,
        type: 'JSON',
        createdBy: 'system',
        isServerless: false,
      } as T;
    }
    catch (error) {
      throw new QueryError(
        `Failed to load model schema: ${modelId}`,
        QueryErrorCodes.MODEL_NOT_FOUND,
        { modelId, error },
      );
    }
  }

  async loadRelation<T extends ContentrainBaseModel>(relationId: string, id: string, locale: string = 'en'): Promise<T | null> {
    try {
      const items = await this.loadModel<T>(relationId, locale);
      return items.find(item => item.ID === id) || null;
    }
    catch {
      return null;
    }
  }

  async getModelMetadata(modelId: string): Promise<ContentrainModelMetadata | null> {
    try {
      const filePath = 'models/metadata.json';
      const allMetadata = await this.fetchJson<Record<string, ContentrainModelMetadata>>(filePath);
      if (!allMetadata || typeof allMetadata !== 'object') {
        throw new Error('Invalid metadata format');
      }
      return allMetadata[modelId] || {
        name: modelId,
        modelId,
        fields: [],
        localization: true,
        type: 'JSON',
        createdBy: 'system',
        isServerless: false,
      };
    }
    catch {
      return {
        name: modelId,
        modelId,
        fields: [],
        localization: true,
        type: 'JSON',
        createdBy: 'system',
        isServerless: false,
      };
    }
  }
}
