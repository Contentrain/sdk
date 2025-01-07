import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter } from '../runtime/types';
import type { AdapterOneResult, AdapterOptions, AdapterResult } from './types';
import { computed, onUnmounted, ref, shallowRef } from 'vue';
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
  const data = shallowRef<T[]>([]);
  const error = shallowRef<Error | null>(null);
  const isLoading = ref(true);
  const isFetching = ref(true);
  const isError = ref(false);
  const total = ref(0);
  const cached = ref(false);

  async function fetchData() {
    isFetching.value = true;
    try {
      const result = await adapter.query<T>(model, options);
      data.value = result.data;
      total.value = result.total;
      cached.value = result.cached;
      error.value = null;
      isError.value = false;
    }
    catch (err) {
      error.value = err as Error;
      isError.value = true;
    }
    finally {
      isLoading.value = false;
      isFetching.value = false;
    }
  }

  async function invalidate() {
    await adapter.runtime.invalidateCache(model);
    await fetchData();
  }

  // İlk yükleme
  void fetchData();

  // Computed result
  const result = computed<AdapterResult<T>>(() => ({
    data: data.value,
    error: error.value,
    isLoading: isLoading.value,
    isFetching: isFetching.value,
    isError: isError.value,
    total: total.value,
    cached: cached.value,
    refetch: fetchData,
    invalidate,
  }));

  return result;
}

export function useOne<T extends ContentrainBaseModel>(
  adapter: VueAdapter,
  model: string,
  id: string,
  options?: AdapterOptions,
) {
  const data = shallowRef<T | null>(null);
  const error = shallowRef<Error | null>(null);
  const isLoading = ref(true);
  const isFetching = ref(true);
  const isError = ref(false);
  const total = ref(0);
  const cached = ref(false);

  async function fetchData() {
    isFetching.value = true;
    try {
      const item = await adapter.getOne<T>(model, id, options);
      data.value = item;
      total.value = item ? 1 : 0;
      cached.value = false;
      error.value = null;
      isError.value = false;
    }
    catch (err) {
      error.value = err as Error;
      isError.value = true;
    }
    finally {
      isLoading.value = false;
      isFetching.value = false;
    }
  }

  async function invalidate() {
    await adapter.runtime.invalidateCache(model);
    await fetchData();
  }

  // İlk yükleme
  void fetchData();

  // Computed result
  const result = computed<AdapterOneResult<T>>(() => ({
    data: data.value ? [data.value] : [],
    error: error.value,
    isLoading: isLoading.value,
    isFetching: isFetching.value,
    isError: isError.value,
    total: total.value,
    cached: cached.value,
    refetch: fetchData,
    invalidate,
  }));

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
