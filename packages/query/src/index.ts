import type { ContentrainCore } from '@contentrain/core';
import type {
  ContentrainBaseModel,
  ContentrainModelMetadata,
  FilterCondition,
  SortCondition,
  SortDirection,
  WithRelation,
} from '@contentrain/types';

export class ContentrainQuery<T extends ContentrainBaseModel> {
  private filters: FilterCondition<T>[] = [];
  private sorts: SortCondition<T>[] = [];
  private relations: string[] = [];
  private limitCount?: number;
  private skipCount?: number;

  constructor(
    private core: ContentrainCore,
    private collection: string,
  ) {}

  where(field: keyof T, operator: FilterCondition<T>['operator'], value: T[keyof T]): this {
    this.filters.push({ field, operator, value });
    return this;
  }

  sort(field: keyof T, direction: SortDirection = 'asc'): this {
    this.sorts.push({ field, direction });
    return this;
  }

  take(limit: number): this {
    this.limitCount = limit;
    return this;
  }

  offset(skip: number): this {
    this.skipCount = skip;
    return this;
  }

  with(relation: keyof T): this {
    this.relations.push(relation as string);
    return this;
  }

  private async getModelMetadata(): Promise<ContentrainModelMetadata> {
    return this.core.getModelMetadata(this.collection);
  }

  private async getRelatedData(item: T, relation: string): Promise<ContentrainBaseModel | ContentrainBaseModel[] | null> {
    const metadata = await this.getModelMetadata();
    const relationConfig = metadata.relations?.[relation];

    if (!relationConfig) {
      throw new Error(`Relation ${relation} not found in model ${metadata.modelId}`);
    }

    const relatedIds = item[relation as keyof T];
    if (!relatedIds) {
      return null;
    }

    if (Array.isArray(relatedIds)) {
      const relatedItems = await Promise.all(
        relatedIds.map(async (id: string) => {
          try {
            return await this.core.getContentById(relationConfig.model, id);
          }
          catch {
            return null;
          }
        }),
      );

      return relatedItems.filter((item): item is ContentrainBaseModel => item !== null);
    }

    try {
      return await this.core.getContentById(relationConfig.model, relatedIds as string);
    }
    catch {
      return null;
    }
  }

  private evaluateFilter(item: T, filter: FilterCondition<T>): boolean {
    const { field, operator, value } = filter;
    const itemValue = item[field];

    switch (operator) {
      case 'eq':
        return itemValue === value;
      case 'neq':
        return itemValue !== value;
      case 'gt':
        return typeof itemValue === 'number' && typeof value === 'number' && itemValue > value;
      case 'gte':
        return typeof itemValue === 'number' && typeof value === 'number' && itemValue >= value;
      case 'lt':
        return typeof itemValue === 'number' && typeof value === 'number' && itemValue < value;
      case 'lte':
        return typeof itemValue === 'number' && typeof value === 'number' && itemValue <= value;
      case 'contains':
        return typeof itemValue === 'string' && typeof value === 'string' && itemValue.includes(value);
      case 'startsWith':
        return typeof itemValue === 'string' && typeof value === 'string' && itemValue.startsWith(value);
      case 'endsWith':
        return typeof itemValue === 'string' && typeof value === 'string' && itemValue.endsWith(value);
      case 'in':
        return Array.isArray(value) && value.includes(itemValue);
      case 'nin':
        return Array.isArray(value) && !value.includes(itemValue);
      case 'exists':
        return itemValue !== undefined && itemValue !== null;
      case 'notExists':
        return itemValue === undefined || itemValue === null;
      default:
        return false;
    }
  }

  private evaluateSort(a: T, b: T, sort: SortCondition<T>): number {
    const { field, direction } = sort;
    const aValue = a[field];
    const bValue = b[field];

    if (aValue === bValue) {
      return 0;
    }

    if (aValue === undefined || aValue === null) {
      return direction === 'asc' ? -1 : 1;
    }

    if (bValue === undefined || bValue === null) {
      return direction === 'asc' ? 1 : -1;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }

    return 0;
  }

  async get(): Promise<T[]> {
    const items = await this.core.getContent<T>(this.collection);

    let result = items;

    if (this.filters.length > 0) {
      result = result.filter(item =>
        this.filters.every(filter => this.evaluateFilter(item, filter)),
      );
    }

    if (this.sorts.length > 0) {
      result = result.sort((a, b) => {
        for (const sort of this.sorts) {
          const comparison = this.evaluateSort(a, b, sort);
          if (comparison !== 0) {
            return comparison;
          }
        }
        return 0;
      });
    }

    if (this.skipCount !== undefined) {
      result = result.slice(this.skipCount);
    }

    if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    return result;
  }

  async getWithRelations<K extends keyof T>(): Promise<WithRelation<T, K>[]> {
    const items = await this.get();

    return Promise.all(
      items.map(async (item) => {
        const result = { ...item } as WithRelation<T, K>;

        await Promise.all(
          this.relations.map(async (relation) => {
            const relatedData = await this.getRelatedData(item, relation);
            const relationKey = `${relation}-data` as keyof WithRelation<T, K>;
            result[relationKey] = relatedData as any;
          }),
        );

        return result;
      }),
    );
  }

  async first(): Promise<T | null> {
    const items = await this.get();
    return items[0] ?? null;
  }

  async firstWithRelations<K extends keyof T>(): Promise<WithRelation<T, K> | null> {
    const items = await this.getWithRelations<K>();
    return items[0] ?? null;
  }
}
