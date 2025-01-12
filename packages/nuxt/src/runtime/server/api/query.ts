import type { BaseContentrainType, Operator, QueryConfig } from '@contentrain/core';
import type { H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';
import { createError, defineEventHandler, readBody } from 'h3';
import { getSDK } from '../utils/sdk';

interface QueryBody {
  model: string
  where?: Array<[string, Operator, any]>
  include?: string[]
  orderBy?: Array<[string, 'asc' | 'desc']>
  limit?: number
  offset?: number
  locale?: string
  defaultLocale?: string
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody<QueryBody>(event);
    const { model, where, include, orderBy, limit, offset, locale } = body;

    if (!model) {
      throw createError({
        statusCode: 400,
        message: 'Model is required',
      });
    }

    const sdk = getSDK(config);
    const query = sdk.query<QueryConfig<BaseContentrainType, string, Record<string, BaseContentrainType>>>(model);

    if (where) {
      where.forEach(([field, operator, value]) => {
        query.where(field as any, operator, value);
      });
    }

    if (include) {
      query.include(include);
    }

    if (orderBy) {
      orderBy.forEach(([field, direction]) => {
        query.orderBy(field as any, direction);
      });
    }

    if (limit) {
      query.limit(limit);
    }

    if (offset) {
      query.offset(offset);
    }

    if (locale) {
      query.locale(locale);
    }

    const result = await query.get();
    return result;
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, message?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal server error',
      cause: error,
    });
  }
});
