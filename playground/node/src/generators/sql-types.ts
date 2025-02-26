import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentrainTypesGenerator } from '@contentrain/types-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateSQLiteTypes() {
    try {
    // Çıktı dizinlerini oluştur
        const outputDir = join(__dirname, '../outputs');
        const typesDir = join(outputDir, 'types');

        await mkdir(typesDir, { recursive: true });

        // SQLite kaynak için generator'ı yapılandır
        const generator = new ContentrainTypesGenerator({
            source: {
                type: 'sqlite',
                databasePath: join(__dirname, '../outputs/db/contentrain.db'),
            },
            output: {
                dir: typesDir,
                filename: 'contentrain-sql.d.ts',
            },
        });

        // Tip tanımlarını oluştur
        await generator.generate();

        console.log('✨ SQLite tip tanımları başarıyla oluşturuldu!');
        console.log(`📁 Çıktı konumu: ${join(typesDir, 'contentrain-sql.d.ts')}`);
    }
    catch (error) {
        console.error('❌ SQLite tip tanımları oluşturulurken hata:', error);
        throw error;
    }
}
