import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { exportToMarkdown, generateDatabase } from './generators/sql';
import { jsonQueryExample } from './queries/json';
import { sqlQueryExample } from './queries/sql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    // 1. Dizinleri oluştur
    console.log('\n=== Creating directories ===');
    const outputsDir = join(__dirname, 'outputs');
    await mkdir(join(outputsDir, 'db'), { recursive: true });
    await mkdir(join(outputsDir, 'types'), { recursive: true });
    await mkdir(join(outputsDir, 'markdowns'), { recursive: true });
    await mkdir(join(outputsDir, 'migrations'), { recursive: true });

    // 2. Veritabanını oluştur
    console.log('\n=== SQLite Database is being created ===');
    await generateDatabase();

    // 3. Biraz bekle - veritabanının oluşması için
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Veritabanı yapısını export et
    console.log('\n=== Exporting database structure ===');
    await exportToMarkdown();

    // 5. Biraz daha bekle - export işleminin tamamlanması için
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Sorguları çalıştır
    console.log('\n=== Running JSON Query Builder Tests ===');
    await jsonQueryExample();

    console.log('\n=== Running SQLite Query Builder Tests ===');
    await sqlQueryExample();

    console.log('\nAll operations completed successfully!');
  }
  catch (error) {
    console.error('Error:', error);
    exit(1);
  }
}

void main().catch((error) => {
  console.error('Unexpected error:', error);
  exit(1);
});
