import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { DatabaseAdapter, SQLiteGenerator } from '@contentrain/sqlite-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateDatabase() {
  try {
    // SQLite generator'ı yapılandır
    const generator = new SQLiteGenerator({
      // Model tanımlamalarının bulunduğu dizin
      modelsDir: join(__dirname, '../../contentrain/models'),
      // İçerik dosyalarının bulunduğu dizin
      contentDir: join(__dirname, '../../contentrain'),
      // Çıktı dizini
      outputDir: join(__dirname, '../db'),
      // Veritabanı dosya adı
      dbName: 'contentrain.db',
      // Tip tanımları dosya adı
      typesFile: 'contentrain.d.ts',
      // Önbellek yapılandırması
      cache: {
        enabled: true,
        ttl: 300,
      },
      // Güvenlik yapılandırması
      security: {
        validateInput: true,
        maxInputLength: 1000,
      },
      // Veritabanı optimizasyon yapılandırması
      optimization: {
        enableWAL: true,
        cacheSize: 2000,
        pageSize: 4096,
        journalSize: 67108864,
      },
    });

    // Veritabanını oluştur
    await generator.generate();

    console.log('SQLite veritabanı başarıyla oluşturuldu!');
    console.log(`Veritabanı konumu: ${join(__dirname, '../db/contentrain.db')}`);
    console.log(`Tip tanımları konumu: ${join(__dirname, '../db/contentrain.d.ts')}`);
  }
  catch (error) {
    console.error('Veritabanı oluşturulurken hata oluştu:', error);
    if (error instanceof Error) {
      console.error('Hata detayları:', error.message);
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

async function exportToMarkdown(dbFile: string, outputFile: string) {
  // Veritabanını aç
  const db = new DatabaseAdapter(dbFile);
  await db.initialize();
  // Markdown içeriğini oluştur
  let markdownContent = '# Database Structure & Content\n\n';

  // Tüm tabloları al
  const tables: { name: string }[] = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\'').all();

  for (const table of tables) {
    markdownContent += `## Table: ${table.name}\n\n`;

    // Sütun bilgilerini al
    const columns: { name: string, type: string, pk: number }[] = db.prepare(`PRAGMA table_info(${table.name})`).all();
    markdownContent += '| Column | Type | Primary Key |\n';
    markdownContent += '|--------|------|------------|\n';

    for (const col of columns) {
      markdownContent += `| ${col.name} | ${col.type || 'UNKNOWN'} | ${col.pk ? '✅' : ''} |\n`;
    }

    markdownContent += '\n'; // Boşluk ekleyerek Markdown'ı düzenli yap

    // 📌 Tablo içeriğini al
    const rows: Record<string, unknown>[] = db.prepare(`SELECT * FROM ${table.name}`).all();

    if (rows.length > 0) {
      // ✅ İlk satırın anahtarlarını al (sütun başlıkları)
      const headers = Object.keys(rows[0]);
      markdownContent += `### Data in ${table.name}\n\n`;
      markdownContent += `| ${headers.join(' | ')} |\n`;
      markdownContent += `| ${headers.map(() => '---').join(' | ')} |\n`;

      // ✅ Tüm satırları ekleyelim
      for (const row of rows) {
        const values = headers.map(header => row[header] !== null ? row[header] : 'NULL'); // Boş veriler için 'NULL'
        markdownContent += `| ${values.join(' | ')} |\n`;
      }

      markdownContent += '\n'; // Boşluk bırak
    }
    else {
      markdownContent += `⚠️ **No data found in ${table.name}**\n\n`;
    }
  }

  // Dosyaya yaz
  await writeFile(outputFile, markdownContent, 'utf8');
  console.log(`✅ Database structure & content exported to ${outputFile}`);

  // Veritabanını kapat
  db.close();
}

// Fonksiyonu çalıştır

void generateDatabase().then(async () => {
  const dbPath = join(__dirname, '../db/contentrain.db');
  await exportToMarkdown(dbPath, join(__dirname, './database_structure.md'));
}).catch((error) => {
  console.error('Beklenmeyen hata:', error);
  exit(1);
});
