import type { ContentLoader } from '../loader/content';
import type { BaseContentrainType } from '../types/model';
import type { Filter, Include, QueryOptions, QueryResult, Sort } from '../types/query';

export class QueryExecutor {
  private loader: ContentLoader;

  constructor(loader: ContentLoader) {
    this.loader = loader;
  }

  private applyFilters<T extends BaseContentrainType>(data: T[], filters: Filter[]): T[] {
    return data.filter((item) => {
      return filters.every((filter) => {
        const value = item[filter.field as keyof T];

        // Operatör validasyonu
        const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'startsWith', 'endsWith'];
        if (!validOperators.includes(filter.operator)) {
          throw new Error(`Invalid operator: ${filter.operator}`);
        }

        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'ne':
            return value !== filter.value;
          case 'gt':
            return value > filter.value;
          case 'gte':
            return value >= filter.value;
          case 'lt':
            return value < filter.value;
          case 'lte':
            return value <= filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          case 'nin':
            return Array.isArray(filter.value) && !filter.value.includes(value);
          case 'contains':
            return typeof value === 'string' && value.includes(filter.value);
          case 'startsWith':
            return typeof value === 'string' && value.startsWith(filter.value);
          case 'endsWith':
            return typeof value === 'string' && value.endsWith(filter.value);
          default:
            return false;
        }
      });
    });
  }

  private applySorting<T extends BaseContentrainType>(data: T[], sorting: Sort[]): T[] {
    return [...data].sort((a, b) => {
      for (const sort of sorting) {
        const aValue = a[sort.field as keyof T];
        const bValue = b[sort.field as keyof T];

        if (aValue === bValue)
          continue;

        const direction = sort.direction === 'asc' ? 1 : -1;
        return aValue > bValue ? direction : -direction;
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
    const result = [...data];

    for (const [field, config] of Object.entries(includes)) {
      // İlişkiyi çöz
      const relations = await this.loader.resolveRelation(
        model,
        field as keyof T,
        result,
        options.locale,
      );

      // Alt ilişkileri çöz
      if (config.include && relations.length) {
        await this.resolveIncludes(
          field,
          relations,
          config.include,
          options,
        );
      }

      // İlişkili verileri ekle
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
    }

    return result;
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
    let result = [...data];
    // Filtreleri uygula
    if (filters.length) {
      result = this.applyFilters(result, filters);
    }

    // İlişkileri çöz
    if (Object.keys(includes).length) {
      result = await this.resolveIncludes(model, result, includes, options);
    }

    // Sıralama yap
    if (sorting.length) {
      result = this.applySorting(result, sorting);
    }

    // Sayfalama yap
    const paginatedData = this.applyPagination(result, pagination.limit, pagination.offset);

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
