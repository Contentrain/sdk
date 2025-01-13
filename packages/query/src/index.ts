import type { ContentLoaderOptions } from './types/loader';
import type { BaseContentrainType, QueryConfig } from './types/model';
import { ContentLoader } from './loader/content';
import { ContentrainQueryBuilder } from './query/builder';
import { QueryExecutor } from './query/executor';

export * from './cache';
export * from './loader/content';
export * from './query/builder';
export * from './query/executor';
export * from './types';

export class ContentrainSDK {
  private loader: ContentLoader;
  private executor: QueryExecutor;

  constructor(options: ContentLoaderOptions) {
    this.loader = new ContentLoader(options);
    this.executor = new QueryExecutor(this.loader);
  }

  query<T extends QueryConfig<BaseContentrainType, string, Record<string, BaseContentrainType>>>(
    model: string,
  ): ContentrainQueryBuilder<T['fields'], T['locales'], T['relations']> {
    return new ContentrainQueryBuilder<T['fields'], T['locales'], T['relations']>(
      model,
      this.executor,
      this.loader,
    );
  }

  async load<T extends BaseContentrainType>(model: string) {
    return this.loader.load<T>(model);
  }
}
