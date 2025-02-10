import type { BaseSQLiteLoader } from '../loader/base-sqlite';
import type { DBRecord } from '../types/database';
import type { Filter, Include, Operator, Pagination, QueryOptions, QueryResult, Sort } from '../types/query';
import { RelationLoader } from '../loader/relation-loader';
import { logger } from '../utils/logger';

const SYSTEM_FIELDS = ['id', 'created_at', 'updated_at', 'status'] as const;
type SystemField = typeof SYSTEM_FIELDS[number];

export class SQLiteQueryBuilder<T extends DBRecord> {
  private filters: Filter[] = [];
  private includes: Include = {};
  private sorting: Sort[] = [];
  private pagination: Pagination = {};
  private options: QueryOptions = {};

  private relationLoader: RelationLoader;

  constructor(
    private model: string,
    private connection: BaseSQLiteLoader,
  ) {
    this.relationLoader = new RelationLoader(connection.databasePath);
  }

  private isSystemField(field: string): field is SystemField {
    return SYSTEM_FIELDS.includes(field as SystemField);
  }

  private isRelationField(field: string): boolean {
    return field.endsWith('_id');
  }

  private requiresTranslation(field: string): boolean {
    return !this.isSystemField(field) && !this.isRelationField(field);
  }

  private validateLocaleForTranslatedFields() {
    const hasTranslatedField = [...this.filters, ...this.sorting].some(
      item => this.requiresTranslation(item.field),
    );

    if (hasTranslatedField && !this.options.locale) {
      throw new Error('Locale is required when querying translated fields');
    }
  }

  where<K extends keyof T>(
    field: K,
    operator: Operator,
    value: T[K] | T[K][],
  ): this {
    this.filters.push({
      field: field as string,
      operator,
      value,
    });
    return this;
  }

  include(relations: string | string[]): this {
    if (typeof relations === 'string') {
      this.includes[relations] = {};
    }
    else {
      relations.forEach((r) => {
        this.includes[r] = {};
      });
    }
    return this;
  }

  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
    this.sorting.push({
      field: field as string,
      direction,
    });
    return this;
  }

  limit(count: number): this {
    this.pagination.limit = count;
    return this;
  }

  offset(count: number): this {
    this.pagination.offset = count;
    return this;
  }

  locale(code: string): this {
    this.options.locale = code;
    return this;
  }

  private buildQuery(): { sql: string, params: any[] } {
    this.validateLocaleForTranslatedFields();

    const tableName = `tbl_${this.model}`;
    const params: any[] = [];
    let sql = 'SELECT m.*, t.*';
    sql += ` FROM ${tableName} m`;
    sql += ` LEFT JOIN ${tableName}_translations t ON m.id = t.id`;
    if (this.options.locale) {
      sql += ' AND t.locale = ?';
      params.push(this.options.locale);
    }
    const conditions: string[] = [];
    this.filters.forEach(({ field, operator, value }) => {
      const fieldPrefix = this.requiresTranslation(field) ? 't.' : 'm.';
      switch (operator) {
        case 'contains':
          conditions.push(`${fieldPrefix}${field} LIKE ?`);
          params.push(`%${value}%`);
          break;
        case 'eq':
          conditions.push(`${fieldPrefix}${field} = ?`);
          params.push(value);
          break;
        case 'ne':
          conditions.push(`${fieldPrefix}${field} != ?`);
          params.push(value);
          break;
        case 'gt':
          conditions.push(`${fieldPrefix}${field} > ?`);
          params.push(value);
          break;
        case 'gte':
          conditions.push(`${fieldPrefix}${field} >= ?`);
          params.push(value);
          break;
        case 'lt':
          conditions.push(`${fieldPrefix}${field} < ?`);
          params.push(value);
          break;
        case 'lte':
          conditions.push(`${fieldPrefix}${field} <= ?`);
          params.push(value);
          break;
        case 'in':
          conditions.push(`${fieldPrefix}${field} IN (${(value as any[]).map(() => '?').join(',')})`);
          params.push(...(value as any[]));
          break;
        case 'nin':
          conditions.push(`${fieldPrefix}${field} NOT IN (${(value as any[]).map(() => '?').join(',')})`);
          params.push(...(value as any[]));
          break;
        case 'startsWith':
          conditions.push(`${fieldPrefix}${field} LIKE ?`);
          params.push(`${value}%`);
          break;
        case 'endsWith':
          conditions.push(`${fieldPrefix}${field} LIKE ?`);
          params.push(`%${value}`);
          break;
      }
    });

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (this.sorting.length) {
      sql += ` ORDER BY ${this.sorting.map((s) => {
        const prefix = this.requiresTranslation(s.field) ? 't.' : 'm.';
        return `COALESCE(${prefix}${s.field}, 0) ${s.direction}`;
      }).join(', ')}`;
    }

    if (this.pagination.offset || this.pagination.limit) {
      sql += ' LIMIT ?';
      params.push(this.pagination.limit || -1);

      if (this.pagination.offset) {
        sql += ' OFFSET ?';
        params.push(this.pagination.offset);
      }
    }
    return { sql, params };
  }

  async get(): Promise<QueryResult<T>> {
    try {
      const { sql, params } = this.buildQuery();
      const data = await this.connection.query<T>(sql, params);
      const countSql = `SELECT COUNT(*) as total FROM tbl_${this.model}`;
      const [{ total }] = await this.connection.query<{ total: number }>(countSql);

      if (Object.keys(this.includes).length) {
        for (const relation of Object.keys(this.includes)) {
          const relations = await this.relationLoader.loadRelations(
            this.model,
            data.map(d => d.id),
            relation,
          );

          if (!relations.length) {
            logger.debug('No relations found:', { model: this.model, relation });
            throw new Error(`Invalid relation: ${relation}`);
          }

          const relatedData = await this.relationLoader.loadRelatedContent<DBRecord>(
            relations,
            this.options.locale,
          );

          // İlişkileri data'ya ekle
          data.forEach((item) => {
            if (!item._relations) {
              item._relations = {};
            }

            const itemRelations = relations.filter(r => r.source_id === item.id);
            if (itemRelations[0]?.type === 'one-to-one') {
              const related = relatedData.find(rd => rd.id === itemRelations[0].target_id);
              if (related) {
                item._relations[relation] = related;
              }
            }
            else {
              item._relations[relation] = relatedData.filter(rd =>
                itemRelations.some(ir => ir.target_id === rd.id),
              );
            }
          });
        }
      }

      return {
        data,
        total,
        pagination: this.pagination.limit
          ? {
              limit: this.pagination.limit,
              offset: this.pagination.offset || 0,
              hasMore: (this.pagination.offset || 0) + data.length < total,
            }
          : undefined,
      };
    }
    catch (error) {
      logger.error('Query execution error:', error);
      throw error;
    }
  }

  async first(): Promise<T | null> {
    const result = await this.limit(1).get();
    return result.data[0] || null;
  }

  async count(): Promise<number> {
    const result = await this.get();
    return result.total;
  }
}
