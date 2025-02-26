import type { Database, RunResult } from '../types/database';
import BetterSQLite3 from 'better-sqlite3';

export class DatabaseAdapter implements Database {
    private db!: BetterSQLite3.Database;

    constructor(private dbPath: string) {}

    async initialize(): Promise<void> {
        this.db = new BetterSQLite3(this.dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
    }

    close(): void {
        if (this.db) {
            this.db.close();
        }
    }

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

    pragma(pragma: string): void {
        this.db.pragma(pragma);
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
}
