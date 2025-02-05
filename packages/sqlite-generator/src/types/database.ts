import type { Database as BetterSQLite3Database } from 'better-sqlite3';

/**
 * Result of a database write operation
 */
export interface RunResult {
  changes: number
  lastInsertRowid: number | bigint
}

/**
 * Pragma configuration options
 */
export interface PragmaOptions {
  [key: string]: string | number | boolean
}

/**
 * Prepared statement with parameter binding
 */
export interface PreparedStatement<T = Record<string, unknown>> {
  run: (params?: T) => RunResult
  all: <R = unknown>(params?: T) => R[]
  get: <R = unknown>(params?: T) => R | undefined
  finalize: () => void
}

/**
 * Raw SQL statement
 */
export interface Statement<
  Params extends unknown[] = unknown[],
  Return = unknown,
> {
  run: (...params: Params) => RunResult
  get: (...params: Params) => Return | undefined
  all: (...params: Params) => Return[]
  finalize: () => void
}

/**
 * Database interface for SQLite operations
 */
export interface Database {
  /**
   * Executes a SQL query
   */
  exec: (sql: string) => void

  /**
   * Prepares a SQL query for execution
   */
  prepare: <T extends Record<string, unknown>>(sql: string) => PreparedStatement<T>

  /**
   * Sets pragma configuration
   */
  pragma: (pragma: string) => void

  /**
   * Starts a transaction
   */
  transaction: <T>(fn: () => T | Promise<T>) => Promise<T>

  /**
   * Executes a query that returns a single row
   */
  get: <T = unknown>(sql: string, params?: Record<string, unknown>) => Promise<T | undefined>

  /**
   * Executes a query that returns multiple rows
   */
  all: <T = unknown>(sql: string, params?: Record<string, unknown>) => Promise<T[]>

  /**
   * Executes a DML query
   */
  run: (sql: string, params?: Record<string, unknown>) => Promise<RunResult>
}

/**
 * Database adapter implementation for better-sqlite3
 */
export class DatabaseAdapter implements Database {
  constructor(private db: BetterSQLite3Database) {}

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare<T extends Record<string, unknown>>(sql: string) {
    const stmt = this.db.prepare(sql);
    return {
      run: (params?: T) => stmt.run(params ?? {}) as RunResult,
      all: <R = unknown>(params?: T) => stmt.all(params ?? {}) as R[],
      get: <R = unknown>(params?: T) => stmt.get(params ?? {}) as R | undefined,
      finalize: () => {
        if ('finalize' in stmt) {
          (stmt as { finalize: () => void }).finalize();
        }
      },
    };
  }

  async transaction<T>(fn: () => T | Promise<T>): Promise<T> {
    const transaction = this.db.transaction(async () => {
      return fn();
    });
    return transaction();
  }

  async get<T = unknown>(sql: string, params?: Record<string, unknown>): Promise<T | undefined> {
    const stmt = this.db.prepare(sql);
    return stmt.get(params ?? {}) as T | undefined;
  }

  async all<T = unknown>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(params ?? {}) as T[];
  }

  async run(sql: string, params?: Record<string, unknown>): Promise<RunResult> {
    const stmt = this.db.prepare(sql);
    return stmt.run(params ?? {}) as RunResult;
  }

  pragma(pragma: string): void {
    this.db.pragma(pragma);
  }
}
