import type { BaseContentrainType, Operator, QueryConfig } from '@contentrain/query';
import type { H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';
import { createError, defineEventHandler, readBody } from 'h3';
import { getSDK } from '../../utils/sdk';

interface QueryBody {
  model: string
  where?: Array<[string, Operator, any]>
  include?: string[]
  orderBy?: Array<[string, 'asc' | 'desc']>
  limit?: number
  offset?: number
  locale?: string
  cache?: boolean
  ttl?: number
}

function validateQueryBody(body: QueryBody): void {
  if (!body.model) {
    throw createError({
      statusCode: 400,
      message: 'Model is required',
    });
  }

  if (body.limit !== undefined && (typeof body.limit !== 'number' || body.limit < 0)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid limit value',
    });
  }

  if (body.offset !== undefined && (typeof body.offset !== 'number' || body.offset < 0)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid offset value',
    });
  }

  if (body.ttl !== undefined && (typeof body.ttl !== 'number' || body.ttl < 0)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid TTL value',
    });
  }
}

function handleQueryError(error: unknown): never {
  console.error('Query error:', error);
  const err = error as { statusCode?: number, message?: string };
  throw createError({
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal server error',
    cause: error,
  });
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody<QueryBody>(event);

    // Validate request body
    validateQueryBody(body);

    const sdk = getSDK(config);
    const query = sdk.query<QueryConfig<BaseContentrainType, string, Record<string, BaseContentrainType>>>(body.model);

    // Apply filters
    if (body.where) {
      body.where.forEach(([field, operator, value]) => {
        query.where(field as any, operator, value);
      });
    }

    // Apply includes
    if (body.include) {
      query.include(body.include);
    }

    // Apply sorting
    if (body.orderBy) {
      body.orderBy.forEach(([field, direction]) => {
        query.orderBy(field as any, direction);
      });
    }

    // Apply pagination
    if (body.limit) {
      query.limit(body.limit);
    }

    if (body.offset) {
      query.offset(body.offset);
    }

    // Apply locale
    if (body.locale) {
      query.locale(body.locale);
    }

    // Apply cache options
    if (body.cache === false) {
      query.noCache();
    }
    else if (body.ttl) {
      query.cache(body.ttl);
    }

    return await query.get();
  }
  catch (error: unknown) {
    handleQueryError(error);
  }
});
