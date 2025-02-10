import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentrainTypesGenerator } from '@contentrain/types-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateJSONTypes() {
  try {
    // Çıktı dizinlerini oluştur
    const outputDir = join(__dirname, '../outputs');
    const typesDir = join(outputDir, 'types');

    await mkdir(typesDir, { recursive: true });

    // JSON kaynak için generator'ı yapılandır
    const generator = new ContentrainTypesGenerator({
      source: {
        type: 'json',
        modelsDir: join(__dirname, '../../../contentrain/models'),
        contentDir: join(__dirname, '../../../contentrain'),
      },
      output: {
        dir: typesDir,
        filename: 'contentrain-json.d.ts',
      },
    });

    // Tip tanımlarını oluştur
    await generator.generate();

    console.log('✨ JSON tip tanımları başarıyla oluşturuldu!');
    console.log(`📁 Çıktı konumu: ${join(typesDir, 'contentrain-json.d.ts')}`);
  }
  catch (error) {
    console.error('❌ JSON tip tanımları oluşturulurken hata:', error);
    throw error;
  }
}
