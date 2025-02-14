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
    this.logger.debug('Initializing SQLiteContentManager', {
      databasePath,
      operation: 'initialize',
    });

    try {
      this.connection = new SQLiteConnection(databasePath);
      this.logger.info('Content manager initialized successfully');
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
    this.logger.debug('Finding record by ID', {
      model,
      tableName,
      id,
      operation: 'read',
    });

    try {
      const result = await this.connection.get<T>(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [id],
      );

      this.logger.debug('Record lookup completed', {
        model,
        id,
        found: !!result,
        operation: 'read',
      });

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
    this.logger.debug('Finding all records', {
      model,
      tableName,
      conditions,
      hasConditions: Object.keys(conditions).length > 0,
      operation: 'read',
    });

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

      this.logger.debug('Records lookup completed', {
        model,
        count: result.length,
        conditions,
        operation: 'read',
      });

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
    this.logger.debug('Closing content manager connection', {
      operation: 'disconnect',
    });

    try {
      await this.connection.close();
      this.logger.info('Content manager closed successfully');
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
