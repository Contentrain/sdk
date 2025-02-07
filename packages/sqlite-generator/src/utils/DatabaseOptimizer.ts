import type { Database } from '../types/database';
import { FieldNormalizer } from '../normalizer/FieldNormalizer';
import { DatabaseError, ErrorCode } from '../types/errors';

export interface IndexConfig {
  table: string
  columns: string[]
  unique?: boolean
  where?: string
}

export class DatabaseOptimizer {
  private fieldNormalizer: FieldNormalizer;
  constructor(private db: Database) {
    this.fieldNormalizer = new FieldNormalizer();
  }

  optimize(): void {
    try {
      this.enableWALMode();
      this.optimizeMemory();
      this.optimizeJournal();
      this.optimizeLocking();
    }
    catch (error) {
      throw new DatabaseError({
        code: ErrorCode.DATABASE_CONNECTION_FAILED,
        message: 'Failed to optimize database',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private enableWALMode(): void {
    try {
      this.db.pragma('journal_mode = WAL');
    }
    catch (error) {
      throw new DatabaseError({
        code: ErrorCode.DATABASE_CONNECTION_FAILED,
        message: 'Failed to enable WAL mode',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private optimizeMemory(): void {
    try {
      this.db.pragma('cache_size = -2000'); // 2MB cache
      this.db.pragma('page_size = 4096');
      this.db.pragma('mmap_size = 268435456'); // 256MB mmap
    }
    catch (error) {
      throw new DatabaseError({
        code: ErrorCode.DATABASE_CONNECTION_FAILED,
        message: 'Failed to optimize memory settings',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private optimizeJournal(): void {
    try {
      this.db.pragma('wal_autocheckpoint = 1000');
      this.db.pragma('journal_size_limit = 67108864'); // 64MB
    }
    catch (error) {
      throw new DatabaseError({
        code: ErrorCode.DATABASE_CONNECTION_FAILED,
        message: 'Failed to optimize journal settings',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private optimizeLocking(): void {
    try {
      this.db.pragma('busy_timeout = 5000');
      this.db.pragma('locking_mode = NORMAL');
    }
    catch (error) {
      throw new DatabaseError({
        code: ErrorCode.DATABASE_CONNECTION_FAILED,
        message: 'Failed to optimize locking settings',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Creates indexes
   */
  async createIndexes(indexes: IndexConfig[]): Promise<void> {
    await this.db.transaction(async () => {
      for (const index of indexes) {
        const sql = this.generateIndexSQL(index);

        try {
          this.db.exec(sql);
        }
        catch (error) {
          throw new DatabaseError({
            code: ErrorCode.INDEX_CREATION_FAILED,
            message: 'Failed to create index',
            details: { sql, table: index.table, columns: index.columns },
            cause: error instanceof Error ? error : undefined,
          });
        }
      }
    });
  }

  private generateIndexSQL(index: IndexConfig): string {
    const indexName = this.generateIndexName(index);
    const columns = index.columns.join(', ');
    const uniqueClause = index.unique ? 'UNIQUE' : '';
    const whereClause = index.where ? `WHERE ${index.where}` : '';

    return `CREATE ${uniqueClause} INDEX IF NOT EXISTS ${indexName} ON ${index.table} (${columns}) ${whereClause}`.trim();
  }

  private generateIndexName(index: IndexConfig): string {
    const prefix = index.unique ? 'udx' : 'idx';
    const tableName = index.table.replace(/^tbl_/, '');
    const columnPart = index.columns.join('_');
    return `${prefix}_${tableName}_${columnPart}`;
  }
}
