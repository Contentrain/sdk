import type { Database } from 'better-sqlite3';
import BetterSQLite from 'better-sqlite3';
import { loggers } from '../utils/logger';

const logger = loggers.sqlite;

export class SQLiteConnection {
  private db: Database;

  constructor(databasePath: string) {
    this.db = new BetterSQLite(databasePath, { readonly: true });
    this.setupDatabase();
  }

  private setupDatabase() {
    // Performans optimizasyonları
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...params) as T[];
    }
    catch (error) {
      logger.error('Query error', { sql, params, error });
      throw error;
    }
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(...params) as T | undefined;
    }
    catch (error) {
      logger.error('Get error', { sql, params, error });
      throw error;
    }
  }

  close() {
    this.db.close();
  }
}
