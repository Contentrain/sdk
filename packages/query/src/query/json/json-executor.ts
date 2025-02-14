import type { JSONLoader } from '../../loader/json/json.loader';
import type { IBaseJSONRecord, IJSONLoaderResult } from '../../loader/types/json';
import type { Filter, JSONInclude, JSONOptions, QueryResult, Sort } from '../types';
import { QueryExecutorError } from '../../errors';
import { loggers } from '../../utils/logger';
import { BaseQueryExecutor } from '../base/base-executor';

const logger = loggers.query;

export class JSONQueryExecutor<TData extends IBaseJSONRecord> extends BaseQueryExecutor<TData, JSONInclude, JSONOptions> {
  constructor(private readonly loader: JSONLoader<TData>) {
    super();
    logger.debug('Initializing JSONQueryExecutor', { operation: 'initialize' });
  }

  protected async resolveRelation(
    model: string,
    field: string,
    data: TData[],
    _options: JSONOptions,
  ): Promise<TData[]> {
    try {
      logger.debug('Resolving relation', {
        model,
        field,
        dataCount: data.length,
        operation: 'resolve',
      });

      const relations = await this.loader.resolveRelations<TData>(
        model,
        field as keyof TData,
        data,
      );

      logger.debug('Relations resolved', {
        model,
        field,
        relationsCount: relations.length,
      });

      return relations;
    }
    catch (error: any) {
      logger.error('Failed to resolve relation', {
        model,
        field,
        error: error?.message,
        stack: error?.stack,
      });

      throw new QueryExecutorError(
        'Failed to resolve relation',
        'resolve',
        { model, field, originalError: error?.message },
      );
    }
  }

  async execute(params: {
    model: string
    filters?: Filter[]
    includes?: JSONInclude
    sorting?: Sort[]
    pagination?: { limit?: number, offset?: number }
    options?: JSONOptions
  }): Promise<QueryResult<TData>> {
    try {
      logger.debug('Executing query', {
        model: params.model,
        filters: params.filters,
        includes: params.includes,
        sorting: params.sorting,
        pagination: params.pagination,
        options: params.options,
      });

      // Veri yükleme
      const loadResult = await this.loader.load(params.model);
      const locale = params.options?.locale || 'default';

      // İçerik seçimi
      let data = this.getContent(loadResult, locale);
      logger.debug('Content loaded', { dataCount: data.length });

      // Filtreleme
      if (params.filters?.length) {
        data = this.applyFilters(data, params.filters);
        logger.debug('Filters applied', { remainingCount: data.length });
      }

      // İlişki çözümleme
      if (params.includes && Object.keys(params.includes).length) {
        data = await this.resolveIncludes(
          params.model,
          data,
          params.includes,
          params.options || {},
        );
        logger.debug('Relations resolved', { dataCount: data.length });
      }

      // Sıralama
      if (params.sorting?.length) {
        data = this.applySorting(data, params.sorting);
        logger.debug('Sorting applied', { dataCount: data.length });
      }

      // Toplam kayıt sayısı
      const total = data.length;

      // Sayfalama
      if (params.pagination) {
        data = this.applyPagination(
          data,
          params.pagination.limit,
          params.pagination.offset,
        );
        logger.debug('Pagination applied', {
          dataCount: data.length,
          total,
          pagination: params.pagination,
        });
      }

      return {
        data,
        total,
        pagination: this.getPaginationInfo(params.pagination, total),
      };
    }
    catch (error: any) {
      logger.error('Query execution failed', {
        model: params.model,
        error: error?.message,
        stack: error?.stack,
      });

      throw new QueryExecutorError(
        'Failed to execute query',
        'execute',
        {
          model: params.model,
          originalError: error?.message,
        },
      );
    }
  }

  private getContent(loadResult: IJSONLoaderResult<TData>, locale: string): TData[] {
    if (loadResult.model.metadata.localization) {
      const content = loadResult.content[locale];
      if (!content) {
        logger.warn('Content not found for locale, falling back to en', { locale });
        return loadResult.content.en || [];
      }
      return content;
    }
    return loadResult.content.en || [];
  }

  private getPaginationInfo(
    pagination: { limit?: number, offset?: number } | undefined,
    total: number,
  ) {
    if (!pagination?.limit)
      return undefined;

    return {
      limit: pagination.limit,
      offset: pagination.offset || 0,
      hasMore: (pagination.offset || 0) + pagination.limit < total,
    };
  }

  protected applySorting(data: TData[], sorting: Sort[] = []): TData[] {
    try {
      logger.debug('Applying sorting', {
        sortCount: sorting.length,
        operation: 'sort',
      });

      const result = [...data].sort((a, b) => {
        for (const { field, direction } of sorting) {
          // Alan kontrolü
          if (!(field in a) || !(field in b)) {
            throw new QueryExecutorError(
              `Invalid sort field: ${field}`,
              'sort',
              { field, availableFields: Object.keys(a) },
            );
          }

          const aValue = (a as unknown as Record<string, string | number>)[field];
          const bValue = (b as unknown as Record<string, string | number>)[field];

          if (aValue === bValue)
            continue;

          const comparison = aValue < bValue ? -1 : 1;
          return direction === 'asc' ? comparison : -comparison;
        }
        return 0;
      });

      logger.debug('Sorting applied', {
        resultCount: result.length,
        operation: 'sort',
      });

      return result;
    }
    catch (error: any) {
      logger.error('Failed to apply sorting', {
        error: error?.message,
        stack: error?.stack,
        operation: 'sort',
      });
      throw error;
    }
  }
}
