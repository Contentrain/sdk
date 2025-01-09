import type { ContentLoaderOptions } from './types/loader';
import type { BaseContentrainType } from './types/model';
import { ContentLoader } from './loader/content';
import { ContentrainQueryBuilder } from './query/builder';
import { QueryExecutor } from './query/executor';

export class ContentrainSDK {
  private loader: ContentLoader;
  private executor: QueryExecutor;

  constructor(options: ContentLoaderOptions) {
    this.loader = new ContentLoader(options);
    this.executor = new QueryExecutor(this.loader);
  }

  query<T extends BaseContentrainType>(model: string): ContentrainQueryBuilder<T> {
    return new ContentrainQueryBuilder<T>(model, this.executor, this.loader);
  }

  async load<T extends BaseContentrainType>(model: string) {
    return this.loader.load<T>(model);
  }
}

// Default export
export default ContentrainSDK;
