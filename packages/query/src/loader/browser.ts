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
      return await response.json();
    }
    catch (error) {
      throw new QueryError(
        `Failed to fetch JSON from ${filePath}`,
        QueryErrorCodes.FILE_READ_ERROR,
        { path: filePath, error },
      );
    }
  }

  async loadModel<T extends ContentrainBaseModel>(modelId: string, locale?: string): Promise<T[]> {
    try {
      // If locale is specified, load language file
      if (locale) {
        const filePath = `${modelId}/${locale}.json`;
        return await this.fetchJson<T[]>(filePath);
      }

      // If no locale, try direct model file first
      try {
        return await this.fetchJson<T[]>(`${modelId}.json`);
      }
      catch {
        // If direct file not found, try modelId/modelId.json
        return await this.fetchJson<T[]>(`${modelId}/${modelId}.json`);
      }
    }
    catch (error) {
      throw new QueryError(
        `Failed to load model: ${modelId}`,
        QueryErrorCodes.MODEL_NOT_FOUND,
        { modelId, locale, error },
      );
    }
  }

  async loadRelation<T extends ContentrainBaseModel>(relationId: string, id: string): Promise<T | null> {
    try {
      const items = await this.loadModel<T>(relationId);
      return items.find(item => item.ID === id) || null;
    }
    catch {
      return null;
    }
  }

  async getModelMetadata(modelId: string): Promise<ContentrainModelMetadata | null> {
    try {
      const filePath = `${modelId}/metadata.json`;
      return await this.fetchJson<ContentrainModelMetadata>(filePath);
    }
    catch {
      return null;
    }
  }
}
