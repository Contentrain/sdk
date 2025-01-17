import type { BaseContentrainType, Include, Operator, QueryConfig, QueryResult } from '@contentrain/query';
import type { H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';
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

interface QueryBody {
  model: string
  where?: Array<[string, Operator, unknown]>
  include?: string[] | Record<string, { fields?: string[], include?: Include }>
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
    if (Array.isArray(body.include)) {
      body.include.forEach((relation) => {
        if (typeof relation !== 'string') {
          throw createError({
            statusCode: 400,
            message: 'include items must be strings',
          });
        }
      });
    }
    else if (typeof body.include === 'object') {
      Object.entries(body.include).forEach(([relation, config]) => {
        if (typeof relation !== 'string') {
          throw createError({
            statusCode: 400,
            message: 'include relation must be a string',
          });
        }
        if (config.fields && !Array.isArray(config.fields)) {
          throw createError({
            statusCode: 400,
            message: 'include fields must be an array',
          });
        }
      });
    }
    else {
      throw createError({
        statusCode: 400,
        message: 'include must be an array or an object',
      });
    }
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
      if (Array.isArray(body.include)) {
        body.include.forEach((relation) => {
          query.include(relation);
        });
      }
      else if (typeof body.include === 'string') {
        query.include(body.include);
      }
      else {
        Object.entries(body.include).forEach(([relation, config]) => {
          query.include(relation);

          if (config.fields) {
            console.warn('fields property in include is not supported yet');
          }

          if (config.include) {
            console.warn('nested includes are not supported yet');
          }
        });
      }
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
    else if (body.cache !== undefined || body.ttl) {
      query.cache(body.ttl);
    }

    return await query.get();
  }
  catch (error: unknown) {
    handleQueryError(error);
  }
});
