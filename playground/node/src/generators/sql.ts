import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseAdapter, SQLiteGenerator } from '@contentrain/sqlite-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateDatabase() {
    try {
    // Önce gerekli dizinleri oluştur
        const outputDir = join(__dirname, '../outputs');
        const dbDir = join(outputDir, 'db');
        const typesDir = join(outputDir, 'types');
        const migrationsDir = join(outputDir, 'migrations');

        await mkdir(dbDir, { recursive: true });
        await mkdir(typesDir, { recursive: true });
        await mkdir(migrationsDir, { recursive: true });

        // SQLite generator'ı yapılandır
        const generator = new SQLiteGenerator({
            modelsDir: join(__dirname, '../../../contentrain/models'),
            contentDir: join(__dirname, '../../../contentrain'),
            outputDir: dbDir,
            dbName: 'contentrain.db',
            typesFile: join(typesDir, 'contentrain-sql.d.ts'),
        });

        // Veritabanını oluştur
        await generator.generate();
        const generator2 = new SQLiteGenerator({
            modelsDir: join(__dirname, '../../../contentrain-2/models'),
            contentDir: join(__dirname, '../../../contentrain-2'),
            outputDir: dbDir,
            dbName: 'contentrain2.db',
        });
        await generator2.generate();

        console.log('SQLite database created successfully!');
        console.log(`Database location: ${join(__dirname, '../outputs/db/contentrain.db')}`);
        console.log(`Types location: ${join(__dirname, '../outputs/types/contentrain.d.ts')}`);
    }
    catch (error) {
        console.error('Error occurred while creating database:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack:', error.stack);
        }
        throw error;
    }
}

export async function exportToMarkdown(dbPath?: string, outputPath?: string) {
    const dbFile = dbPath || join(__dirname, '../outputs/db/contentrain.db');
    const outputFile = outputPath || join(__dirname, '../outputs/markdowns/database_structure.md');
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
