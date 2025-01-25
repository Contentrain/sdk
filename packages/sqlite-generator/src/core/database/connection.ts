import type { Options } from 'better-sqlite3';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import BetterSQLite3 from 'better-sqlite3';

export class DatabaseConnection {
  private db: BetterSQLite3.Database | null = null;
  private config: Options;

  constructor(config: Options = {}) {
    this.config = {
      readonly: false,
      fileMustExist: false,
      timeout: 5000,
      ...config,
    };
    console.log('DatabaseConnection başlatıldı:', { config: this.config });
  }

  async createDatabase(dbPath: string): Promise<BetterSQLite3.Database> {
    console.log('Veritabanı oluşturma başladı:', { dbPath });
    this.db = new BetterSQLite3(dbPath, this.config);

    // Performans optimizasyonları
    const pragmas = [
      'PRAGMA journal_mode = MEMORY',
      'PRAGMA synchronous = OFF',
      'PRAGMA cache_size = -2000000', // 2GB cache
      'PRAGMA mmap_size = 30000000000', // 30GB mmap
      'PRAGMA temp_store = MEMORY',
      'PRAGMA locking_mode = EXCLUSIVE',
    ];

    console.log('Performans optimizasyonları uygulanıyor:', { pragmas });
    for (const pragma of pragmas) {
      console.log('PRAGMA çalıştırılıyor:', { sql: pragma });
      this.db.exec(pragma);
    }

    console.log('Veritabanı oluşturuldu:', { dbPath });
    return this.db;
  }

  async setReadOnlyMode(): Promise<void> {
    console.log('Read-only moda geçiliyor');
    if (!this.db)
      throw new Error('Database connection not initialized');

    const pragmas = [
      'PRAGMA query_only = ON',
      'PRAGMA read_only = ON',
    ];

    console.log('Read-only PRAGMA\'lar uygulanıyor:', { pragmas });
    for (const pragma of pragmas) {
      console.log('PRAGMA çalıştırılıyor:', { sql: pragma });
      this.db.exec(pragma);
    }
    console.log('Read-only moda geçildi');
  }

  async moveToTargetDir(targetDir: string): Promise<void> {
    console.log('Veritabanı hedef dizine taşınıyor:', { targetDir });
    if (!this.db)
      throw new Error('Database connection not initialized');

    const dbPath = this.db.name;
    const targetPath = join(targetDir, 'contentrain.db');

    console.log('Veritabanı kapatılıyor:', { dbPath });
    // Veritabanını kapat
    this.db.close();
    this.db = null;

    // Hedef dizini oluştur
    console.log('Hedef dizin oluşturuluyor:', { targetDir });
    await fs.mkdir(targetDir, { recursive: true });

    // Veritabanını taşı
    console.log('Veritabanı kopyalanıyor:', {
      source: dbPath,
      target: targetPath,
    });
    await fs.copyFile(dbPath, targetPath);

    // Dosya izinlerini read-only yap
    console.log('Dosya izinleri ayarlanıyor:', { targetPath });
    await fs.chmod(targetPath, 0o444);
    console.log('Veritabanı hedef dizine taşındı');
  }

  close(): void {
    if (this.db) {
      console.log('Veritabanı bağlantısı kapatılıyor');
      this.db.close();
      this.db = null;
      console.log('Veritabanı bağlantısı kapatıldı');
    }
  }
}
