import type { Database } from 'better-sqlite3';
import BetterSQLite from 'better-sqlite3';
import { DatabaseError } from '../../errors';
import { loggers } from '../../utils/logger';

const logger = loggers.sqlite;

export class SQLiteConnection {
  private readonly db: Database;

  constructor(databasePath: string) {
    logger.debug('Initializing SQLite connection', { databasePath });
    logger.info('Starting database connection initialization');

    try {
      this.db = new BetterSQLite(databasePath, {
        readonly: true,
        fileMustExist: true,
      });

      logger.debug('SQLite connection established', { databasePath });
      logger.info('Database connection established successfully');

      this.setupDatabase();
    }
    catch (error: any) {
      logger.error('Failed to establish database connection', {
        databasePath,
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to establish database connection',
        'constructor',
        {
          databasePath,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  private setupDatabase(): void {
    logger.debug('Setting up database configuration');
    logger.info('Starting database configuration setup');

    try {
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');

      logger.debug('Database configuration completed');
      logger.info('Database configuration completed successfully');
    }
    catch (error: any) {
      logger.error('Failed to setup database configuration', {
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to setup database configuration',
        'constructor',
        {
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    logger.debug('Executing query', { sql, params });
    logger.info('Starting query execution');

    try {
      return await new Promise((resolve, reject) => {
        try {
          const result = this.db.prepare(sql).all(params) as T[];
          logger.debug('Query executed successfully', { resultCount: result.length });
          logger.info('Query completed successfully', { resultCount: result.length });
          resolve(result);
        }
        catch (error) {
          reject(error);
        }
      });
    }
    catch (error: any) {
      logger.error('Failed to execute query', {
        sql,
        params,
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to execute query',
        'query',
        {
          sql,
          params,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    logger.debug('Executing single row query', { sql, params });
    logger.info('Starting single row query execution');

    try {
      return await new Promise((resolve, reject) => {
        try {
          const result = this.db.prepare(sql).get(params) as T;
          logger.debug('Single row query executed successfully', { hasResult: !!result });
          logger.info('Single row query completed successfully', { hasResult: !!result });
          resolve(result);
        }
        catch (error) {
          reject(error);
        }
      });
    }
    catch (error: any) {
      logger.error('Failed to execute single row query', {
        sql,
        params,
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to execute single row query',
        'query',
        {
          sql,
          params,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async close(): Promise<void> {
    logger.debug('Closing database connection');
    logger.info('Starting database connection closure');

    try {
      return await new Promise((resolve, reject) => {
        try {
          this.db.close();
          logger.debug('Database connection closed successfully');
          logger.info('Database connection closed successfully');
          resolve();
        }
        catch (error) {
          reject(error);
        }
      });
    }
    catch (error: any) {
      logger.error('Failed to close database connection', {
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to close database connection',
        'constructor',
        {
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }
}
