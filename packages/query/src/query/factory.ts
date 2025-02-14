import type { IBaseJSONRecord } from '../loader/types/json';
import type { IDBRecord } from '../loader/types/sqlite';
import type { IJSONQuery, ISQLiteQuery } from './types';
import { JSONLoader } from '../loader/json/json.loader';
import { SQLiteLoader } from '../loader/sqlite/sqlite.loader';
import { loggers } from '../utils/logger';
import { JSONQueryBuilder } from './json/json-builder';
import { SQLiteQueryBuilder } from './sqlite/sqlite-builder';
import { SQLiteQueryExecutor } from './sqlite/sqlite-executor';

const logger = loggers.query;

export class QueryFactory {
  static createSQLiteBuilder<TData extends IDBRecord>(
    model: string,
    loader: SQLiteLoader<TData>,
  ): ISQLiteQuery<TData> {
    logger.debug('Creating SQLite query builder:', {
      model,
      loaderType: 'SQLite',
    });

    const executor = new SQLiteQueryExecutor<TData>(loader);
    return new SQLiteQueryBuilder<TData>(model, executor);
  }

  static createJSONBuilder<TData extends IBaseJSONRecord>(
    model: string,
    loader: JSONLoader<TData>,
  ): IJSONQuery<TData> {
    logger.debug('Creating JSON query builder:', {
      model,
      loaderType: 'JSON',
    });

    return new JSONQueryBuilder<TData>(model, loader);
  }

  static createBuilder<TData extends IDBRecord | IBaseJSONRecord>(
    model: string,
    loader: SQLiteLoader<TData & IDBRecord> | JSONLoader<TData & IBaseJSONRecord>,
  ): TData extends IDBRecord
      ? ISQLiteQuery<TData & IDBRecord>
      : IJSONQuery<TData & IBaseJSONRecord> {
    if (loader instanceof SQLiteLoader) {
      return this.createSQLiteBuilder(model, loader) as any;
    }

    if (loader instanceof JSONLoader) {
      return this.createJSONBuilder(model, loader) as any;
    }

    throw new Error('Desteklenmeyen loader tipi');
  }
}
