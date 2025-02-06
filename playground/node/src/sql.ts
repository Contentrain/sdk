import { dirname, join } from 'node:path';
import { exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { SQLiteGenerator } from '@contentrain/sqlite-generator';

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

// Fonksiyonu çalıştır
void generateDatabase().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  exit(1);
});
