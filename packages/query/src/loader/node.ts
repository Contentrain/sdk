import type { ContentrainBaseModel, ContentrainModelMetadata } from '@contentrain/types';
import type { DataLoader } from './types';
import fs from 'node:fs/promises';
import path from 'node:path';
import { QueryError, QueryErrorCodes } from '../types';

export class FileSystemLoader implements DataLoader {
  constructor(private basePath: string) {}

  private async readJsonFile<T>(filePath: string): Promise<T> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content);
    }
    catch (error) {
      throw new QueryError(
        `Failed to read JSON file: ${filePath}`,
        QueryErrorCodes.FILE_READ_ERROR,
        { path: filePath, error },
      );
    }
  }

  async loadModel<T extends ContentrainBaseModel>(modelId: string, locale?: string): Promise<T[]> {
    try {
      // If locale is specified, load language file
      if (locale) {
        const filePath = path.join(modelId, `${locale}.json`);
        return await this.readJsonFile<T[]>(filePath);
      }

      // If no locale, try direct model file first
      try {
        return await this.readJsonFile<T[]>(`${modelId}.json`);
      }
      catch {
        // If direct file not found, try modelId/modelId.json
        return await this.readJsonFile<T[]>(path.join(modelId, `${modelId}.json`));
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
      const filePath = path.join(modelId, 'metadata.json');
      return await this.readJsonFile<ContentrainModelMetadata>(filePath);
    }
    catch {
      return null;
    }
  }
}
