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
  ): Promise<AdapterResult<T[]>> {
    const result: AdapterResult<T[]> = {
      data: [] as T[],
      error: null,
      isLoading: true,
      isFetching: true,
      isError: false,
      refetch: async () => {
        await this.invalidateAndRefetch(model);
      },
      invalidate: async () => {
        await this.runtime.invalidateCache(model);
      },
    };

    try {
      await this.executeHooks('onBeforeQuery', model);

      const queryResult = await this.runtime.loadModel<T>(model, {
        locale: options?.defaultLocale,
        namespace: options?.cache?.namespace,
        buildOutput: options?.basePath,
      });

      result.data = queryResult.data;
      result.isLoading = false;
      result.isFetching = false;

      if (queryResult.metadata.cached) {
        await this.executeHooks('onCacheHit', model);
      }
      else {
        await this.executeHooks('onCacheMiss', model);
      }

      await this.executeHooks('onAfterQuery', model, queryResult.data);
    }
    catch (error) {
      result.error = error as Error;
      result.isError = true;
      result.isLoading = false;
      result.isFetching = false;
      await this.executeHooks('onError', error as Error);
    }

    return result;
  }

  async getOne<T extends ContentrainBaseModel>(
    model: string,
    id: string,
    options?: AdapterOptions,
  ): Promise<AdapterResult<T | null>> {
    const result: AdapterResult<T | null> = {
      data: null,
      error: null,
      isLoading: true,
      isFetching: true,
      isError: false,
      refetch: async () => {
        await this.invalidateAndRefetch(model);
      },
      invalidate: async () => {
        await this.runtime.invalidateCache(model);
      },
    };

    try {
      await this.executeHooks('onBeforeQuery', model);

      const item = await this.runtime.loadRelation<T>(model, id, {
        locale: options?.defaultLocale,
        namespace: options?.cache?.namespace,
        buildOutput: options?.basePath,
      });

      result.data = item;
      result.isLoading = false;
      result.isFetching = false;

      await this.executeHooks('onAfterQuery', model, item ? [item] : []);
    }
    catch (error) {
      result.error = error as Error;
      result.isError = true;
      result.isLoading = false;
      result.isFetching = false;
      await this.executeHooks('onError', error as Error);
    }

    return result;
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

  private async invalidateAndRefetch(model: string): Promise<void> {
    await this.runtime.invalidateCache(model);
    await this.query(model, this.options || undefined);
  }
}
