import { dirname, join } from 'node:path';
import { exit } from 'node:process';
import { fileURLToPath } from 'node:url';

import ContentrainSQLiteGenerator from '@contentrain/sqlite-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateDatabase() {
  try {
    console.log('SQLite veritabanı oluşturuluyor...');

    // SQLite generator'ı yapılandır
    const generator = new ContentrainSQLiteGenerator({
      // Model tanımlamalarının bulunduğu dizin
      modelsDir: join(__dirname, '../../contentrain/models'),
      // İçerik dosyalarının bulunduğu dizin
      contentDir: join(__dirname, '../../contentrain'),
      // Veritabanının oluşturulacağı dizin
      outputDir: join(__dirname, '../db'),
      // Veritabanı dosya adı
      dbName: 'contentrain.db',
    });

    // Veritabanını oluştur
    await generator.generate();

    console.log('SQLite veritabanı başarıyla oluşturuldu!');
    console.log(`Veritabanı konumu: ${join(__dirname, '../db/contentrain.db')}`);
  }
  catch (error) {
    console.error('Veritabanı oluşturulurken hata oluştu:', error);
    throw error;
  }
}

// Fonksiyonu çalıştır
void generateDatabase().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  exit(1);
});
