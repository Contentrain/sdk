import type { IDBRecord, Operator } from '@contentrain/query';
import type { H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';
import { QueryFactory } from '@contentrain/query';
import { createError, defineEventHandler, readBody } from 'h3';
import { getSDK } from '../utils/sdk';

const VALID_OPERATORS: Operator[] = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'nin',
  'contains',
  'startsWith',
  'endsWith',
];

interface QueryBody<T extends IDBRecord = IDBRecord> {
  model: string
  where?: Array<[keyof T & string, Operator, unknown]>
  include?: Array<{
    relation: keyof T['_relations'] & string
    locale?: string
  }>
  orderBy?: Array<[keyof T & string, 'asc' | 'desc']>
  limit?: number
  offset?: number
  locale?: string
  cache?: boolean
  ttl?: number
}

function validateQueryBody<T extends IDBRecord>(body: QueryBody<T>): void {
  if (!body.model) {
    throw createError({
      statusCode: 400,
      message: 'Model is required',
    });
  }

  // Validate where conditions
  if (body.where) {
    if (!Array.isArray(body.where)) {
      throw createError({
        statusCode: 400,
        message: 'where must be an array',
      });
    }
    body.where.forEach(([field, operator, _value]) => {
      if (typeof field !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'where field must be a string',
        });
      }
      if (!VALID_OPERATORS.includes(operator)) {
        throw createError({
          statusCode: 400,
          message: `Invalid operator: ${operator}. Valid operators are: ${VALID_OPERATORS.join(', ')}`,
        });
      }
    });
  }

  // Validate orderBy
  if (body.orderBy) {
    if (!Array.isArray(body.orderBy)) {
      throw createError({
        statusCode: 400,
        message: 'orderBy must be an array',
      });
    }
    body.orderBy.forEach(([field, direction]) => {
      if (typeof field !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'orderBy field must be a string',
        });
      }
      if (direction !== 'asc' && direction !== 'desc') {
        throw createError({
          statusCode: 400,
          message: 'orderBy direction must be either "asc" or "desc"',
        });
      }
    });
  }

  // Validate includes
  if (body.include) {
    if (!Array.isArray(body.include)) {
      throw createError({
        statusCode: 400,
        message: 'include must be an array',
      });
    }

    body.include.forEach((include) => {
      if (!include || typeof include !== 'object') {
        throw createError({
          statusCode: 400,
          message: 'Each include must be an object with relation property',
        });
      }

      if (typeof include.relation !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'include relation must be a string',
        });
      }

      if (include.locale !== undefined && typeof include.locale !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'include locale must be a string when provided',
        });
      }
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

  if (body.locale !== undefined && typeof body.locale !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'locale must be a string',
    });
  }

  if (body.cache !== undefined && typeof body.cache !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'cache must be a boolean',
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

    // Get SDK instance
    const sdk = getSDK(config);
    const query = QueryFactory.createSQLiteBuilder<IDBRecord>(body.model, sdk);

    // Apply filters
    if (body.where) {
      body.where.forEach(([field, operator, value]) => {
        query.where(field, operator, value);
      });
    }

    // Apply includes
    if (body.include) {
      body.include.forEach((include) => {
        query.include({
          relation: include.relation,
          locale: include.locale || body.locale,
        });
      });
    }

    // Apply sorting
    if (body.orderBy) {
      body.orderBy.forEach(([field, direction]) => {
        query.orderBy(field, direction);
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
    else if (body.cache !== undefined || body.ttl) {
      query.cache(body.ttl);
    }

    return await query.get();
  }
  catch (error: unknown) {
    handleQueryError(error);
  }
});
