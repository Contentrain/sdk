import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter } from '../runtime/types';
import type { AdapterOneResult, AdapterOptions, AdapterResult } from './types';
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
  const [result, setResult] = useState<AdapterResult<T>>({
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

  const refetch = useCallback(async () => {
    setResult(prev => ({ ...prev, isFetching: true }));
    try {
      const queryResult = await adapter.query<T>(model, options);
      setResult(_ => ({
        ...queryResult,
        error: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch,
        invalidate: async () => {
          await adapter.runtime.invalidateCache(model);
          await refetch();
        },
      }));
    }
    catch (error) {
      setResult(prev => ({
        ...prev,
        error: error as Error,
        isError: true,
        isLoading: false,
        isFetching: false,
      }));
    }
  }, [adapter, model, options]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const queryResult = await adapter.query<T>(model, options);
        if (mounted) {
          setResult({
            ...queryResult,
            error: null,
            isLoading: false,
            isFetching: false,
            isError: false,
            refetch,
            invalidate: async () => {
              await adapter.runtime.invalidateCache(model);
              await refetch();
            },
          });
        }
      }
      catch (error) {
        if (mounted) {
          setResult(prev => ({
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
  }, [adapter, model, options, refetch]);

  return result;
}

export function useOne<T extends ContentrainBaseModel>(
  adapter: ReactAdapter,
  model: string,
  id: string,
  options?: AdapterOptions,
) {
  const [result, setResult] = useState<AdapterOneResult<T>>({
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

  const refetch = useCallback(async () => {
    setResult(prev => ({ ...prev, isFetching: true }));
    try {
      const item = await adapter.getOne<T>(model, id, options);
      setResult({
        data: item ? [item] : [],
        total: item ? 1 : 0,
        cached: false,
        error: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch,
        invalidate: async () => {
          await adapter.runtime.invalidateCache(model);
          await refetch();
        },
      });
    }
    catch (error) {
      setResult(prev => ({
        ...prev,
        error: error as Error,
        isError: true,
        isLoading: false,
        isFetching: false,
      }));
    }
  }, [adapter, model, id, options]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const item = await adapter.getOne<T>(model, id, options);
        if (mounted) {
          setResult({
            data: item ? [item] : [],
            total: item ? 1 : 0,
            cached: false,
            error: null,
            isLoading: false,
            isFetching: false,
            isError: false,
            refetch,
            invalidate: async () => {
              await adapter.runtime.invalidateCache(model);
              await refetch();
            },
          });
        }
      }
      catch (error) {
        if (mounted) {
          setResult(prev => ({
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
  }, [adapter, model, id, options, refetch]);

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
