import type { ContentrainBaseModel } from '@contentrain/types';

export interface DataLoader {
  /**
   * Loads a model's data
   * @param model Model ID
   * @param locale Optional locale for localized content
   */
  loadModel: <T extends ContentrainBaseModel>(
    model: string,
    locale?: string
  ) => Promise<T[]>

  /**
   * Loads a related model's data
   * @param model Model ID
   * @param id Related item ID
   * @param locale Optional locale for localized content
   */
  loadRelation: <T extends ContentrainBaseModel>(
    model: string,
    id: string,
    locale?: string
  ) => Promise<T | null>
}
