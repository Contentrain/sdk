import type { DBRecord } from '../types/database';
import { loggers } from '../utils/logger';
import { SQLiteConnection } from './sqlite';

const logger = loggers.sqlite;

export class BaseSQLiteLoader {
  protected connection: SQLiteConnection;
  readonly databasePath: string;

  constructor(databasePath: string) {
    this.databasePath = databasePath;
    this.connection = new SQLiteConnection(databasePath);
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    return this.connection.query<T>(sql, params);
  }

  protected async findById<T extends DBRecord>(
    model: string,
    id: string,
  ): Promise<T | undefined> {
    try {
      return await this.connection.get<T>(
        `SELECT * FROM tbl_${model} WHERE id = ?`,
        [id],
      );
    }
    catch (error) {
      logger.error('Find by ID error', { model, id, error });
      throw error;
    }
  }

  protected async findAll<T extends DBRecord>(
    model: string,
    conditions: Partial<T> = {},
  ): Promise<T[]> {
    try {
      const where = Object.keys(conditions).length
        ? `WHERE ${Object.keys(conditions).map(k => `${k} = ?`).join(' AND ')}`
        : '';

      return await this.connection.query<T>(
        `SELECT * FROM tbl_${model} ${where}`,
        Object.values(conditions),
      );
    }
    catch (error) {
      logger.error('Find all error', { model, conditions, error });
      throw error;
    }
  }

  async close() {
    this.connection.close();
  }
}
