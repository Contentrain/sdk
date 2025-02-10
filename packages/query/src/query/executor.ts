import type { ContentLoader } from '../loader/content';
import type { BaseContentrainType } from '../types/model';
import type { ArrayOperator, Filter, Include, NumericOperator, QueryOptions, QueryResult, Sort, StringOperator } from '../types/query';
import { loggers } from '../utils/logger';

const logger = loggers.executor;

export class QueryExecutor {
  private loader: ContentLoader;

  constructor(loader: ContentLoader) {
    this.loader = loader;
  }

  private applyFilters<T extends BaseContentrainType>(data: T[], filters: Filter[]): T[] {
    logger.debug('Starting to apply filters:', {
      dataLength: data.length,
      filters,
    });

    const result = data.filter((item) => {
      return filters.every(({ field, operator, value }) => {
        const itemValue = item[field as keyof T];

        // Invalid operator check
        const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'startsWith', 'endsWith'];
        if (!validOperators.includes(operator)) {
          logger.error('Invalid operator', { operator: operator.toString() });
          throw new Error(`Invalid operator: ${operator}`);
        }

        if (typeof itemValue === 'string' && typeof value === 'string') {
          return this.applyStringOperation(itemValue, operator as StringOperator, value);
        }

        if (Array.isArray(value)) {
          switch (operator as ArrayOperator) {
            case 'in':
              return (value as unknown[]).includes(itemValue);
            case 'nin':
              return !(value as unknown[]).includes(itemValue);
            default:
              logger.error('Invalid array operator', { operator: operator.toString() });
              throw new Error(`Invalid array operator: ${operator}`);
          }
        }

        if (Array.isArray(itemValue)) {
          switch (operator as ArrayOperator) {
            case 'in':
              return (value as unknown[]).some((v: unknown) => itemValue.includes(v));
            case 'nin':
              return !(value as unknown[]).some((v: unknown) => itemValue.includes(v));
            default:
              logger.error('Invalid array operator', { operator: operator.toString() });
              throw new Error(`Invalid array operator: ${operator}`);
          }
        }

        if (typeof itemValue === 'number' && typeof value === 'number') {
          switch (operator as NumericOperator) {
            case 'eq':
              return itemValue === value;
            case 'ne':
              return itemValue !== value;
            case 'gt':
              return itemValue > value;
            case 'gte':
              return itemValue >= value;
            case 'lt':
              return itemValue < value;
            case 'lte':
              return itemValue <= value;
          }
        }

        return false;
      });
    });

    logger.debug('Filter application completed:', {
      initialCount: data.length,
      resultCount: result.length,
    });

    return result;
  }

  private applySorting<T extends BaseContentrainType>(data: T[], sorting: Sort[]): T[] {
    return [...data].sort((a, b) => {
      for (const { field, direction } of sorting) {
        // Sıralama alanı validasyonu
        if (!(field in a)) {
          throw new Error(`Invalid sort field: ${field}`);
        }

        const aValue = a[field as keyof T];
        const bValue = b[field as keyof T];

        if (aValue === bValue)
          continue;

        const compareResult = aValue < bValue ? -1 : 1;
        return direction === 'asc' ? compareResult : -compareResult;
      }
      return 0;
    });
  }

  private applyPagination<T>(data: T[], limit?: number, offset: number = 0): T[] {
    if (!limit)
      return data.slice(offset);
    return data.slice(offset, offset + limit);
  }

  private async resolveIncludes<T extends BaseContentrainType>(
    model: string,
    data: T[],
    includes: Include,
    options: QueryOptions,
  ): Promise<T[]> {
    logger.debug('Starting to resolve relations:', {
      model,
      dataLength: data.length,
      includes,
      options,
    });

    const result = [...data];

    for (const [field, config] of Object.entries(includes)) {
      logger.debug(`Resolving relation "${field}"`);

      // Resolve relation
      const relations = await this.loader.resolveRelation(
        model,
        field as keyof T,
        result,
        options.locale,
      );

      logger.debug(`Relation "${field}" resolved:`, {
        foundRelationsCount: relations.length,
      });

      // Resolve nested relations
      if (config.include && relations.length) {
        logger.debug(`Resolving nested relations for "${field}":`, config.include);
        await this.resolveIncludes(
          field,
          relations,
          config.include,
          options,
        );
      }

      // Add related data
      result.forEach((item) => {
        const value = item[field as keyof T];
        const relatedItems = relations.filter((r) => {
          if (Array.isArray(value)) {
            return value.includes(r.ID);
          }
          return r.ID === value;
        });

        if (!item._relations) {
          item._relations = {};
        }
        item._relations[field] = Array.isArray(value) ? relatedItems : relatedItems[0];
      });

      logger.debug(`Data added for relation "${field}"`);
    }

    return result;
  }

  private applyStringOperation(value: string, operator: StringOperator, searchValue: string): boolean {
    switch (operator) {
      case 'eq':
        return value === searchValue;
      case 'ne':
        return value !== searchValue;
      case 'contains':
        return value.toLowerCase().includes(searchValue.toLowerCase());
      case 'startsWith':
        return value.toLowerCase().startsWith(searchValue.toLowerCase());
      case 'endsWith':
        return value.toLowerCase().endsWith(searchValue.toLowerCase());
      default: {
        const _exhaustiveCheck: never = operator;
        return _exhaustiveCheck;
      }
    }
  }

  async execute<T extends BaseContentrainType>({
    model,
    data,
    filters = [],
    includes = {},
    sorting = [],
    pagination = {},
    options = {},
  }: {
    model: string
    data: T[]
    filters?: Filter[]
    includes?: Include
    sorting?: Sort[]
    pagination?: { limit?: number, offset?: number }
    options?: QueryOptions
  }): Promise<QueryResult<T>> {
    logger.debug('Starting execution:', {
      model,
      dataLength: data.length,
      filterCount: filters.length,
      includeCount: Object.keys(includes).length,
      sortingCount: sorting.length,
      pagination,
      options,
    });

    let result = [...data];
    // Apply filters
    if (filters.length) {
      logger.debug('Applying filters', { filters: filters.map(f => ({ ...f })) });
      result = this.applyFilters(result, filters);
      logger.debug('Remaining items', { count: result.length });
    }

    // Resolve relations
    if (Object.keys(includes).length) {
      logger.debug('Resolving relations:', includes);
      result = await this.resolveIncludes(model, result, includes, options);
      logger.debug('Items after relation resolution', { count: result.length });
    }

    // Apply sorting
    if (sorting.length) {
      logger.debug('Applying sorting', { sorting: sorting.map(s => ({ ...s })) });
      result = this.applySorting(result, sorting);
    }

    // Apply pagination
    const paginatedData = this.applyPagination(result, pagination.limit, pagination.offset);
    logger.debug('After pagination:', {
      totalCount: result.length,
      pageSize: paginatedData.length,
      offset: pagination.offset || 0,
      hasMore: (pagination.offset || 0) + paginatedData.length < result.length,
    });

    return {
      data: paginatedData,
      total: result.length,
      pagination: pagination.limit
        ? {
            limit: pagination.limit,
            offset: pagination.offset || 0,
            hasMore: (pagination.offset || 0) + paginatedData.length < result.length,
          }
        : undefined,
    };
  }
}
