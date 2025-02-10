import type { DBRecord } from '@contentrain/query';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseSQLiteLoader, SQLiteQueryBuilder } from '@contentrain/query';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQLite için model tipleri
interface IWorkItem extends DBRecord {
  title: string
  description: string
  image: string
  category_id: string
  link: string
  field_order: number
  _relations?: {
    category: IWorkCategory
  }
}

interface IWorkCategory extends DBRecord {
  category: string
  field_order: number
}

interface ITabItem extends DBRecord {
  title: string
  description: string
  field_order: number
  _relations?: {
    category: IWorkCategory[]
  }

}

interface ITestimonialItem extends DBRecord {
  name: string
  description: string
  title: string
  image: string
  creative_work_id: string
  _relations?: {
    creative_work: IWorkItem
  }
}

interface IReference extends DBRecord {
  logo: string
}

interface IService extends DBRecord {
  title: string
  description: string
  reference_id: string
  _relations?: {
    reference: IReference
  }
}

export async function sqlQueryExample() {
  let loader: BaseSQLiteLoader | null = null;

  try {
    // Dizin yapısını kontrol et
    const outputDir = join(__dirname, '../outputs');
    const dbDir = join(outputDir, 'db');
    const markdownsDir = join(outputDir, 'markdowns');

    await mkdir(dbDir, { recursive: true });
    await mkdir(markdownsDir, { recursive: true });

    // SQLite bağlantısını başlat
    const dbPath = join(dbDir, 'contentrain.db');
    console.log('📌 SQLite DB Path:', dbPath);
    loader = new BaseSQLiteLoader(dbPath);
    console.log('✅ SQLite Loader başarıyla oluşturuldu');

    console.log('\n=== 1. Temel Sorgular ===');

    // 1.1 Filtreleme ve Sıralama
    console.log('\n--- Filtreleme ve Sıralama ---');
    const workItemsBuilder = new SQLiteQueryBuilder<IWorkItem>('workitems', loader);
    console.log('🔍 SQL Query Builder oluşturuldu. Tablo:', 'workitems');

    let workItems;
    try {
      console.log('🔄 Sorgu oluşturuluyor...');
      workItems = await workItemsBuilder
        .locale('en')
        .where('status', 'eq', 'publish')
        .where('field_order', 'lt', 5)
        .orderBy('field_order', 'asc')
        .get();
      console.log('✅ Sorgu başarıyla çalıştı');
      console.log('📦 Sonuçlar:', workItems);
    }
    catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Sorgu çalıştırılırken hata oluştu:', error.message);
        console.error('🔍 SQL Hatası:', error.message);
        if ('code' in error) {
          console.error('🔑 Hata Kodu:', (error as { code: string }).code);
        }
      }
      throw error;
    }

    // 1.2 Sayfalama
    console.log('\n--- Sayfalama ---');
    const pagedItems = await workItemsBuilder
      .locale('en')
      .limit(3)
      .offset(1)
      .get();

    console.log('Sayfalanmış Öğeler:', pagedItems.data.length);
    console.log('Sayfalama Bilgisi:', pagedItems.pagination);

    console.log('\n=== 2. İlişki Sorguları ===');

    // 2.1 Bire-Bir İlişki
    console.log('\n--- Bire-Bir İlişki ---');
    const testimonialBuilder = new SQLiteQueryBuilder<ITestimonialItem>('testimonial_items', loader);
    const testimonials = await testimonialBuilder
      .locale('en')
      .include('creative_work')
      .get();

    console.log('Referanslar ve İlişkili İşler:', testimonials.data.map(t => ({
      title: t.title,
      work: t._relations?.creative_work?.title,
    })));

    // 2.2 Bire-Çok İlişki
    console.log('\n--- Bire-Çok İlişki ---');
    const tabItemBuilder = new SQLiteQueryBuilder<ITabItem>('tabitems', loader);
    const tabItems = await tabItemBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .include('category')
      .get();

    console.log('Tab Öğeleri ve Kategorileri:', tabItems.data.map(t => ({
      description: t.description,
      categories: t._relations?.category?.map(c => c.category),
    })));

    console.log('\n=== 3. Gelişmiş Sorgular ===');

    // 3.1 Çoklu Filtreler ve Çeviriler
    console.log('\n--- Çoklu Filtreler ve Çeviriler ---');
    const serviceBuilder = new SQLiteQueryBuilder<IService>('services', loader);
    const services = await serviceBuilder
      .locale('tr')
      .where('status', 'eq', 'publish')
      .include('reference')
      .get();
    console.log('Filtrelenmiş Servisler:', services.data.length);

    // 3.2 String Operasyonları
    console.log('\n--- String Operasyonları ---');
    const searchResults = await serviceBuilder
      .locale('en')
      .where('title', 'contains', 'API')
      .get();
    console.log('Arama Sonuçları:', searchResults.data.length);

    console.log('\n=== 4. Çoklu Dil Senaryoları ===');

    // 4.1 TR Dili İçin Sorgular
    console.log('\n--- TR Dili İçin Sorgular ---');
    const trServices = await serviceBuilder
      .locale('tr')
      .include('reference')
      .get();
    console.log('TR Servisler:', trServices.data.map(s => ({
      title: s.title,
      reference: s._relations?.reference?.logo,
    })));

    // 4.2 EN Dili İçin Sorgular
    console.log('\n--- EN Dili İçin Sorgular ---');
    const enServices = await serviceBuilder
      .locale('en')
      .include('reference')
      .get();
    console.log('EN Servisler:', enServices.data.map(s => ({
      title: s.title,
      reference: s._relations?.reference?.logo,
    })));
    console.log(workItems, 'workItems');
    // Sonuçları dosyaya yaz
    const markdownContent = `
# Contentrain SQLite Query Builder Test Sonuçları


## 1. Temel Sorgular
### Filtreleme ve Sıralama
${workItems.data.map(item => `- ${item.title} (Sıra: ${item.field_order})`).join('\n')}

### Sayfalama
${pagedItems.data.map(item => `- ${item.title}`).join('\n')}
Sayfalama: Limit ${pagedItems.pagination?.limit}, Offset ${pagedItems.pagination?.offset}

## 2. İlişki Sorguları
### Bire-Bir İlişki
${testimonials.data.map(t => `- ${t.title} -> ${t._relations?.creative_work?.title}`).join('\n')}

### Bire-Çok İlişki
${tabItems.data.map(t => `- ${t.description} -> ${t._relations?.category?.map(c => c.category).join(', ')}`).join('\n')}

## 3. Gelişmiş Sorgular
### Çoklu Filtreler ve Çeviriler
${services.data.map(s => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}

### String Operasyonları
${searchResults.data.map(s => `- ${s.title}`).join('\n')}

## 4. Çoklu Dil Senaryoları
### TR Servisler
${trServices.data.map(s => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}

### EN Servisler
${enServices.data.map(s => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}
`;

    // Markdown çıktısı için doğru path
    await writeFile(
      join(markdownsDir, 'sql-output.md'),
      markdownContent,
      'utf8',
    );

    console.log('\nSonuçlar sql-output.md dosyasına yazıldı.');
  }
  catch (error) {
    console.error('SQL Query Error:', error);
    throw error;
  }
  finally {
    // SQLite bağlantısını kapat
    if (loader) {
      await loader.close();
    }
  }
}
