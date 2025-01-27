import type { Database } from 'better-sqlite3';
import type {
  Services,
  ServicesI18n,
  TestimonailItems,
  TestimonailItemsI18n,
  Workitems,
  WorkitemsI18n,
} from '../types/database';
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

interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  status?: 'publish' | 'draft'
  lang?: string
}

// Tip güvenli sorgu fonksiyonları
export async function queryTestimonials(db: Database, options: QueryOptions = {}) {
  const {
    limit = 10,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'DESC',
    status = 'publish',
    lang = 'tr',
  } = options;

  // Ana tablo sorgusu
  const items = db.prepare(`
    SELECT * FROM testimonail_items
    WHERE status = ?
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT ? OFFSET ?
  `).all(status, limit, offset) as TestimonailItems[];

  // i18n sorgusu
  const i18nItems = db.prepare(`
    SELECT * FROM testimonail_items_i18n
    WHERE lang = ? AND ID IN (${items.map(() => '?').join(',')})
  `).all(lang, ...items.map(item => item.ID)) as TestimonailItemsI18n[];

  // Sonuçları birleştir
  return items.map(item => ({
    ...item,
    i18n: i18nItems.find(i18n => i18n.ID === item.ID),
  }));
}

export async function queryWorkItems(db: Database, options: QueryOptions = {}) {
  const {
    limit = 10,
    offset = 0,
    orderBy = 'order_field',
    orderDirection = 'ASC',
    status = 'publish',
    lang = 'tr',
  } = options;

  // Ana tablo sorgusu
  const items = db.prepare(`
    SELECT * FROM workitems
    WHERE status = ?
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT ? OFFSET ?
  `).all(status, limit, offset) as Workitems[];

  // i18n sorgusu
  const i18nItems = db.prepare(`
    SELECT * FROM workitems_i18n
    WHERE lang = ? AND ID IN (${items.map(() => '?').join(',')})
  `).all(lang, ...items.map(item => item.ID)) as WorkitemsI18n[];

  // Sonuçları birleştir
  return items.map(item => ({
    ...item,
    i18n: i18nItems.find(i18n => i18n.ID === item.ID),
  }));
}

export async function queryServices(db: Database, options: QueryOptions = {}) {
  const {
    limit = 10,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'DESC',
    status = 'publish',
    lang = 'tr',
  } = options;

  // Ana tablo sorgusu
  const items = db.prepare(`
    SELECT * FROM services
    WHERE status = ?
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT ? OFFSET ?
  `).all(status, limit, offset) as Services[];

  // i18n sorgusu
  const i18nItems = db.prepare(`
    SELECT * FROM services_i18n
    WHERE lang = ? AND ID IN (${items.map(() => '?').join(',')})
  `).all(lang, ...items.map(item => item.ID)) as ServicesI18n[];

  // Sonuçları birleştir
  return items.map(item => ({
    ...item,
    i18n: i18nItems.find(i18n => i18n.ID === item.ID),
  }));
}

