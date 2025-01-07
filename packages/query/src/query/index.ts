import type { ContentrainBaseModel } from '@contentrain/types';
import type { RuntimeAdapter } from '../runtime/types';
import type { QueryOptions } from './types';
import { QueryBuilder } from './builder';

export function createQuery<T extends ContentrainBaseModel = ContentrainBaseModel>(
  runtime: RuntimeAdapter,
  options: Omit<QueryOptions, 'runtime'> = {},
): QueryBuilder<T> {
  return new QueryBuilder<T>(runtime, { runtime, ...options });
}

export * from './builder';
export * from './types';
