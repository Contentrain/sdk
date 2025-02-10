import type { Database } from 'better-sqlite3';
import type { Analyzer, GeneratedTypes } from '../../types/analyzer';
import type { SQLiteSourceConfig } from '../../types/config';
import type { ColumnInfo, RelationInfo, TableInfo } from './types';
import BetterSQLite from 'better-sqlite3';

export class SQLiteAnalyzer implements Analyzer {
  private db: Database;
  private readonly databasePath: string;

  constructor(config: SQLiteSourceConfig) {
    this.databasePath = config.source.databasePath;
    this.db = new BetterSQLite(this.databasePath, { readonly: true });
    this.setupDatabase();
  }

  private setupDatabase() {
    // Performans optimizasyonları
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
  }

  async analyze(): Promise<GeneratedTypes> {
    try {
      console.log('Analyzing SQLite database...');
      const schema = await this.analyzeSchema();
      console.log('Found tables:', Object.keys(schema));

      let baseTypes = this.initializeTypeDefinitions();
      let queryTypes = '';

      for (const [tableName, tableInfo] of Object.entries(schema)) {
        console.log(`Processing table: ${tableName}`);
        const { interfaceName, typeDefinition, relations } = this.generateTypeForTable(tableInfo);

        // Base Type Generation
        baseTypes += `export interface ${interfaceName} extends DBRecord ${typeDefinition}\n\n`;

        // Query Type Generation
        const queryInterfaceName = `${interfaceName}Query`;
        queryTypes += this.generateQueryType(interfaceName, queryInterfaceName, relations);
      }

      return { baseTypes, queryTypes };
    }
    catch (error) {
      console.error('❌ Error analyzing SQLite database:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to analyze SQLite database', { cause: error });
    }
  }

  private async analyzeSchema(): Promise<Record<string, TableInfo>> {
    const tables = this.getTables();
    const result: Record<string, TableInfo> = {};

    for (const table of tables) {
      if (table.startsWith('tbl_') && !table.endsWith('_translations')) {
        // Tablo adını normalize et
        const modelName = table.replace('tbl_', '')
          .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
          .toLowerCase();

        result[modelName] = {
          name: modelName,
          columns: this.getColumns(table),
          relations: this.getRelations(modelName),
        };
      }
    }

    return result;
  }

  private getTables(): string[] {
    const rows = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name LIKE 'tbl_%'
    `).all() as { name: string }[];
    return rows.map(row => row.name);
  }

  private getColumns(table: string): ColumnInfo[] {
    const rows = this.db.prepare(`PRAGMA table_info(${table})`).all() as {
      name: string
      type: string
      notnull: number
    }[];

    return rows.map(col => ({
      name: col.name,
      type: this.mapSQLiteTypeToTS(col.type),
      notNull: col.notnull === 1,
    }));
  }

  private getRelations(modelName: string): RelationInfo[] {
    // Model adını snake_case'den camelCase'e çevir
    const sourceModel = modelName.replace(/_[a-z]/g, match => match[1].toUpperCase());

    const rows = this.db.prepare(`
      SELECT DISTINCT field_id, target_model, type
      FROM tbl_contentrain_relations
      WHERE source_model = ?
    `).all(sourceModel) as {
      field_id: string
      target_model: string
      type: 'one-to-one' | 'one-to-many'
    }[];

    return rows.map((rel) => {
      // Hedef model adını snake_case'e çevir
      const targetTable = rel.target_model
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase();

      return {
        fieldName: rel.field_id,
        targetTable,
        type: rel.type,
      };
    });
  }

  private generateTypeForTable(
    tableInfo: TableInfo,
  ): { interfaceName: string, typeDefinition: string, relations: Record<string, { model: string, type: string }> } {
    const interfaceName = this.formatInterfaceName(tableInfo.name);
    let typeDefinition = '{\n';
    const relations: Record<string, { model: string, type: string }> = {};

    // Kolonları ekle
    for (const column of tableInfo.columns) {
      if (!['id', 'created_at', 'updated_at', 'status'].includes(column.name)) {
        const optional = !column.notNull ? '?' : '';
        typeDefinition += `  "${column.name}"${optional}: ${column.type};\n`;
      }
    }

    // İlişkileri ekle
    if (tableInfo.relations.length > 0) {
      typeDefinition += '\n  "_relations"?: {\n';
      for (const relation of tableInfo.relations) {
        const targetInterface = this.formatInterfaceName(relation.targetTable);
        const type = relation.type === 'one-to-many' ? `${targetInterface}[]` : targetInterface;
        typeDefinition += `    "${relation.fieldName}": ${type};\n`;

        relations[relation.fieldName] = {
          model: targetInterface,
          type: relation.type,
        };
      }
      typeDefinition += '  };\n';
    }

    typeDefinition += '}';
    return { interfaceName, typeDefinition, relations };
  }

  private generateQueryType(
    interfaceName: string,
    queryInterfaceName: string,
    relations: Record<string, { model: string, type: string }>,
  ): string {
    const hasRelations = Object.keys(relations).length > 0;
    const relationsType = hasRelations
      ? `{\n    ${Object.entries(relations)
        .map(([key]) => `"${key}": ${relations[key].model}`)
        .join(';\n    ')}\n  }`
      : 'Record<string, never>';

    return `export type ${queryInterfaceName} = QueryConfig<
  ${interfaceName},
  never,
  ${relationsType}
>;\n\n`;
  }

  private initializeTypeDefinitions(): string {
    return `// Automatically generated by @contentrain/types-generator
// Do not edit this file manually

import type { BaseContentrainType, QueryConfig, DBRecord } from '@contentrain/query';\n\n`;
  }

  private mapSQLiteTypeToTS(sqliteType: string): string {
    const typeMap: Record<string, string> = {
      INTEGER: 'number',
      REAL: 'number',
      TEXT: 'string',
      BLOB: 'Buffer',
      BOOLEAN: 'boolean',
    };

    return typeMap[sqliteType.toUpperCase()] || 'any';
  }

  private formatInterfaceName(name: string): string {
    // Önce tbl_ prefix'ini kaldır
    name = name.replace(/^tbl_/, '');

    // Alt çizgi ve tire ile ayrılmış kelimeleri ayır ve PascalCase'e dönüştür
    const pascalCase = name
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');

    return `I${pascalCase}`;
  }

  close() {
    this.db.close();
  }
}
