import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import BetterSQLite3 from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TableInfo {
  name: string
}

interface SchemaInfo {
  sql: string
  name: string
  type: string
}

interface ColumnInfo {
  name: string
  type: string
  notnull: number
  dflt_value: string | null
  pk: number
}

// Veritabanı bağlantısı
const db = new BetterSQLite3(join(__dirname, '../db/contentrain.db'));

async function generateTypeDefinitions() {
  let typescript = '// Bu dosya otomatik olarak oluşturulmuştur\n\n';

  // Tüm tabloları al
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name;
  `).all() as TableInfo[];

  for (const table of tables) {
    const tableName = table.name;

    // Tablo kolonlarını al
    const columns = db.prepare(`PRAGMA table_info(${tableName});`).all() as ColumnInfo[];

    // Interface oluştur
    typescript += `export interface ${toPascalCase(tableName)} {\n`;

    for (const column of columns) {
      const nullable = column.notnull === 0 ? ' | null' : '';
      const tsType = sqliteToTypeScript(column.type);
      typescript += `  ${column.name}: ${tsType}${nullable};\n`;
    }

    typescript += '}\n\n';
  }

  // Repository sınıfları oluştur
  for (const table of tables) {
    const tableName = table.name;
    const interfaceName = toPascalCase(tableName);

    typescript += `export class ${interfaceName}Repository {\n`;
    typescript += '  constructor(private db: BetterSQLite3.Database) {}\n\n';

    // Temel CRUD metodları
    typescript += `  findAll(): ${interfaceName}[] {\n`;
    typescript += `    return this.db.prepare('SELECT * FROM ${tableName}').all() as ${interfaceName}[];\n`;
    typescript += '  }\n\n';

    typescript += `  findById(id: string): ${interfaceName} | undefined {\n`;
    typescript += `    return this.db.prepare('SELECT * FROM ${tableName} WHERE ID = ?').get(id) as ${interfaceName};\n`;
    typescript += '  }\n\n';

    typescript += `  findByStatus(status: 'publish' | 'draft'): ${interfaceName}[] {\n`;
    typescript += `    return this.db.prepare('SELECT * FROM ${tableName} WHERE status = ?').all(status) as ${interfaceName}[];\n`;
    typescript += '  }\n';

    typescript += '}\n\n';
  }

  // Yardımcı fonksiyonlar
  function toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  function sqliteToTypeScript(sqlType: string): string {
    const typeMap: Record<string, string> = {
      INTEGER: 'number',
      REAL: 'number',
      TEXT: 'string',
      BLOB: 'Buffer',
      BOOLEAN: 'boolean',
      DATETIME: 'string',
    };

    const baseType = sqlType.split('(')[0].toUpperCase();
    return typeMap[baseType] || 'any';
  }

  // Dosyayı kaydet
  writeFileSync(join(__dirname, '../types/database.ts'), typescript);
  console.log('Tip tanımları oluşturuldu: types/database.ts');
}

async function generateDatabaseDoc() {
  // Tüm tabloları al
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name;
  `).all() as TableInfo[];

  let markdown = '# Veritabanı Yapısı ve İçeriği\n\n';

  // Her tablo için
  for (const table of tables) {
    const tableName = table.name;

    // i18n tablosu ise atla
    if (tableName.endsWith('_i18n'))
      continue;

    // Tablo başlığı
    markdown += `## Tablo: ${tableName}\n\n`;

    // Tablo şeması
    const schema = db.prepare(`
      SELECT sql FROM sqlite_master
      WHERE type='table' AND name=?;
    `).get(tableName) as SchemaInfo;

    markdown += `### Şema\n\n\`\`\`sql\n${schema.sql}\n\`\`\`\n\n`;

    // Ana tablo içeriği (Varsayılan/İngilizce)
    const mainRows = db.prepare(`SELECT * FROM ${tableName} LIMIT 5;`).all() as Record<string, unknown>[];

    if (mainRows.length > 0) {
      markdown += '### Varsayılan İçerik (İngilizce)\n\n';

      // Tablo başlıkları
      const headers = Object.keys(mainRows[0]);
      markdown += `| ${headers.join(' | ')} |\n`;
      markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;

      // Tablo verileri
      for (const row of mainRows) {
        markdown += `| ${headers.map(header => String(row[header] || '')).join(' | ')} |\n`;
      }

      markdown += '\n';

      // i18n tablosu var mı kontrol et
      const i18nTableName = `${tableName}_i18n`;
      const i18nExists = tables.some(t => t.name === i18nTableName);

      if (i18nExists) {
        // i18n içeriği (Türkçe)
        markdown += '### Lokalize İçerik (Türkçe)\n\n';

        const i18nRows = db.prepare(`
          SELECT i.*
          FROM ${i18nTableName} i
          WHERE i.lang = 'tr' AND i.ID IN (${mainRows.map(r => `'${(r as { ID: string }).ID}'`).join(',')})
        `).all() as Record<string, unknown>[];

        if (i18nRows.length > 0) {
          // i18n tablo başlıkları
          const i18nHeaders = Object.keys(i18nRows[0]);
          markdown += `| ${i18nHeaders.join(' | ')} |\n`;
          markdown += `| ${i18nHeaders.map(() => '---').join(' | ')} |\n`;

          // i18n tablo verileri
          for (const row of i18nRows) {
            markdown += `| ${i18nHeaders.map(header => String(row[header] || '')).join(' | ')} |\n`;
          }

          markdown += '\n';
        }
        else {
          markdown += 'Bu kayıtlar için Türkçe çeviri bulunmuyor.\n\n';
        }
      }
    }
    else {
      markdown += '### Bu tabloda veri bulunmuyor\n\n';
    }
  }

  // Markdown dosyasını kaydet
  writeFileSync(join(__dirname, '../db/database_doc.md'), markdown);
  console.log('Veritabanı dokümantasyonu oluşturuldu: db/database_doc.md');
}

// Ana fonksiyon
async function main() {
  try {
    await generateDatabaseDoc();
    await generateTypeDefinitions();
  }
  catch (error) {
    console.error('Sorgu hatası:', error);
  }
  finally {
    db.close();
  }
}

// Çalıştır
void main();
