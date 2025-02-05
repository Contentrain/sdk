import type { Database } from '../types/database';
import { ValidationError } from '../types/errors';

interface SchemaVersion {
  version: string
  description: string
  createdAt: string
  appliedAt?: string
}

interface MigrationStep {
  up: string
  down: string
  description: string
}

export class SchemaVersionManager {
  private readonly VERSION_TABLE = 'contentrain_schema_versions';

  constructor(private db: Database) {
    this.initVersionTable();
  }

  /**
   * Mevcut şema versiyonunu alır
   */
  public async getCurrentVersion(): Promise<string> {
    const result = await this.db.get<{ version: string }>(
      `SELECT version FROM ${this.VERSION_TABLE} ORDER BY applied_at DESC LIMIT 1`,
    );

    return result?.version ?? '0.0.0';
  }

  /**
   * Şemayı belirtilen versiyona günceller
   */
  public async upgradeSchema(targetVersion: string, migrations: Record<string, MigrationStep[]>): Promise<void> {
    const currentVersion = await this.getCurrentVersion();

    if (currentVersion === targetVersion) {
      return;
    }

    if (this.compareVersions(currentVersion, targetVersion) > 0) {
      throw new ValidationError(
        'DOWNGRADE_NOT_SUPPORTED',
        { currentVersion, targetVersion },
      );
    }

    const steps = this.getMigrationSteps(currentVersion, targetVersion, migrations);

    await this.db.transaction(async () => {
      for (const step of steps) {
        // Up migration'ı uygula
        this.db.exec(step.up);

        // Versiyon kaydını ekle
        await this.db.run(
          `INSERT INTO ${this.VERSION_TABLE} (version, description, created_at, applied_at)
           VALUES (@version, @description, @createdAt, datetime('now'))`,
          {
            version: targetVersion,
            description: step.description,
            createdAt: new Date().toISOString(),
          },
        );
      }
    });
  }

  /**
   * Versiyon tablosunu oluşturur
   */
  private initVersionTable(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.VERSION_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `;

    this.db.exec(sql);
  }

  /**
   * İki versiyon numarasını karşılaştırır
   * @returns -1: v1 < v2, 0: v1 = v2, 1: v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const part1 = v1Parts[i] || 0;
      const part2 = v2Parts[i] || 0;

      if (part1 < part2)
        return -1;
      if (part1 > part2)
        return 1;
    }

    return 0;
  }

  /**
   * İki versiyon arasındaki migration adımlarını bulur
   */
  private getMigrationSteps(fromVersion: string, toVersion: string, migrations: Record<string, MigrationStep[]>): MigrationStep[] {
    const steps: MigrationStep[] = [];
    const versions = Object.keys(migrations).sort((a, b) => this.compareVersions(a, b));

    let shouldAdd = false;
    for (const version of versions) {
      if (version === fromVersion) {
        shouldAdd = true;
        continue;
      }

      if (shouldAdd) {
        steps.push(...migrations[version]);
      }

      if (version === toVersion) {
        break;
      }
    }

    return steps;
  }

  /**
   * Tüm şema versiyonlarını listeler
   */
  public async listVersions(): Promise<SchemaVersion[]> {
    const versions = await this.db.all<SchemaVersion>(
      `SELECT version, description, created_at as createdAt, applied_at as appliedAt
       FROM ${this.VERSION_TABLE}
       ORDER BY applied_at DESC`,
    );

    return versions;
  }

  /**
   * Belirli bir versiyonun detaylarını getirir
   */
  public async getVersionDetails(version: string): Promise<SchemaVersion | null> {
    const details = await this.db.get<SchemaVersion>(
      `SELECT version, description, created_at as createdAt, applied_at as appliedAt
       FROM ${this.VERSION_TABLE}
       WHERE version = @version`,
      { version },
    );

    return details ?? null;
  }
}
