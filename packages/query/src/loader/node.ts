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
      const data = JSON.parse(content);
      return data;
    }
    catch (error) {
      throw new QueryError(
        `Failed to read JSON file: ${filePath}`,
        QueryErrorCodes.FILE_READ_ERROR,
        { path: filePath, error },
      );
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, filePath));
      return true;
    }
    catch {
      return false;
    }
  }

  async loadModel<T extends ContentrainBaseModel>(modelId: string, locale: string = 'en'): Promise<T[]> {
    try {
      const filePath = path.join(modelId, `${locale}.json`);
      if (!await this.fileExists(filePath)) {
        throw new Error(`Model file not found: ${filePath}`);
      }
      const data = await this.readJsonFile<T[]>(filePath);
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
      const filePath = path.join('models', `${modelId}.json`);
      if (!await this.fileExists(filePath)) {
        throw new Error(`Model schema not found: ${filePath}`);
      }
      const fields = await this.readJsonFile<T>(filePath);
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
      const filePath = path.join('models', 'metadata.json');
      if (!await this.fileExists(filePath)) {
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
      const allMetadata = await this.readJsonFile<Record<string, ContentrainModelMetadata>>(filePath);
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
