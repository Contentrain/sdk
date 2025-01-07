import type {
  ContentrainBaseModel,
  FilterCondition,
  FilterOperator,
  SortCondition,
  SortDirection,
} from '@contentrain/types';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface QueryOptions {
  baseDir?: string
  defaultLocale?: string
  fallbackLocale?: string
}

export class ContentrainQuery<T extends ContentrainBaseModel = ContentrainBaseModel> {
  private filters: FilterCondition<T>[] = [];
  private sorts: SortCondition<T>[] = [];
  private limitValue?: number;
  private skipValue?: number;
  private data: T[] = [];
  private locale?: string;
  private includeRelations: string[] = [];
  private baseDir: string;
  private defaultLocale: string;
  private fallbackLocale: string;
  private collection: string;
  private cache = new Map<string, any>();

  constructor(collection: string, options: QueryOptions = {}) {
    this.collection = collection;
    this.baseDir = options.baseDir || process.cwd();
    this.defaultLocale = options.defaultLocale || 'en';
    this.fallbackLocale = options.fallbackLocale || this.defaultLocale;
    this.loadInitialData();
  }

  /**
   * Başlangıç verilerini yükler
   */
  private loadInitialData(): void {
    const collectionPath = join(this.baseDir, this.collection);
    const cacheKey = `${collectionPath}:${this.locale || this.defaultLocale}`;

    if (this.cache.has(cacheKey)) {
      this.data = this.cache.get(cacheKey);
      return;
    }

    try {
      const data = this.readJsonFile(collectionPath);
      this.cache.set(cacheKey, data);
      this.data = data;
    }
    catch (error) {
      console.error(`Error loading data for collection ${this.collection}:`, error);
      this.data = [];
    }
  }

  /**
   * JSON dosyasını okur
   */
  private readJsonFile(filePath: string): T[] {
    try {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
    catch (error) {
      throw new Error(`Failed to read JSON file: ${filePath}`);
    }
  }

  /**
   * Dil seçimi yapar
   */
  setLocale(locale: string): this {
    this.locale = locale;
    this.loadInitialData();
    return this;
  }

  /**
   * İlişkili içerikleri dahil eder
   */
  with(...relations: string[]): this {
    this.includeRelations.push(...relations);
    return this;
  }

  /**
   * İlişkili içeriği yükler
   */
  private async loadRelation(item: T, relation: string): Promise<any> {
    const relationId = item[relation as keyof T];
    if (!relationId)
      return null;

    const [collectionName, field] = relation.split('.');
    const relationPath = join(this.baseDir, collectionName, `${this.locale || this.defaultLocale}.json`);

    try {
      const relationData = this.readJsonFile(relationPath);
      if (Array.isArray(relationId)) {
        return relationData.filter(r => relationId.includes(r.ID));
      }
      return relationData.find(r => r.ID === relationId);
    }
    catch (error) {
      console.error(`Error loading relation ${relation}:`, error);
      return null;
    }
  }

  /**
   * Veri setine filtre ekler
   */
  where(field: keyof T, operator: FilterOperator, value: any): this {
    this.filters.push({ field, operator, value });
    return this;
  }

  /**
   * Veri setini sıralar
   */
  sort(field: keyof T, direction: SortDirection = 'asc'): this {
    this.sorts.push({ field, direction });
    return this;
  }

  /**
   * Kaç kayıt alınacağını belirler
   */
  take(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  /**
   * Kaç kayıt atlanacağını belirler
   */
  skip(offset: number): this {
    this.skipValue = offset;
    return this;
  }

  /**
   * Filtreyi değerlendirir
   */
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
        return typeof itemValue === 'string' && typeof value === 'string' && itemValue.toLowerCase().includes(value.toLowerCase());
      case 'startsWith':
        return typeof itemValue === 'string' && typeof value === 'string' && itemValue.toLowerCase().startsWith(value.toLowerCase());
      case 'endsWith':
        return typeof itemValue === 'string' && typeof value === 'string' && itemValue.toLowerCase().endsWith(value.toLowerCase());
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

  /**
   * Sıralamayı değerlendirir
   */
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

  /**
   * Tüm filtreleri ve sıralamaları uygulayarak sonuç döndürür
   */
  async get(): Promise<T[]> {
    let result = [...this.data];

    // Filtreleme
    if (this.filters.length > 0) {
      result = result.filter(item =>
        this.filters.every(filter => this.evaluateFilter(item, filter)),
      );
    }

    // Sıralama
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

    // İlişkili içerikleri yükle
    if (this.includeRelations.length > 0) {
      for (const item of result) {
        for (const relation of this.includeRelations) {
          const relationData = await this.loadRelation(item, relation);
          if (relationData) {
            (item as any)[`${relation}-data`] = relationData;
          }
        }
      }
    }

    // Sayfalama
    if (this.skipValue !== undefined) {
      result = result.slice(this.skipValue);
    }

    if (this.limitValue !== undefined) {
      result = result.slice(0, this.limitValue);
    }

    return result;
  }

  /**
   * İlk kaydı döndürür
   */
  async first(): Promise<T | null> {
    const items = await this.get();
    return items[0] ?? null;
  }

  /**
   * Kayıt sayısını döndürür
   */
  async count(): Promise<number> {
    const items = await this.get();
    return items.length;
  }
}