async function generateTypeDefinitions(db: Database) {
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

async function generateDatabaseDoc(db: Database) {
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

// 1. Temel Sorgular
export async function queryWorkItemsByOrder(db: Database, options: QueryOptions = {}) {
  const { status = 'publish', lang = 'tr' } = options;

  // Ana tablo sorgusu
  const items = db.prepare(`
    SELECT * FROM workitems
    WHERE status = ?
    ORDER BY order_field ASC
  `).all(status) as Workitems[];

  // i18n sorgusu
  const i18nItems = db.prepare(`
    SELECT * FROM workitems_i18n
    WHERE lang = ? AND ID IN (${items.map(() => '?').join(',')})
  `).all(lang, ...items.map(item => item.ID)) as WorkitemsI18n[];

  return items.map(item => ({
    ...item,
    i18n: i18nItems.find(i18n => i18n.ID === item.ID),
  }));
}

export async function queryWorkItemsPaginated(db: Database, options: QueryOptions = {}) {
  const {
    limit = 3,
    offset = 1,
    status = 'publish',
    lang = 'tr',
  } = options;

  // Ana tablo sorgusu
  const items = db.prepare(`
    SELECT * FROM workitems
    WHERE status = ?
    ORDER BY title ASC
    LIMIT ? OFFSET ?
  `).all(status, limit, offset) as Workitems[];

  // i18n sorgusu
  const i18nItems = db.prepare(`
    SELECT * FROM workitems_i18n
    WHERE lang = ? AND ID IN (${items.map(() => '?').join(',')})
  `).all(lang, ...items.map(item => item.ID)) as WorkitemsI18n[];

  return items.map(item => ({
    ...item,
    i18n: i18nItems.find(i18n => i18n.ID === item.ID),
  }));
}

// 2. İlişki Sorguları
export async function queryTestimonialsWithWork(db: Database, options: QueryOptions = {}) {
  const { status = 'publish', lang = 'tr' } = options;

  // Ana tablo ve ilişki sorgusu
  const items = db.prepare(`
    SELECT t.*, w.title as work_title
    FROM testimonail_items t
    LEFT JOIN workitems w ON t.creative_work = w.ID
    WHERE t.status = ?
  `).all(status) as (TestimonailItems & { work_title: string })[];

  // i18n sorgusu
  const i18nItems = db.prepare(`
    SELECT * FROM testimonail_items_i18n
    WHERE lang = ? AND ID IN (${items.map(() => '?').join(',')})
  `).all(lang, ...items.map(item => item.ID)) as TestimonailItemsI18n[];

  return items.map(item => ({
    ...item,
    i18n: i18nItems.find(i18n => i18n.ID === item.ID),
  }));
}

export async function queryServicesWithTechnologies(db: Database, options: QueryOptions = {}) {
  const { status = 'publish', lang = 'tr' } = options;

  // Ana tablo sorgusu
  const services = db.prepare(`
    SELECT s.*, GROUP_CONCAT(t.logo) as tech_logos
    FROM services s
    LEFT JOIN services_reference sr ON s.ID = sr.source_id
    LEFT JOIN references_table t ON sr.target_id = t.ID
    WHERE s.status = ?
    GROUP BY s.ID
  `).all(status) as (Services & { tech_logos: string })[];

  // i18n sorgusu
  const i18nItems = db.prepare(`
    SELECT * FROM services_i18n
    WHERE lang = ? AND ID IN (${services.map(() => '?').join(',')})
  `).all(lang, ...services.map(item => item.ID)) as ServicesI18n[];

  return services.map(service => ({
    ...service,
    i18n: i18nItems.find(i18n => i18n.ID === service.ID),
    technologies: service.tech_logos?.split(',') || [],
  }));
}

// 3. Gelişmiş Sorgular
export async function queryWorkItemsWithFilters(db: Database, options: QueryOptions & {
  search?: string
  category?: string
} = {}) {
  const {
    status = 'publish',
    lang = 'tr',
    search,
    category,
  } = options;

  let sql = `
    SELECT w.*
    FROM workitems w
    WHERE w.status = ?
  `;
  const params: any[] = [status];

  if (search) {
    sql += ' AND (w.title LIKE ? OR w.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    sql += ' AND w.category = ?';
    params.push(category);
  }

  // Ana tablo sorgusu
  const items = db.prepare(sql).all(...params) as Workitems[];

  // i18n sorgusu
  const i18nItems = db.prepare(`
    SELECT * FROM workitems_i18n
    WHERE lang = ? AND ID IN (${items.map(() => '?').join(',')})
  `).all(lang, ...items.map(item => item.ID)) as WorkitemsI18n[];

  return items.map(item => ({
    ...item,
    i18n: i18nItems.find(i18n => i18n.ID === item.ID),
  }));
}

// 4. Çoklu Dil ve İlişki Senaryoları
export async function queryServicesWithReferences(db: Database, options: QueryOptions = {}) {
  const { status = 'publish', lang } = options;

  const sql = `
    SELECT s.*, r.logo as reference_logo
    FROM services s
    LEFT JOIN services_reference sr ON s.ID = sr.source_id
    LEFT JOIN references_table r ON sr.target_id = r.ID
    WHERE s.status = ?
  `;

  // Ana sorgu
  const items = db.prepare(sql).all(status) as (Services & { reference_logo: string })[];

  // i18n sorgusu (eğer dil belirtilmişse)
  if (lang) {
    const i18nItems = db.prepare(`
      SELECT * FROM services_i18n
      WHERE lang = ? AND ID IN (${items.map(() => '?').join(',')})
    `).all(lang, ...items.map(item => item.ID)) as ServicesI18n[];

    return items.map(item => ({
      ...item,
      i18n: i18nItems.find(i18n => i18n.ID === item.ID),
    }));
  }

  return items;
}

export async function querySocialLinksWithServices(db: Database, options: QueryOptions = {}) {
  const { status = 'publish', lang = 'tr' } = options;

  // Ana sorgu
  const items = db.prepare(`
    SELECT sl.*, s.title as service_title
    FROM sociallinks sl
    LEFT JOIN sociallinks_service ss ON sl.ID = ss.source_id
    LEFT JOIN services s ON ss.target_id = s.ID
    WHERE sl.status = ?
  `).all(status) as any[];

  // i18n sorgusu
  if (lang) {
    const serviceIds = items.map(item => item.service_id).filter(Boolean);
    const i18nItems = db.prepare(`
      SELECT * FROM services_i18n
      WHERE lang = ? AND ID IN (${serviceIds.map(() => '?').join(',')})
    `).all(lang, ...serviceIds) as ServicesI18n[];

    return items.map(item => ({
      ...item,
      service_i18n: i18nItems.find(i18n => i18n.ID === item.service_id),
    }));
  }

  return items;
}

// Ana fonksiyon
async function main() {
  const db = new BetterSQLite3(join(__dirname, '../db/contentrain.db'));

  try {
    await generateDatabaseDoc(db);
    await generateTypeDefinitions(db);
    await generateQueryOutput(db);
  }
  catch (error) {
    console.error('Sorgu hatası:', error);
  }
  finally {
    db.close();
  }
}

// Ana fonksiyon güncelleniyor
async function generateQueryOutput(db: Database) {
  let markdown = '# SQL Sorgu Çıktıları\n\n';

  try {
    // 1. Temel Sorgular
    markdown += '## 1. Temel Sorgular\n\n';

    // Sıralama örneği
    markdown += '### Sıralama\n\n```typescript\n';
    markdown += 'const orderedItems = await queryWorkItemsByOrder(db);\n';
    markdown += '```\n\n```json\n';
    const orderedItems = await queryWorkItemsByOrder(db);
    markdown += JSON.stringify(orderedItems, null, 2);
    markdown += '\n```\n\n';

    // Sayfalama örneği
    markdown += '### Sayfalama\n\n```typescript\n';
    markdown += 'const paginatedItems = await queryWorkItemsPaginated(db, { limit: 3, offset: 1 });\n';
    markdown += '```\n\n```json\n';
    const paginatedItems = await queryWorkItemsPaginated(db, { limit: 3, offset: 1 });
    markdown += JSON.stringify(paginatedItems, null, 2);
    markdown += '\n```\n\n';

    // 2. İlişki Sorguları
    markdown += '## 2. İlişki Sorguları\n\n';

    // Testimonials ve Work Items ilişkisi
    markdown += '### Testimonials ve Work Items\n\n```typescript\n';
    markdown += 'const testimonialsWithWork = await queryTestimonialsWithWork(db);\n';
    markdown += '```\n\n```json\n';
    const testimonialsWithWork = await queryTestimonialsWithWork(db);
    markdown += JSON.stringify(testimonialsWithWork, null, 2);
    markdown += '\n```\n\n';

    // Services ve Technologies ilişkisi
    markdown += '### Services ve Technologies\n\n```typescript\n';
    markdown += 'const servicesWithTech = await queryServicesWithTechnologies(db);\n';
    markdown += '```\n\n```json\n';
    const servicesWithTech = await queryServicesWithTechnologies(db);
    markdown += JSON.stringify(servicesWithTech, null, 2);
    markdown += '\n```\n\n';

    // 3. Gelişmiş Sorgular
    markdown += '## 3. Gelişmiş Sorgular\n\n';

    // Çoklu filtreler
    markdown += '### Çoklu Filtreler\n\n```typescript\n';
    markdown += `const filteredItems = await queryWorkItemsWithFilters(db, {
  search: 'platform',
  category: 'web'
});\n`;
    markdown += '```\n\n```json\n';
    const filteredItems = await queryWorkItemsWithFilters(db, {
      search: 'platform',
      category: 'web',
    });
    markdown += JSON.stringify(filteredItems, null, 2);
    markdown += '\n```\n\n';

    // 4. Çoklu Dil ve İlişki Senaryoları
    markdown += '## 4. Çoklu Dil ve İlişki Senaryoları\n\n';

    // Services ve References ilişkisi (TR)
    markdown += '### Services ve References (TR)\n\n```typescript\n';
    markdown += 'const servicesWithRefsTR = await queryServicesWithReferences(db, { lang: \'tr\' });\n';
    markdown += '```\n\n```json\n';
    const servicesWithRefsTR = await queryServicesWithReferences(db, { lang: 'tr' });
    markdown += JSON.stringify(servicesWithRefsTR, null, 2);
    markdown += '\n```\n\n';

    // Services ve References ilişkisi (EN)
    markdown += '### Services ve References (EN)\n\n```typescript\n';
    markdown += 'const servicesWithRefsEN = await queryServicesWithReferences(db);\n';
    markdown += '```\n\n```json\n';
    const servicesWithRefsEN = await queryServicesWithReferences(db);
    markdown += JSON.stringify(servicesWithRefsEN, null, 2);
    markdown += '\n```\n\n';

    // Sociallinks ve Services ilişkisi
    markdown += '### Sociallinks ve Services\n\n```typescript\n';
    markdown += 'const socialLinksWithServices = await querySocialLinksWithServices(db);\n';
    markdown += '```\n\n```json\n';
    const socialLinksWithServices = await querySocialLinksWithServices(db);
    markdown += JSON.stringify(socialLinksWithServices, null, 2);
    markdown += '\n```\n\n';

    // Dosyayı kaydet
    writeFileSync(join(__dirname, '../sql-output.md'), markdown);
    console.log('SQL sorgu çıktıları oluşturuldu: sql-output.md');
  }
  catch (error) {
    console.error('Sorgu çıktısı oluşturma hatası:', error);
  }
}

// Çalıştır
void main();
