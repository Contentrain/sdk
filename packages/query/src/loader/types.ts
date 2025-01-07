import type { ContentrainBaseModel, ContentrainModelMetadata } from '@contentrain/types';

export interface DataLoader {
  /**
   * Model içeriklerini yükler
   * @param modelId Model ID
   * @param locale Dil kodu (varsayılan: 'en')
   */
  loadModel: <T extends ContentrainBaseModel>(modelId: string, locale?: string) => Promise<T[]>

  /**
   * Model şemasını yükler
   * @param modelId Model ID
   */
  loadModelSchema: <T>(modelId: string) => Promise<T>

  /**
   * İlişkili veriyi yükler
   * @param relationId İlişkili model ID
   * @param id İlişkili veri ID
   * @param locale Dil kodu (varsayılan: 'en')
   */
  loadRelation: <T extends ContentrainBaseModel>(relationId: string, id: string, locale?: string) => Promise<T | null>

  /**
   * Model metadata bilgisini yükler
   * @param modelId Model ID
   */
  getModelMetadata: (modelId: string) => Promise<ContentrainModelMetadata | null>
}
