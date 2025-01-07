import type { ContentrainBaseModel } from '@contentrain/types';
import type { ContentTransformer } from './types';

export class TransformerManager {
  private transformers: ContentTransformer[] = [];

  addTransformer(transformer: ContentTransformer): void {
    this.transformers.push(transformer);
  }

  async transform(content: ContentrainBaseModel): Promise<ContentrainBaseModel> {
    let transformedContent = { ...content };

    for (const transformer of this.transformers) {
      try {
        transformedContent = await transformer.transform(transformedContent);
      }
      catch (error) {
        console.error(`Error in transformer ${transformer.name}:`, error);
        throw error;
      }
    }

    return transformedContent;
  }

  async transformBatch(contents: ContentrainBaseModel[]): Promise<ContentrainBaseModel[]> {
    return Promise.all(contents.map(async content => this.transform(content)));
  }

  clear(): void {
    this.transformers = [];
  }
}
