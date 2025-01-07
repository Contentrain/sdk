import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter } from '../runtime/types';
import type { AdapterOptions, AdapterResult } from './types';
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
  type QueryResult = AdapterResult<T[]>;

  const result = ref<QueryResult>({
    data: [],
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
      result.value = queryResult;
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

  const invalidateData = async () => {
    await adapter.runtime.invalidateCache(model);
    await fetchData();
  };

  // Metodları güncelle
  result.value.refetch = fetchData;
  result.value.invalidate = invalidateData;

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
  type OneResult = AdapterResult<T | null>;

  const result = ref<OneResult>({
    data: null,
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
      const queryResult = await adapter.getOne<T>(model, id, options);
      result.value = queryResult;
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

  const invalidateData = async () => {
    await adapter.runtime.invalidateCache(model);
    await fetchData();
  };

  // Metodları güncelle
  result.value.refetch = fetchData;
  result.value.invalidate = invalidateData;

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
