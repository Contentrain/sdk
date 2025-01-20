import type { ContentLoader } from '../loader/content';
import type { BaseContentrainType, ContentrainLocales } from '../types/model';
import type { Filter, Include, Operator, Pagination, QueryOptions, QueryResult, Sort } from '../types/query';
import type { QueryExecutor } from './executor';
import { logger } from '../utils/logger';

export class ContentrainQueryBuilder<
  TFields extends BaseContentrainType,
  TLocales extends ContentrainLocales = 'en' | 'tr',
  TRelations extends Record<string, BaseContentrainType> = Record<string, never>,
> {
  private model: string;
  private filters: Filter[] = [];
  private includes: Include = {};
  private sorting: Sort[] = [];
  private pagination: Pagination = {};

  private options: QueryOptions = {};
  private executor: QueryExecutor;
  private loader: ContentLoader;

  constructor(model: string, executor: QueryExecutor, loader: ContentLoader) {
    this.model = model;
    this.executor = executor;
    this.loader = loader;
  }

  where<K extends keyof TFields, O extends Operator>(
    field: K,
    operator: O,
    value: O extends 'in' ? TFields[K][] : TFields[K],
  ): this {
    logger.debug('Adding filter:', {
      field,
      operator,
      value,
    });

    this.filters.push({
      field: field as string,
      operator,
      value,
    });
    return this;
  }

  include<K extends keyof TRelations>(relation: K | K[]): this {
    logger.debug('Adding relation:', relation);

    if (typeof relation === 'string') {
      this.includes[relation] = {};
    }
    else if (Array.isArray(relation)) {
      relation.forEach((r) => {
        this.includes[r as string] = {};
      });
    }
    return this;
  }

  orderBy<K extends keyof TFields>(field: K, direction: 'asc' | 'desc' = 'asc'): this {
    logger.debug('Adding sorting:', {
      field,
      direction,
    });

    this.sorting.push({
      field: field as string,
      direction,
    });
    return this;
  }

  limit(count: number): this {
    logger.debug('Adding limit:', count);
    this.pagination.limit = count;
    return this;
  }

  offset(count: number): this {
    logger.debug('Adding offset:', count);
    this.pagination.offset = count;
    return this;
  }

  locale(code: TLocales): this {
    logger.debug('Setting locale:', code);
    this.options.locale = code;
    return this;
  }

  cache(ttl?: number): this {
    logger.debug('Setting cache:', {
      enabled: true,
      ttl,
    });
    this.options.cache = true;
    if (ttl)
      this.options.ttl = ttl;
    return this;
  }

  noCache(): this {
    logger.debug('Disabling cache');
    this.options.cache = false;
    return this;
  }

  bypassCache(): this {
    logger.debug('Bypassing cache');
    this.options.cache = false;
    this.options.ttl = 0;
    return this;
  }

  toJSON() {
    return {
      model: this.model,
      filters: this.filters,
      includes: this.includes,
      sorting: this.sorting,
      pagination: this.pagination,
      options: this.options,
    };
  }

  async get(): Promise<QueryResult<TFields>> {
    logger.debug('Starting query:', {
      model: this.model,
      filterCount: this.filters.length,
      includeCount: Object.keys(this.includes).length,
      sortingCount: this.sorting.length,
      pagination: this.pagination,
      options: this.options,
    });

    const result = await this.loader.load<TFields>(this.model);
    const modelConfig = result.model;

    logger.debug('Model loaded:', {
      model: this.model,
      metadata: modelConfig.metadata,
      contentKeys: Object.keys(result.content),
    });

    // Locale check and data selection
    let data: TFields[];
    if (modelConfig.metadata.localization) {
      // Locale check for localized model
      const locale = this.options.locale || 'en'; // Default locale
      logger.debug('Selecting content for localized model:', {
        model: this.model,
        requestedLocale: locale,
        availableLocales: Object.keys(result.content),
      });

      data = result.content[locale];

      if (!data) {
        logger.error('Content not found:', {
          model: this.model,
          locale,
          availableLocales: Object.keys(result.content),
        });
        throw new Error(`Content not found for locale: ${locale}`);
      }
    }
    else {
      // Default content for non-localized model
      logger.debug('Selecting content for non-localized model:', {
        model: this.model,
        contentKeys: Object.keys(result.content),
      });

      if (!result.content.default) {
        logger.error('Content not found:', {
          model: this.model,
          contentKeys: Object.keys(result.content),
        });
        throw new Error(`Content not found for model: ${this.model}`);
      }
      data = result.content.default;
    }

    logger.debug('Executing query:', {
      model: this.model,
      dataLength: data.length,
    });

    return this.executor.execute({
      model: this.model,
      data,
      filters: this.filters,
      includes: this.includes,
      sorting: this.sorting,
      pagination: this.pagination,
      options: this.options,
    });
  }

  async first(): Promise<TFields | null> {
    const result = await this.limit(1).get();
    return result.data[0] || null;
  }

  async count(): Promise<number> {
    const result = await this.get();
    return result.total;
  }
}
