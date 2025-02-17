import type { SQLiteLoader } from '../../loader/sqlite/sqlite.loader';
import type { IDBRecord } from '../../loader/types/sqlite';
import type { Filter, Include, QueryResult, Sort, SQLiteOptions, SQLQuery } from '../types';
import { QueryExecutorError } from '../../errors';
import { loggers } from '../../utils/logger';
import { normalizeTableName, normalizeTranslationTableName } from '../../utils/normalizer';
import { BaseQueryExecutor } from '../base/base-executor';

const logger = loggers.query;

export class SQLiteQueryExecutor<TData extends IDBRecord> extends BaseQueryExecutor<TData, Include, SQLiteOptions> {
  constructor(private readonly loader: SQLiteLoader<TData>) {
    super();
  }

  protected async resolveRelation(
    model: string,
    field: string,
    data: TData[],
    options: SQLiteOptions,
  ): Promise<TData[]> {
    try {
      const relations = await this.loader.relationManager.loadRelations(
        model,
        data.map(item => item.id),
        field,
      );

      if (!relations.length) {
        return [];
      }

      return await this.loader.relationManager.loadRelatedContent<TData>(
        relations,
        options?.locale,
      );
    }
    catch (error: any) {
      logger.error('Failed to resolve relation', { error });
      throw new QueryExecutorError('Failed to resolve relation', 'resolve', {
        model,
        field,
        originalError: error?.message,
      });
    }
  }

  async execute(params: {
    model: string
    filters?: Filter[]
    sorting?: Sort[]
    pagination?: { limit?: number, offset?: number }
    options?: SQLiteOptions
  }): Promise<QueryResult<TData>> {
    try {
      // SQL sorgusunu oluştur
      const sqlQuery = await this.buildSQLQuery(params);

      // Sorguyu çalıştır
      const data = await this.loader.query<TData>(
        this.buildSQL(sqlQuery),
        sqlQuery.parameters,
      );

      // İlişkileri yükle
      if (params.options?.includes?.length) {
        for (const include of params.options.includes) {
          const relatedData = await this.resolveRelation(
            params.model,
            include,
            data,
            params.options,
          );

          // İlişkili verileri ana veriye ekle
          data.forEach((item: any) => {
            if (!item._relations) {
              item._relations = {};
            }
            item._relations[include] = relatedData.find(r => r.id === item[`${include}_id`]);
          });
        }
      }

      // Toplam sayıyı al
      const total = await this.getTotal(sqlQuery);

      return {
        data,
        total,
        pagination: this.getPaginationInfo(params.pagination, total),
      };
    }
    catch (error: any) {
      logger.error('Query execution failed', { error });
      throw new QueryExecutorError('Failed to execute query', 'execute', {
        model: params.model,
        originalError: error?.message,
      });
    }
  }

  private async buildSQLQuery(params: {
    model: string
    filters?: Filter[]
    sorting?: Sort[]
    pagination?: { limit?: number, offset?: number }
    options?: SQLiteOptions
  }): Promise<SQLQuery> {
    const tableName = normalizeTableName(params.model);
    const query: SQLQuery = {
      select: [],
      from: tableName,
      joins: [],
      where: params.filters || [],
      orderBy: params.sorting || [],
      parameters: [],
      pagination: params.pagination,
      options: params.options,
    };

    // Ana tablo alanlarını ekle
    const mainColumns = await this.loader.translationManager.getMainColumns(params.model);
    query.select.push(...mainColumns.map(field => `m.${field}`));

    // Çeviri tablosu ekle
    if (params.options?.locale && params.options?.translations !== false) {
      await this.addTranslationJoin(query, params.model, params.options.locale);
    }

    // İlişkileri ekle
    if (params.options?.includes?.length) {
      await this.addRelationJoins(query, params.model, params.options.includes);
    }

    // WHERE koşulları için parametreleri ekle
    if (query.where.length) {
      query.where.forEach((condition) => {
        if (condition.value === null) {
          return;
        }

        if (Array.isArray(condition.value)) {
          query.parameters.push(...condition.value);
        }
        else {
          if (condition.operator === 'startsWith') {
            query.parameters.push(`${String(condition.value)}%`);
          }
          else if (condition.operator === 'contains') {
            query.parameters.push(`%${String(condition.value)}%`);
          }
          else if (condition.operator === 'endsWith') {
            query.parameters.push(`%${String(condition.value)}`);
          }
          else {
            query.parameters.push(condition.value);
          }
        }
      });
    }

    return query;
  }

  private buildSQL(query: SQLQuery): string {
    const parts: string[] = [];

    // SELECT
    parts.push(`SELECT ${query.select.join(', ')}`);

    // FROM
    parts.push(`FROM ${query.from} AS m`);

    // JOINS
    if (query.joins.length) {
      parts.push(
        query.joins.map(join =>
          `${join.type} JOIN ${join.table} AS ${join.alias} ON ${join.conditions.join(' AND ')}`,
        ).join(' '),
      );
    }

    // WHERE
    if (query.where.length) {
      const conditions = query.where.map((condition) => {
        return this.buildConditionWithoutParams(condition);
      });
      parts.push(`WHERE ${conditions.join(' AND ')}`);
    }

    // ORDER BY
    if (query.orderBy.length) {
      const orderClauses = query.orderBy.map((sort) => {
        const field = sort.field.includes('.') ? sort.field : `m.${sort.field}`;
        return `${field} ${sort.direction.toUpperCase()}`;
      });
      parts.push(`ORDER BY ${orderClauses.join(', ')}`);
    }

    // LIMIT & OFFSET
    if (query.pagination?.limit) {
      parts.push(`LIMIT ${query.pagination.limit}`);
      if (query.pagination.offset) {
        parts.push(`OFFSET ${query.pagination.offset}`);
      }
    }

    return parts.join(' ');
  }

