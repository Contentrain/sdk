import type { Database } from 'better-sqlite3';
import BetterSQLite from 'better-sqlite3';
import { DatabaseError } from '../../errors';
import { loggers } from '../../utils/logger';

const logger = loggers.sqlite;

export class SQLiteConnection {
    private readonly db: Database;

    constructor(databasePath: string) {
        try {
            this.db = new BetterSQLite(databasePath, {
                readonly: true,
                fileMustExist: true,
            });
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
        try {
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('foreign_keys = ON');
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
        try {
            return await new Promise((resolve, reject) => {
                try {
                    const result = this.db.prepare(sql).all(params) as T[];
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
        try {
            return await new Promise((resolve, reject) => {
                try {
                    const result = this.db.prepare(sql).get(params) as T;
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
        try {
            return await new Promise((resolve, reject) => {
                try {
                    this.db.close();
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
