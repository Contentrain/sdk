import fs from 'node:fs';
import Database from 'better-sqlite3';

export class TypeScriptGenerator {
  constructor(private dbPath: string, private outputFile: string) {}

  private mapSqliteToTypeScript(sqliteType: string | null): string {
    if (!sqliteType)
      return 'any';
    const type = sqliteType.toLowerCase();
    if (type.includes('int'))
      return 'number';
    if (type.includes('char') || type.includes('text') || type.includes('clob'))
      return 'string';
    if (type.includes('blob'))
      return 'Buffer';
    if (type.includes('real') || type.includes('floa') || type.includes('doub'))
      return 'number';
    if (type.includes('bool'))
      return 'boolean';
    if (type.includes('date') || type.includes('time'))
      return 'string'; // ISO string for dates
    return 'any';
  }

  public generateTypes(): void {
    const db = new Database(this.dbPath);

    // Get all table names
    const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\';').all() as { name: string }[];

    let typeDefinitions = '';

    for (const { name: tableName } of tables) {
      const columns = db.prepare(`PRAGMA table_info(${tableName});`).all();
      const interfaceName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
      const fields = columns.map(
        (column: any) =>
          `  ${column.name}: ${this.mapSqliteToTypeScript(column.type)}${column.notnull === 0 ? ' | null' : ''};`,
      );

      typeDefinitions += `export interface ${interfaceName} {\n${fields.join('\n')}\n}\n\n`;
    }

    // Write the generated TypeScript definitions to the output file
    fs.writeFileSync(this.outputFile, typeDefinitions);
    console.log(`TypeScript definitions written to ${this.outputFile}`);

    db.close();
  }
}
