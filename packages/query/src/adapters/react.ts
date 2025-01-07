import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter } from '../runtime/types';
import type { AdapterOptions, AdapterResult } from './types';
import { useCallback, useEffect, useState } from 'react';
import { BaseAdapter } from './base';

export class ReactAdapter extends BaseAdapter {
  constructor(runtime: RuntimeAdapter) {
    super(runtime);
  }
}

export function useQuery<T extends ContentrainBaseModel>(
  adapter: ReactAdapter,
  model: string,
  options?: AdapterOptions,
) {
  type QueryResult = AdapterResult<T[]>;

  const [result, setResult] = useState<QueryResult>({
    data: [],
    error: null,
    isLoading: true,
    isFetching: true,
    isError: false,
    refetch: async () => {},
    invalidate: async () => {},
  });

  const refetch = useCallback(async () => {
    setResult((prev: QueryResult) => ({ ...prev, isFetching: true }));
    const newResult = await adapter.query<T>(model, options);
    setResult(newResult);
  }, [adapter, model, options]);

  const invalidate = useCallback(async () => {
    await adapter.runtime.invalidateCache(model);
    await refetch();
  }, [adapter, model, refetch]);

  useEffect(() => {
    result.refetch = refetch;
    result.invalidate = invalidate;
  }, [result, refetch, invalidate]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const queryResult = await adapter.query<T>(model, options);
        if (mounted) {
          setResult(queryResult);
        }
      }
      catch (error) {
        if (mounted) {
          setResult((prev: QueryResult) => ({
            ...prev,
            error: error as Error,
            isError: true,
            isLoading: false,
            isFetching: false,
          }));
        }
      }
    };

    void fetchData();

    return () => {
      mounted = false;
    };
  }, [adapter, model, options]);

  return result;
}

export function useOne<T extends ContentrainBaseModel>(
  adapter: ReactAdapter,
  model: string,
  id: string,
  options?: AdapterOptions,
) {
  type OneResult = AdapterResult<T | null>;

  const [result, setResult] = useState<OneResult>({
    data: null,
    error: null,
    isLoading: true,
    isFetching: true,
    isError: false,
    refetch: async () => {},
    invalidate: async () => {},
  });

  const refetch = useCallback(async () => {
    setResult((prev: OneResult) => ({ ...prev, isFetching: true }));
    const newResult = await adapter.getOne<T>(model, id, options);
    setResult(newResult);
  }, [adapter, model, id, options]);

  const invalidate = useCallback(async () => {
    await adapter.runtime.invalidateCache(model);
    await refetch();
  }, [adapter, model, refetch]);

  useEffect(() => {
    result.refetch = refetch;
    result.invalidate = invalidate;
  }, [result, refetch, invalidate]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const queryResult = await adapter.getOne<T>(model, id, options);
        if (mounted) {
          setResult(queryResult);
        }
      }
      catch (error) {
        if (mounted) {
          setResult((prev: OneResult) => ({
            ...prev,
            error: error as Error,
            isError: true,
            isLoading: false,
            isFetching: false,
          }));
        }
      }
    };

    void fetchData();

    return () => {
      mounted = false;
    };
  }, [adapter, model, id, options]);

  return result;
}

export function usePrefetch(adapter: ReactAdapter) {
  return useCallback(
    (models: string[]) => {
      void adapter.prefetch(models);
    },
    [adapter],
  );
}

export function useSubscription(
  adapter: ReactAdapter,
  hooks: Parameters<ReactAdapter['subscribe']>[0],
) {
  useEffect(() => {
    return adapter.subscribe(hooks);
  }, [adapter, hooks]);
}

export function createReactAdapter(runtime: RuntimeAdapter): ReactAdapter {
  return new ReactAdapter(runtime);
}
