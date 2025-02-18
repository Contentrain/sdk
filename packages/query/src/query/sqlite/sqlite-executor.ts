import type { SQLiteLoader } from '../../loader/sqlite/sqlite.loader';
import type { IDBRecord } from '../../loader/types/sqlite';
import type { Filter, Include, QueryResult, Sort, SQLiteOptions, SQLQuery } from '../types';
import { QueryExecutorError, RelationError } from '../../errors';
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
      // İlişki tiplerini al
      const relationTypes = await this.loader.relationManager.getRelationTypes(model);
      const relationType = relationTypes[field];

      if (!relationType) {
        logger.warn('No relation type found', { model, field });
        return data;
      }

      // İlişkileri yükle
      const relations = await this.loader.relationManager.loadRelations(
        model,
        data.map(item => item.id),
        field,
      );

      if (!relations.length) {
        return data;
      }

      // İlişkili içeriği yükle
      const relatedData = await this.loader.relationManager.loadRelatedContent<TData>(
        relations,
        options?.locale,
      );

      // İlişkileri grupla
      const groupedData: Record<string, TData[]> = {};
      relations.forEach((relation) => {
        if (!groupedData[relation.source_id]) {
          groupedData[relation.source_id] = [];
        }
        const relatedItem = relatedData.find(item => item.id === relation.target_id);
        if (relatedItem) {
          groupedData[relation.source_id].push(relatedItem);
        }
      });

      // İlişkileri ana veriye ekle
      data.forEach((item: any) => {
        if (!item._relations) {
          item._relations = {};
        }
        const relatedItems = groupedData[item.id] || [];
        item._relations[field] = relationType === 'one-to-many' ? relatedItems : relatedItems[0];

        // İlişkili alanları ana veriye ekle
        if (relatedItems.length > 0) {
          const relatedItem = relationType === 'one-to-many' ? relatedItems[0] : relatedItems[0];
          Object.keys(relatedItem).forEach((key) => {
            if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'status') {
              (item as Record<string, unknown>)[`${field}_${key}`] = (relatedItem as Record<string, unknown>)[key];
            }
          });
        }
      });

      return data;
    }
    catch (error: any) {
      if (error instanceof RelationError) {
        logger.warn('Relation not found', {
          model,
          field,
          error: error.message,
        });
        return data;
      }

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
      logger.debug('Starting query execution', {
        operation: 'execute',
        model: params.model,
        hasFilters: Boolean(params.filters?.length),
        hasSorting: Boolean(params.sorting?.length),
        hasPagination: Boolean(params.pagination),
        locale: params.options?.locale,
      });

      const sqlQuery = await this.buildSQLQuery(params);
      const sql = this.buildSQL(sqlQuery);

      const data = await this.loader.query<TData>(
        sql,
        sqlQuery.parameters,
      );

      logger.debug('Main query completed', {
        operation: 'execute',
        model: params.model,
        resultCount: data.length,
      });

      if (params.options?.includes?.length) {
        logger.debug('Loading relations', {
          operation: 'execute',
          model: params.model,
          relations: params.options.includes,
        });

        for (const include of params.options.includes) {
          // İlişkileri yükle
          const relations = await this.loader.relationManager.loadRelations(
            params.model,
            data.map(item => item.id),
            include.relation,
          );

          if (!relations.length) {
            continue;
          }

          // İlişki tipini kontrol et
          const relationType = relations[0].type;
          const isOneToMany = relationType === 'one-to-many';

          // İlişkili içeriği yükle
          const relatedData = await this.loader.relationManager.loadRelatedContent<TData>(
            relations,
            include.locale || params.options?.locale || undefined,
          );

          // İlişkileri grupla
          const groupedData: Record<string, TData[]> = {};
          relations.forEach((relation) => {
            if (!groupedData[relation.source_id]) {
              groupedData[relation.source_id] = [];
            }
            const relatedItem = relatedData.find(item => item.id === relation.target_id);
            if (relatedItem) {
              groupedData[relation.source_id].push(relatedItem);
            }
          });

          // İlişkileri ana veriye ekle
          data.forEach((item: any) => {
            if (!item._relations) {
              item._relations = {};
            }
            const relatedItems = groupedData[item.id] || [];
            item._relations[include.relation] = isOneToMany ? relatedItems : relatedItems[0];
          });
        }
      }

      const total = await this.getTotal(sqlQuery);

      logger.debug('Query execution completed', {
        operation: 'execute',
        model: params.model,
        resultCount: data.length,
        totalCount: total,
        hasRelations: Boolean(params.options?.includes?.length),
      });

      return {
        data,
        total,
        pagination: this.getPaginationInfo(params.pagination, total),
      };
    }
    catch (error: any) {
      logger.error('Query execution failed', {
        operation: 'execute',
        model: params.model,
        error: error?.message,
        stack: error?.stack,
      });
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
      where: [],
      orderBy: params.sorting || [],
      parameters: [],
      pagination: params.pagination,
      options: params.options,
    };

    // Query'i sınıf içinde saklayalım
    this.query = query;

    // Modelin çeviri desteği var mı kontrol edelim
    const hasTranslations = await this.loader.translationManager.hasTranslations(params.model);
    if (hasTranslations) {
      // Çeviri olan model:
      this.mainColumns = await this.loader.translationManager.getMainColumns(params.model);
      this.translationColumns = await this.loader.translationManager.getTranslationColumns(params.model);

      // Ana tablo alanlarını ekle
      query.select.push(...this.mainColumns.map(field => `m.${field}`));

      if (params.options?.locale) {
        const hasTranslationSort = params.sorting?.some(sort =>
          this.translationColumns.includes(sort.field),
        );

        if (hasTranslationSort || params.options?.translations !== false) {
          await this.addTranslationJoin(query, params.model, params.options.locale);
        }
      }
    }
    else {
      this.mainColumns = await this.loader.translationManager.getAllColumns(params.model);
      this.translationColumns = [];
      query.select.push(...this.mainColumns.map(field => `m.${field}`));
    }

    // Debug log ekleyelim
    logger.debug('Column distribution', {
      model: params.model,
      mainColumns: this.mainColumns,
      translationColumns: this.translationColumns,
      hasTranslations,
    });

    // İlişkileri ekle
    if (params.options?.includes?.length) {
      // İlişki tiplerini al
      const relationTypes = await this.loader.relationManager.getRelationTypes(params.model);

      for (const include of params.options.includes) {
        const relationType = relationTypes[include.relation];
        if (!relationType) {
          logger.warn('No relation type found', { model: params.model, field: include.relation });
          continue;
        }

        const relations = await this.loader.relationManager.loadRelations(params.model, [], include.relation);
        if (relations.length > 0) {
          const relation = relations[0];
          const relationTable = normalizeTableName(relation.target_model);

          // İlişki tablosunu ekle
          const relationAlias = `r_${include.relation}`;
          query.joins.push({
            type: 'LEFT',
            table: relationTable,
            alias: relationAlias,
            conditions: [`m.${include.relation}_id = ${relationAlias}.id`],
          });

          // İlişkili tablonun alanlarını seç
          const relationFields = await this.loader.translationManager.getMainColumns(relation.target_model);
          query.select.push(
            ...relationFields.map(field =>
              `${relationAlias}.${field} as ${include.relation}_${field}`,
            ),
          );

          // İlişkili tablonun çevirilerini ekle
          if (include.locale) {
            const hasTranslations = await this.loader.translationManager.hasTranslations(relation.target_model);
            if (hasTranslations) {
              const translationTable = normalizeTranslationTableName(relation.target_model);
              const translationFields = await this.loader.translationManager.getTranslationColumns(relation.target_model);

              if (translationFields.length > 0) {
                // Çeviri tablosunu ekle
                const joinAlias = `t_${include.relation}`;
                query.joins.push({
                  type: 'LEFT',
                  table: translationTable,
                  alias: joinAlias,
                  conditions: [
                    `${relationAlias}.id = ${joinAlias}.id`,
                    `${joinAlias}.locale = ?`,
                  ],
                });

                // Çeviri alanlarını ekle
                query.select.push(
                  ...translationFields.map(field =>
                    `${joinAlias}.${field} as ${include.relation}_${field}`,
                  ),
                );

                query.parameters.push(include.locale);
              }
            }
          }
        }
      }
    }

    // WHERE koşullarını düzelt
    if (params.filters?.length) {
      query.where = params.filters.map((filter) => {
        // Alan adını düzelt
        const field = filter.field.endsWith('_id') ? filter.field : `${filter.field}_id`;
        return {
          ...filter,
          field: this.mainColumns.includes(field) ? field : filter.field,
        };
      });

      // WHERE koşulları için parametreleri ekle
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

    if (query.pagination?.limit) {
      // Pagination varsa, önce ID'leri alalım
      parts.push('WITH paginated_base AS (');
      parts.push('  SELECT DISTINCT m.id');
      parts.push(`  FROM ${query.from} AS m`);

      // Translation JOIN'leri ekle
      if (query.joins.length) {
        parts.push(
          query.joins.map(join =>
            `${join.type} JOIN ${join.table} AS ${join.alias} ON ${join.conditions.join(' AND ')}`,
          ).join(' '),
        );
      }

      // Locale parametresini ekle
      if (query.options?.locale) {
        query.parameters.push(query.options.locale);
      }

      // WHERE koşulları
      if (query.where.length) {
        const conditions = query.where.map(condition =>
          this.buildConditionWithoutParams(condition),
        );
        parts.push(`  WHERE ${conditions.join(' AND ')}`);
      }

      // ORDER BY - Sıralama için doğru tabloları kullan
      if (query.orderBy.length) {
        const orderClauses = query.orderBy.map((sort) => {
          // Sistem alanları her zaman ana tablodan gelir
          const isSystemField = ['id', 'created_at', 'updated_at', 'status'].includes(sort.field);
          if (isSystemField) {
            return `m.${sort.field} ${sort.direction.toUpperCase()}`;
          }

          // Kullanıcı alanları için çeviri kontrolü
          const isTranslationField = this.translationColumns?.includes(sort.field);
          const hasLocale = Boolean(query.options?.locale);

          if (isTranslationField && hasLocale) {
            // Çeviri tablosunda olan alan ve locale varsa
            return `COALESCE(t.${sort.field}, '') COLLATE NOCASE ${sort.direction.toUpperCase()}`;
          }

          // Diğer durumlar için ana tablodan al
          return `COALESCE(m.${sort.field}, '') COLLATE NOCASE ${sort.direction.toUpperCase()}`;
        });
        parts.push(`  ORDER BY ${orderClauses.join(', ')}`);
      }

      // LIMIT ve OFFSET
      parts.push(`  LIMIT ${query.pagination.limit}`);
      if (query.pagination.offset) {
        parts.push(`  OFFSET ${query.pagination.offset}`);
      }
      parts.push(')');

      // Ana sorgu
      parts.push(`SELECT ${query.select.join(', ')}`);
      parts.push('FROM paginated_base pb');
      parts.push(`JOIN ${query.from} AS m ON pb.id = m.id`);

      // Translation ve Relation JOIN'leri ekle
      if (query.joins.length) {
        parts.push(
          query.joins.map(join =>
            `${join.type} JOIN ${join.table} AS ${join.alias} ON ${join.conditions.join(' AND ')}`,
          ).join(' '),
        );
      }
    }
    else {
      // Normal sorgu (pagination yoksa)
      parts.push(`SELECT ${query.select.join(', ')}`);
      parts.push(`FROM ${query.from} AS m`);

      // JOIN'leri ekle
      if (query.joins.length) {
        parts.push(
          query.joins.map(join =>
            `${join.type} JOIN ${join.table} AS ${join.alias} ON ${join.conditions.join(' AND ')}`,
          ).join(' '),
        );
      }

      // WHERE koşulları
      if (query.where.length) {
        const conditions = query.where.map(condition =>
          this.buildConditionWithoutParams(condition),
        );
        parts.push(`WHERE ${conditions.join(' AND ')}`);
      }

      // ORDER BY - Sıralama için doğru tabloları kullan
      if (query.orderBy.length) {
        const orderClauses = query.orderBy.map((sort) => {
          // Sistem alanları her zaman ana tablodan gelir
          const isSystemField = ['id', 'created_at', 'updated_at', 'status'].includes(sort.field);
          if (isSystemField) {
            return `m.${sort.field} ${sort.direction.toUpperCase()}`;
          }

          // Kullanıcı alanları için çeviri kontrolü
          const isTranslationField = this.translationColumns?.includes(sort.field);
          const hasLocale = Boolean(query.options?.locale);

          if (isTranslationField && hasLocale) {
            // Çeviri tablosunda olan alan ve locale varsa
            return `COALESCE(t.${sort.field}, '') COLLATE NOCASE ${sort.direction.toUpperCase()}`;
          }

          // Diğer durumlar için ana tablodan al
          return `COALESCE(m.${sort.field}, '') COLLATE NOCASE ${sort.direction.toUpperCase()}`;
        });
        parts.push(`ORDER BY ${orderClauses.join(', ')}`);
      }
    }

    return parts.join('\n');
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

        // Çeviri alanlarında filtreleme veya sıralama var mı kontrol et
        const hasTranslationFilter = query.where.some(condition =>
          this.translationColumns.includes(condition.field),
        );
        const hasTranslationSort = query.orderBy.some(sort =>
          this.translationColumns.includes(sort.field),
        );

        // JOIN ekle - çeviri alanlarında filtreleme veya sıralama varsa INNER JOIN kullan
        query.joins.push({
          type: (hasTranslationFilter || hasTranslationSort) ? 'INNER' : 'LEFT',
          table: translationTable,
          alias: 't',
          conditions: [
            'm.id = t.id',
            't.locale = ?',
          ],
        });
        query.parameters.push(locale);
      }
    }
  }

  private buildConditionWithoutParams(condition: Filter): string {
    const { field, operator, value } = condition;
    const isTranslationField = this.translationColumns?.includes(field);
    const fieldWithAlias = field.includes('.')
      ? field
      : `${isTranslationField && this.query?.options?.locale ? 't' : 'm'}.${field}`;

    // Null değerler için özel durum
    if (value === null) {
      return operator === 'eq' ? `${fieldWithAlias} IS NULL` : `${fieldWithAlias} IS NOT NULL`;
    }

    // Array değerler için özel durum
    if (Array.isArray(value)) {
      const placeholders = value.map(() => '?').join(',');
      return operator === 'in' ? `${fieldWithAlias} IN (${placeholders})` : `${fieldWithAlias} NOT IN (${placeholders})`;
    }

    // String operatörleri için LIKE kullanımı
    switch (operator) {
      case 'eq':
        return `${fieldWithAlias} = ?`;
      case 'ne':
        return `${fieldWithAlias} != ?`;
      case 'gt':
        return `${fieldWithAlias} > ?`;
      case 'gte':
        return `${fieldWithAlias} >= ?`;
      case 'lt':
        return `${fieldWithAlias} < ?`;
      case 'lte':
        return `${fieldWithAlias} <= ?`;
      case 'contains':
        return `${fieldWithAlias} COLLATE BINARY LIKE ? ESCAPE '\\'`;
      case 'startsWith':
        return `${fieldWithAlias} COLLATE BINARY LIKE ? ESCAPE '\\'`;
      case 'endsWith':
        return `${fieldWithAlias} COLLATE BINARY LIKE ? ESCAPE '\\'`;
      case 'in':
        return `${fieldWithAlias} IN (?)`;
      case 'nin':
        return `${fieldWithAlias} NOT IN (?)`;
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
      // Yeni bir parametre dizisi oluştur
      const countParameters: any[] = [];

      // Translation JOIN'leri için parametreleri ekle
      if (query.options?.locale) {
        countParameters.push(query.options.locale);
      }

      // WHERE koşulları için parametreleri ekle
      if (query.where.length) {
        query.where.forEach((condition) => {
          if (condition.value === null) {
            return;
          }
          if (Array.isArray(condition.value)) {
            countParameters.push(...condition.value);
          }
          else {
            if (condition.operator === 'startsWith') {
              countParameters.push(`${String(condition.value)}%`);
            }
            else if (condition.operator === 'contains') {
              countParameters.push(`%${String(condition.value)}%`);
            }
            else if (condition.operator === 'endsWith') {
              countParameters.push(`%${String(condition.value)}`);
            }
            else {
              countParameters.push(condition.value);
            }
          }
        });
      }

      const countQuery: SQLQuery = {
        select: ['COUNT(DISTINCT m.id) as total'],
        from: query.from,
        joins: query.joins,
        where: query.where,
        orderBy: [],
        parameters: countParameters,
        pagination: undefined,
        options: undefined,
      };

      const sql = this.buildSQL(countQuery);
      const result = await this.loader.query<{ total: number }>(sql, countParameters);
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

  // Sınıf seviyesinde değişkenler
  private query: SQLQuery | null = null;
  private mainColumns: string[] = [];
  private translationColumns: string[] = [];
}
