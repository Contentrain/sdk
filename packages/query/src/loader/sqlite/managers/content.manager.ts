import type { ILogger } from '../../types/common';
import type { IDBRecord } from '../../types/sqlite';
import { DatabaseError } from '../../../errors';
import { normalizeTableName } from '../../../utils/normalizer';
import { SQLiteConnection } from '../sqlite.connection';

export class SQLiteContentManager {
  protected readonly connection: SQLiteConnection;
  protected readonly logger: ILogger;

  constructor(
    protected readonly databasePath: string,
    logger: ILogger,
  ) {
    this.logger = logger;
    try {
      this.connection = new SQLiteConnection(databasePath);
    }
    catch (error: any) {
      this.logger.error('Failed to initialize content manager', {
        databasePath,
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to initialize content manager',
        'initialize',
        {
          databasePath,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  protected async findById<T extends IDBRecord>(
    model: string,
    id: string,
  ): Promise<T | undefined> {
    const tableName = normalizeTableName(model);
    try {
      const result = await this.connection.get<T>(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [id],
      );
      return result;
    }
    catch (error: any) {
      this.logger.error('Failed to find record by ID', {
        model,
        id,
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to find record by ID',
        'read',
        {
          model,
          id,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  protected async findAll<T extends IDBRecord>(
    model: string,
    conditions: Partial<T> = {},
  ): Promise<T[]> {
    const tableName = normalizeTableName(model);
    try {
      const where = Object.keys(conditions).length
        ? `WHERE ${Object.keys(conditions).map(k => `${k} = ?`).join(' AND ')}`
        : '';

      const result = await this.connection.query<T>(
        `SELECT * FROM ${tableName} ${where}`,
        Object.values(conditions),
      );

      if (result.length > 1000) {
        this.logger.info('Large dataset retrieved', {
          model,
          count: result.length,
          operation: 'read',
        });
      }
      return result;
    }
    catch (error: any) {
      this.logger.error('Failed to find records', {
        model,
        conditions,
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to find records',
        'read',
        {
          model,
          conditions,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async close(): Promise<void> {
    try {
      await this.connection.close();
    }
    catch (error: any) {
      this.logger.error('Failed to close content manager', {
        error: error?.message,
        code: error?.code,
      });

      throw new DatabaseError(
        'Failed to close content manager',
        'disconnect',
        {
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }
}
