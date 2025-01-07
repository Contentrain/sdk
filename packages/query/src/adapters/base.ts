import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter } from '../runtime/types';
import type {
  AdapterHooks,
  AdapterOptions,
  AdapterResult,
  FrameworkAdapter,
} from './types';

export abstract class BaseAdapter implements FrameworkAdapter {
  protected hooks: AdapterHooks[] = [];
  protected options: AdapterOptions | null = null;

  constructor(public runtime: RuntimeAdapter) {}

  async initialize(options: AdapterOptions): Promise<void> {
    this.options = options;
    await this.runtime.initialize(options);
  }

  async query<T extends ContentrainBaseModel>(
    model: string,
    options?: AdapterOptions,
  ): Promise<AdapterResult<T>> {
    try {
      await this.executeHooks('onBeforeQuery', model);

      const queryResult = await this.runtime.loadModel<T>(model, {
        locale: options?.defaultLocale,
        namespace: options?.cache?.namespace,
        buildOutput: options?.basePath,
      });

      await this.executeHooks('onAfterQuery', model, queryResult.data);

      return {
        data: queryResult.data,
        total: queryResult.metadata.total,
        cached: queryResult.metadata.cached,
        error: null,
        isLoading: false,
        isFetching: false,
        isError: false,
      };
    }
    catch (error) {
      await this.executeHooks('onError', error as Error);
      throw error;
    }
  }

  async getOne<T extends ContentrainBaseModel>(
    model: string,
    id: string,
    options?: AdapterOptions,
  ): Promise<T | null> {
    try {
      await this.executeHooks('onBeforeQuery', model);

      const item = await this.runtime.loadRelation<T>(model, id, {
        locale: options?.defaultLocale,
        namespace: options?.cache?.namespace,
        buildOutput: options?.basePath,
      });

      await this.executeHooks('onAfterQuery', model, item ? [item] : []);

      return item;
    }
    catch (error) {
      await this.executeHooks('onError', error as Error);
      throw error;
    }
  }

  async prefetch(models: string[]): Promise<void> {
    await Promise.all(
      models.map(async model =>
        this.runtime.loadModel(model, {
          locale: this.options?.defaultLocale,
          namespace: this.options?.cache?.namespace,
          buildOutput: this.options?.basePath,
        }),
      ),
    );
  }

  subscribe(hooks: AdapterHooks): () => void {
    this.hooks.push(hooks);
    return () => {
      const index = this.hooks.indexOf(hooks);
      if (index > -1) {
        this.hooks.splice(index, 1);
      }
    };
  }

  async cleanup(): Promise<void> {
    this.hooks = [];
    await this.runtime.cleanup();
    this.options = null;
  }

  protected async executeHooks<K extends keyof AdapterHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<AdapterHooks[K]>>
  ): Promise<void> {
    for (const hook of this.hooks) {
      const fn = hook[hookName];
      if (fn) {
        await (fn as (...args: unknown[]) => Promise<void> | void)(...args);
      }
    }
  }
}