  private async addTranslationJoin(query: SQLQuery, model: string, locale: string): Promise<void> {
    const hasTranslations = await this.loader.translationManager.hasTranslations(model);

    if (hasTranslations) {
      const translationTable = normalizeTranslationTableName(model);
      const translationFields = await this.loader.translationManager.getTranslationColumns(model);

      if (translationFields.length > 0) {
        // Çeviri alanlarını ekle
        query.select.push(
          ...translationFields.map(field =>
            `t.${field} as ${field}`,
          ),
        );

        // JOIN ekle
        query.joins.push({
          type: 'LEFT',
          table: translationTable,
          alias: 't',
          conditions: ['m.id = t.id', 't.locale = ?'],
        });

        query.parameters.push(locale);
      }
    }
  }

  private async addRelationJoins(query: SQLQuery, model: string, includes: string[]): Promise<void> {
    for (const include of includes) {
      const relations = await this.loader.relationManager.loadRelations(model, [], include);
      if (relations.length > 0) {
        const relation = relations[0];
        const relationTable = normalizeTableName(relation.target_model);

        // İlişki tablosunu ekle
        query.joins.push({
          type: 'LEFT',
          table: relationTable,
          alias: `r_${include}`,
          conditions: [`m.${include}_id = r_${include}.id`],
        });

        // İlişkili tablonun alanlarını seç
        const relationFields = await this.loader.translationManager.getMainColumns(relation.target_model);
        query.select.push(
          ...relationFields.map(field =>
            `r_${include}.${field} as ${include}_${field}`,
          ),
        );

        // İlişkili tablonun çevirilerini ekle
        if (query.options?.locale && query.options?.translations !== false) {
          const hasTranslations = await this.loader.translationManager.hasTranslations(relation.target_model);
          if (hasTranslations) {
            const translationTable = normalizeTranslationTableName(relation.target_model);
            const translationFields = await this.loader.translationManager.getTranslationColumns(relation.target_model);

            if (translationFields.length > 0) {
              // Çeviri tablosunu ekle
              query.joins.push({
                type: 'LEFT',
                table: translationTable,
                alias: `t_${include}`,
                conditions: [
                  `r_${include}.id = t_${include}.id`,
                  `t_${include}.locale = ?`,
                ],
              });

              // Çeviri alanlarını ekle
              query.select.push(
                ...translationFields.map(field =>
                  `t_${include}.${field} as ${include}_${field}`,
                ),
              );

              query.parameters.push(query.options.locale);
            }
          }
        }
      }
    }
  }

  private buildConditionWithoutParams(condition: Filter): string {
    const { field, operator, value } = condition;

    // Null değerler için özel durum
    if (value === null) {
      return operator === 'eq' ? `${field} IS NULL` : `${field} IS NOT NULL`;
    }

    // Array değerler için özel durum
    if (Array.isArray(value)) {
      const placeholders = value.map(() => '?').join(',');
      return operator === 'in' ? `${field} IN (${placeholders})` : `${field} NOT IN (${placeholders})`;
    }

    // String operatörleri için LIKE kullanımı
    switch (operator) {
      case 'eq':
        return `${field} = ?`;
      case 'ne':
        return `${field} != ?`;
      case 'gt':
        return `${field} > ?`;
      case 'gte':
        return `${field} >= ?`;
      case 'lt':
        return `${field} < ?`;
      case 'lte':
        return `${field} <= ?`;
      case 'contains':
        return `${field} LIKE ? ESCAPE '\\'`;
      case 'startsWith':
        return `${field} LIKE ? ESCAPE '\\'`;
      case 'endsWith':
        return `${field} LIKE ? ESCAPE '\\'`;
      case 'in':
        return `${field} IN (?)`;
      case 'nin':
        return `${field} NOT IN (?)`;
      default:
        throw new QueryExecutorError(
          'Unsupported operator',
          'query',
          { field, operator, value },
        );
    }
  }

  private async getTotal(query: SQLQuery): Promise<number> {
    try {
      const countQuery: SQLQuery = {
        select: ['COUNT(*) as total'],
        from: query.from,
        joins: query.joins,
        where: query.where,
        orderBy: [],
        parameters: query.parameters,
        pagination: undefined,
        options: undefined,
      };

      const sql = this.buildSQL(countQuery);
      const result = await this.loader.query<{ total: number }>(sql, countQuery.parameters);
      return result[0].total;
    }
    catch (error: any) {
      logger.error('Failed to get total count', { error });
      throw new QueryExecutorError('Failed to get total count', 'execute', {
        model: query.from,
        originalError: error?.message,
      });
    }
  }

  protected getPaginationInfo(
    pagination: { limit?: number, offset?: number } | undefined,
    total: number,
  ): { limit: number, offset: number, hasMore: boolean } | undefined {
    if (!pagination?.limit) {
      return undefined;
    }

    return {
      limit: pagination.limit,
      offset: pagination.offset || 0,
      hasMore: (pagination.offset || 0) + pagination.limit < total,
    };
  }
}
