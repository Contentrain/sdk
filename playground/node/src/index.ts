import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { generateJSONTypes } from './generators/json-types';
import { exportToMarkdown, generateDatabase } from './generators/sql';
import { generateSQLiteTypes } from './generators/sql-types';
import { jsonQueryExample } from './queries/json';
import { sqlQueryExample } from './queries/sql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
    try {
    // 1. Dizinleri oluştur
        console.log('\n=== Dizinler oluşturuluyor ===');
        const outputsDir = join(__dirname, 'outputs');
        await mkdir(join(outputsDir, 'db'), { recursive: true });
        await mkdir(join(outputsDir, 'types'), { recursive: true });
        await mkdir(join(outputsDir, 'markdowns'), { recursive: true });
        await mkdir(join(outputsDir, 'migrations'), { recursive: true });

        // 2. Veritabanını oluştur
        console.log('\n=== SQLite veritabanı oluşturuluyor ===');
        await generateDatabase();

        // 3. Biraz bekle - veritabanının oluşması için
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Tip tanımlarını oluştur
        console.log('\n=== JSON tip tanımları oluşturuluyor ===');
        await generateJSONTypes();

        console.log('\n=== SQLite tip tanımları oluşturuluyor ===');
        await generateSQLiteTypes();

        // 5. Veritabanı yapısını export et
        console.log('\n=== Veritabanı yapısı dışa aktarılıyor ===');
        await exportToMarkdown();

        // 6. Biraz daha bekle - export işleminin tamamlanması için
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 7. Sorguları çalıştır
        console.log('\n=== JSON Query Builder Testleri çalıştırılıyor ===');
        await jsonQueryExample();

        console.log('\n=== SQLite Query Builder Testleri çalıştırılıyor ===');
        await sqlQueryExample();

        console.log('\nTüm işlemler başarıyla tamamlandı!');
    }
    catch (error) {
        console.error('Hata:', error);
        exit(1);
    }
}

void main().catch((error) => {
    console.error('Beklenmeyen hata:', error);
    exit(1);
});
