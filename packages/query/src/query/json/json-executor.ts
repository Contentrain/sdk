import type { JSONLoader } from '../../loader/json/json.loader';
import type { IBaseJSONRecord, IJSONLoaderResult } from '../../loader/types/json';
import type { Filter, Include, JSONOptions, QueryResult, Sort } from '../types';
import { QueryExecutorError } from '../../errors';
import { loggers } from '../../utils/logger';
import { BaseQueryExecutor } from '../base/base-executor';

const logger = loggers.query;

export class JSONQueryExecutor<TData extends IBaseJSONRecord> extends BaseQueryExecutor<TData, Include, JSONOptions> {
  constructor(private readonly loader: JSONLoader<TData>) {
    super();
  }

  protected async resolveRelation(
    model: string,
    field: string,
    data: TData[],
    _options: JSONOptions,
  ): Promise<TData[]> {
    try {
      const relations = await this.loader.resolveRelations<TData>(
        model,
        field as keyof TData,
        data,
      );
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
    includes?: Include
    sorting?: Sort[]
    pagination?: { limit?: number, offset?: number }
    options?: JSONOptions
  }): Promise<QueryResult<TData>> {
    try {
      // Veri yükleme
      const loadResult = await this.loader.load(params.model);
      const locale = params.options?.locale || 'default';

      // İçerik seçimi
      let data = this.getContent(loadResult, locale);

      // Filtreleme
      if (params.filters?.length) {
        data = this.applyFilters(data, params.filters);
      }

      // İlişki çözümleme
      if (params.includes && Object.keys(params.includes).length) {
        data = await this.resolveIncludes(
          params.model,
          data,
          params.includes,
          params.options || {},
        );
      }

      // Sıralama
      if (params.sorting?.length) {
        data = this.applySorting(data, params.sorting);
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

  protected applySorting(data: TData[], sorting: Sort[] = []): TData[] {
    try {
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
