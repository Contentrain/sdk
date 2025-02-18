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
  private static loader: SQLiteLoader<IDBRecord> | JSONLoader<IBaseJSONRecord>;

  static setLoader(loader: SQLiteLoader<IDBRecord> | JSONLoader<IBaseJSONRecord>): void {
    this.loader = loader;
  }

  static createSQLiteBuilder<TData extends IDBRecord>(
    model: string,
    loader?: SQLiteLoader<TData>,
  ): ISQLiteQuery<TData> {
    const actualLoader = loader || this.loader as SQLiteLoader<TData>;
    if (!actualLoader) {
      throw new Error('No loader instance available');
    }
    const executor = new SQLiteQueryExecutor<TData>(actualLoader);
    return new SQLiteQueryBuilder<TData>(model, executor);
  }

  static createJSONBuilder<TData extends IBaseJSONRecord>(
    model: string,
    loader?: JSONLoader<TData>,
  ): IJSONQuery<TData> {
    const actualLoader = loader || this.loader as JSONLoader<TData>;
    if (!actualLoader) {
      throw new Error('No loader instance available');
    }
    return new JSONQueryBuilder<TData>(model, actualLoader);
  }

  static createBuilder<TData extends IDBRecord | IBaseJSONRecord>(
    model: string,
    loader?: SQLiteLoader<TData & IDBRecord> | JSONLoader<TData & IBaseJSONRecord>,
  ): TData extends IDBRecord
      ? ISQLiteQuery<TData & IDBRecord>
      : IJSONQuery<TData & IBaseJSONRecord> {
    const actualLoader = loader || this.loader;
    if (!actualLoader) {
      throw new Error('No loader instance available');
    }

    if (actualLoader instanceof SQLiteLoader) {
      return this.createSQLiteBuilder(model, actualLoader) as any;
    }

    if (actualLoader instanceof JSONLoader) {
      return this.createJSONBuilder(model, actualLoader) as any;
    }

    logger.error('Unsupported loader type', {
      model,
    });
    throw new Error('Unsupported loader type');
  }
}
