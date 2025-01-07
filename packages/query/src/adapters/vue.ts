import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter } from '../runtime/types';
import type { AdapterOneResult, AdapterOptions, AdapterResult } from './types';
import { onUnmounted, ref, watch } from 'vue';
import { BaseAdapter } from './base';

export class VueAdapter extends BaseAdapter {
  constructor(runtime: RuntimeAdapter) {
    super(runtime);
  }
}

export function useQuery<T extends ContentrainBaseModel>(
  adapter: VueAdapter,
  model: string,
  options?: AdapterOptions,
) {
  const result = ref<AdapterResult<T>>({
    data: [],
    total: 0,
    cached: false,
    error: null,
    isLoading: true,
    isFetching: true,
    isError: false,
    refetch: async () => {},
    invalidate: async () => {},
  });

  const fetchData = async () => {
    result.value.isFetching = true;
    try {
      const queryResult = await adapter.query<T>(model, options);
      result.value = {
        ...queryResult,
        error: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: fetchData,
        invalidate: async () => {
          await adapter.runtime.invalidateCache(model);
          await fetchData();
        },
      };
    }
    catch (error) {
      result.value = {
        ...result.value,
        error: error as Error,
        isError: true,
        isLoading: false,
        isFetching: false,
      };
    }
  };

  // İlk yükleme
  void fetchData();

  // Options değişikliklerini izle
  watch(
    () => options,
    () => {
      void fetchData();
    },
    { deep: true },
  );

  return result;
}

export function useOne<T extends ContentrainBaseModel>(
  adapter: VueAdapter,
  model: string,
  id: string,
  options?: AdapterOptions,
) {
  const result = ref<AdapterOneResult<T>>({
    data: [],
    total: 0,
    cached: false,
    error: null,
    isLoading: true,
    isFetching: true,
    isError: false,
    refetch: async () => {},
    invalidate: async () => {},
  });

  const fetchData = async () => {
    result.value.isFetching = true;
    try {
      const item = await adapter.getOne<T>(model, id, options);
      result.value = {
        data: item ? [item] : [],
        total: item ? 1 : 0,
        cached: false,
        error: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: fetchData,
        invalidate: async () => {
          await adapter.runtime.invalidateCache(model);
          await fetchData();
        },
      };
    }
    catch (error) {
      result.value = {
        ...result.value,
        error: error as Error,
        isError: true,
        isLoading: false,
        isFetching: false,
      };
    }
  };

  // İlk yükleme
  void fetchData();

  // Options ve ID değişikliklerini izle
  watch(
    [() => options, () => id],
    () => {
      void fetchData();
    },
    { deep: true },
  );

  return result;
}

export function usePrefetch(adapter: VueAdapter) {
  return (models: string[]) => {
    void adapter.prefetch(models);
  };
}

export function useSubscription(
  adapter: VueAdapter,
  hooks: Parameters<VueAdapter['subscribe']>[0],
) {
  const unsubscribe = adapter.subscribe(hooks);
  onUnmounted(() => {
    unsubscribe();
  });
}

export function createVueAdapter(runtime: RuntimeAdapter): VueAdapter {
  return new VueAdapter(runtime);
}
