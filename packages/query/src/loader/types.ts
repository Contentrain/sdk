import type { ContentrainBaseModel, ContentrainModelMetadata } from '@contentrain/types';

export interface DataLoader {
  loadModel: <T extends ContentrainBaseModel>(modelId: string, locale?: string) => Promise<T[]>
  loadRelation: <T extends ContentrainBaseModel>(relationId: string, id: string) => Promise<T | null>
  getModelMetadata: (modelId: string) => Promise<ContentrainModelMetadata | null>
}
