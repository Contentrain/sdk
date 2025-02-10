import type { BaseSQLiteLoader } from '../loader/base-sqlite';
import type { DBRecord } from '../types/database';
import type { Filter, Include, Operator, Pagination, QueryOptions, QueryResult, Sort } from '../types/query';
import { RelationLoader } from '../loader/relation-loader';
import { TranslationLoader } from '../loader/translation-loader';
import { loggers } from '../utils/logger';
import { normalizeTableName, normalizeTranslationTableName } from '../utils/normalizer';

const logger = loggers.query;

const SYSTEM_FIELDS = ['id', 'created_at', 'updated_at', 'status'] as const;
type SystemField = typeof SYSTEM_FIELDS[number];

export class SQLiteQueryBuilder<
  T extends DBRecord,
  TRelation extends DBRecord = DBRecord,
> {
  private filters: Filter[] = [];
  private includes: Include = {};
  private sorting: Sort[] = [];
  private pagination: Pagination = {};
  private options: QueryOptions = {};

  private relationLoader: RelationLoader;
  private hasTranslations: boolean = false;

  constructor(
    private model: string,
    private connection: BaseSQLiteLoader,
  ) {
    this.relationLoader = new RelationLoader(connection.databasePath);
    void new TranslationLoader(connection.databasePath)
      .hasTranslations(model)
      .then((hasTranslations) => {
        this.hasTranslations = hasTranslations;
      })
      .catch((error) => {
        logger.error('Translation check error:', { model, error });
        this.hasTranslations = false;
      });
  }

  private isSystemField(field: string): field is SystemField {
    return SYSTEM_FIELDS.includes(field as SystemField);
  }

  private isRelationField(field: string): boolean {
    return field.endsWith('_id');
  }

  private validateLocaleForTranslatedFields() {
    if (!this.options.locale) {
      return;
    }

    if (this.hasTranslations) {
      const hasTranslatedField = [...this.filters, ...this.sorting].some(
        item => !this.isSystemField(item.field) && !this.isRelationField(item.field),
      );

      logger.debug('Translation check', {
        model: this.model,
        hasTranslations: this.hasTranslations,
        hasTranslatedField,
        locale: this.options.locale,
      });
    }
  }

  where<K extends keyof T>(
    field: K,
    operator: Operator,
    value: T[K] | T[K][],
  ): this {
    const validOperators = [
      'eq',
      'ne',
      'gt',
      'gte',
      'lt',
      'lte',
      'in',
      'nin',
      'contains',
      'startsWith',
      'endsWith',
    ];
    if (!validOperators.includes(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

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

  private async buildQuery(): Promise<{ sql: string, params: any[] }> {
    this.validateLocaleForTranslatedFields();

    const tableName = normalizeTableName(this.model);
    const params: any[] = [];

    const needsTranslation = this.hasTranslations && this.options.locale;
    logger.debug('Translation status', {
      model: this.model,
      hasTranslations: this.hasTranslations,
      locale: this.options.locale,
      needsTranslation,
    });

    const translationLoader = new TranslationLoader(this.connection.databasePath);
    const mainColumns = await translationLoader.getMainColumns(this.model);
    const translationColumns = needsTranslation
      ? await translationLoader.getTranslationColumns(this.model)
      : [];

    logger.debug('Column information:', {
      model: this.model,
      mainColumns,
      translationColumns,
      tableName,
    });

    // 1. Sistem kolonlarını seç
    const systemColumns = mainColumns.filter(col => this.isSystemField(col));
    let sql = `SELECT ${systemColumns.map(col => `m.${col}`).join(', ')}`;

    // 2. İlişki kolonlarını ekle
    const relationColumns = mainColumns.filter(col => this.isRelationField(col));
    if (relationColumns.length > 0) {
      sql += `, ${relationColumns.map(col => `m.${col}`).join(', ')}`;
    }

    // 3. Çeviri kolonlarını ekle
    if (needsTranslation && translationColumns.length > 0) {
      sql += `, ${translationColumns
        .map(col => `COALESCE(t.${col}, '') as ${col}`)
        .join(', ')}`;
    }
    else if (translationColumns.length > 0) {
      // Çeviri yoksa ana tablodan al
      sql += `, ${translationColumns.map(col => `m.${col}`).join(', ')}`;
    }

    // 4. Diğer kolonları ekle
    const otherColumns = mainColumns.filter(col =>
      !this.isSystemField(col)
      && !this.isRelationField(col)
      && !translationColumns.includes(col),
    );

    if (otherColumns.length > 0) {
      sql += `, ${otherColumns.map(col => `m.${col}`).join(', ')}`;
    }

    sql += ` FROM ${tableName} m`;

    // Çeviri tablosu ile birleştir
    if (needsTranslation) {
      const translationTable = normalizeTranslationTableName(this.model);
      sql += ` LEFT JOIN ${translationTable} t ON m.id = t.id`;

      if (this.options.locale) {
        sql += ' AND t.locale = ?';
        params.push(this.options.locale);
      }
    }

    // Filtreleme koşullarını ekle
    const conditions: string[] = [];
    this.filters.forEach(({ field, operator, value }) => {
      const isTranslatedField = needsTranslation && translationColumns.includes(field);
      const fieldPrefix = isTranslatedField ? 't.' : 'm.';

      logger.debug('Processing filter:', {
        field,
        operator,
        value,
        isTranslatedField,
        fieldPrefix,
      });

      switch (operator) {
        case 'contains':
          conditions.push(`LOWER(${fieldPrefix}${field}) LIKE LOWER(?)`);
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

    // Sıralama ekle
    if (this.sorting.length) {
      sql += ` ORDER BY ${this.sorting.map((s) => {
        const isTranslatedField = needsTranslation && translationColumns.includes(s.field);
        const prefix = isTranslatedField ? 't.' : 'm.';
        return `${prefix}${s.field} ${s.direction}`;
      }).join(', ')}`;
    }
    else if (this.pagination.offset) {
      // Offset kullanılıyorsa ve sıralama belirtilmemişse, varsayılan sıralama ekle
      sql += ' ORDER BY m.field_order ASC';
    }

    // Sayfalama ekle
    if (this.pagination.offset && !this.pagination.limit) {
      // Eğer sadece offset varsa, büyük bir limit ekle
      sql += ' LIMIT -1';
    }

    if (this.pagination.limit) {
      sql += ' LIMIT ?';
      params.push(this.pagination.limit);
    }

    if (this.pagination.offset) {
      sql += ' OFFSET ?';
      params.push(this.pagination.offset);
    }

    logger.debug('Final query', {
      model: this.model,
      sql,
      params,
      hasTranslations: this.hasTranslations,
      needsTranslation,
    });

    return { sql, params };
  }

  async get(): Promise<QueryResult<T>> {
    try {
      if (Object.keys(this.includes).length) {
        const relationTypes = await this.relationLoader.getRelationTypes(this.model);
        logger.debug('Relation types for model:', {
          model: this.model,
          relationTypes,
          includes: this.includes,
        });

        for (const relation of Object.keys(this.includes)) {
          if (!relationTypes[relation]) {
            const error = new Error(`Invalid relation field: ${relation} for model ${this.model}`);
            logger.error('Invalid relation:', { model: this.model, relation, error });
            throw error;
          }
        }
      }

      const { sql, params } = await this.buildQuery();
      logger.debug('Executing query:', {
        sql,
        params,
        model: this.model,
        hasTranslations: this.hasTranslations,
        locale: this.options.locale,
      });

      const data = await this.connection.query<T>(sql, params);
      logger.debug('Query results', {
        count: data.length,
        firstItem: data[0],
        model: this.model,
      });

      const countSql = `SELECT COUNT(*) as total FROM ${normalizeTableName(this.model)}`;
      const [{ total }] = await this.connection.query<{ total: number }>(countSql);
      logger.debug('Total count:', { total });

      if (Object.keys(this.includes).length) {
        logger.debug('Loading relations:', {
          includes: this.includes,
          model: this.model,
          hasTranslations: this.hasTranslations,
        });

        for (const relation of Object.keys(this.includes)) {
          logger.debug('Loading relation:', {
            relation,
            model: this.model,
            hasTranslations: this.hasTranslations,
            locale: this.options.locale,
          });

          const relations = await this.relationLoader.loadRelations(
            this.model,
            data.map(d => d.id),
            relation,
          );
          logger.debug('Loaded relations:', {
            count: relations.length,
            firstRelation: relations[0],
            relationType: relations[0]?.type,
          });

          if (!relations.length) {
            logger.debug('No relations found:', {
              model: this.model,
              relation,
              hasTranslations: this.hasTranslations,
            });
            continue;
          }

          const relatedData = await this.relationLoader.loadRelatedContent<TRelation>(
            relations,
            this.options.locale,
          );
          logger.debug('Loaded related data:', {
            count: relatedData.length,
            firstItem: relatedData[0],
            hasTranslations: this.hasTranslations,
          });

          data.forEach((item) => {
            if (!item._relations) {
              item._relations = {};
            }

            const itemRelations = relations.filter(r => r.source_id === item.id);
            logger.debug('Item relations:', {
              itemId: item.id,
              relations: itemRelations,
              relationType: itemRelations[0]?.type,
            });

            if (!itemRelations.length) {
              return;
            }

            const isOneToOne = itemRelations.every(r => r.type === 'one-to-one');
            logger.debug('Relation type check:', {
              isOneToOne,
              relationType: itemRelations[0]?.type,
              relation,
            });

            if (isOneToOne) {
              const related = relatedData.find(rd => rd.id === itemRelations[0]?.target_id);
              if (related) {
                item._relations[relation] = related;
                logger.debug('Added one-to-one relation:', {
                  itemId: item.id,
                  relationId: related.id,
                  relationType: 'one-to-one',
                  hasTranslations: this.hasTranslations,
                });
              }
            }
            else {
              const relatedItems = relatedData.filter(rd =>
                itemRelations.some(ir => ir.target_id === rd.id),
              );

              if (relatedItems.length) {
                item._relations[relation] = relatedItems;
                logger.debug('Added one-to-many relations:', {
                  itemId: item.id,
                  count: relatedItems.length,
                  relationType: 'one-to-many',
                  relationIds: relatedItems.map(r => r.id),
                  hasTranslations: this.hasTranslations,
                });
              }
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
      logger.error('Query execution error', {
        error,
        model: this.model,
        hasTranslations: this.hasTranslations,
        locale: this.options.locale,
      });
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
