import type { DBRecord } from '@contentrain/query';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseSQLiteLoader, SQLiteQueryBuilder } from '@contentrain/query';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Model tipleri
interface WorkItem extends DBRecord {
  title: string
  description: string
  image: string
  category_id: string
  link: string
  status: string
  created_at: string
  updated_at: string
  _relations?: {
    category: WorkCategory
  }
}

interface WorkCategory extends DBRecord {
  category: string
  status: string
  created_at: string
  updated_at: string
}

interface TabItem extends DBRecord {
  link: string
  description: string
  image: string
  status: string
  category_id: string
  created_at: string
  updated_at: string
  _relations?: {
    category: WorkCategory
  }
}

interface TestimonialItem extends DBRecord {
  name: string
  description: string
  title: string
  image: string
  creative_work_id: string
  status: string
  created_at: string
  updated_at: string
  _relations?: {
    'creative-work': WorkItem
  }
}

interface Reference extends DBRecord {
  logo: string
  status: string
  created_at: string
  updated_at: string
}

interface Service extends DBRecord {
  reference_id: string
  status: string
  created_at: string
  updated_at: string
  _relations?: {
    reference: Reference
  }
}

export async function sqlQueryExample() {
  let loader: BaseSQLiteLoader | null = null;

  try {
    // Dizin yapısını oluştur
    const outputDir = join(__dirname, '../outputs');
    const dbDir = join(outputDir, 'db');
    const markdownsDir = join(outputDir, 'markdowns');

    await mkdir(dbDir, { recursive: true });
    await mkdir(markdownsDir, { recursive: true });

    // SQLite bağlantısını başlat
    const dbPath = join(dbDir, 'contentrain.db');
    loader = new BaseSQLiteLoader(dbPath);

    // Builder'ları oluştur
    const workItemsBuilder = new SQLiteQueryBuilder<WorkItem>('workitems', loader);
    const testimonialBuilder = new SQLiteQueryBuilder<TestimonialItem>('testimonial-items', loader);
    const tabItemBuilder = new SQLiteQueryBuilder<TabItem>('tabitems', loader);
    const serviceBuilder = new SQLiteQueryBuilder<Service>('services', loader);

    // 1. Temel Sorgular
    // 1.1 Filtreleme ve Sıralama
    const workItems = await workItemsBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .orderBy('created_at', 'desc')
      .get();

    // 1.2 Sayfalama
    const pagedItems = await workItemsBuilder
      .locale('en')
      .orderBy('created_at', 'desc')
      .limit(3)
      .offset(1)
      .get();

    // 1.3 İlk Öğeyi Getirme
    const firstItem = await workItemsBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .orderBy('created_at', 'desc')
      .first();

    // 2. İlişki Sorguları
    // 2.1 Bire-Bir İlişki
    const testimonials = await testimonialBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .include('creative-work')
      .get();

    // 2.2 Bire-Çok İlişki
    const tabItems = await tabItemBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .include('workcategories')
      .orderBy('created_at', 'desc')
      .get();

    // 3. Gelişmiş Sorgular
    // 3.1 Çoklu Filtreler
    const filteredServices = await serviceBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .include('reference')
      .get();

    // 3.2 Sayısal Karşılaştırmalar
    const orderedItems = await workItemsBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .orderBy('created_at', 'desc')
      .get();

    // 3.3 String Operasyonları
    const searchResults = await workItemsBuilder
      .locale('en')
      .where('title', 'startsWith', 'Con')
      .get();

    // 4. Çoklu Dil Senaryoları
    // 4.1 TR İçerik
    const trServices = await serviceBuilder
      .locale('tr')
      .where('status', 'eq', 'publish')
      .include('reference')
      .orderBy('created_at', 'desc')
      .get();

    // 4.2 EN İçerik
    const enServices = await serviceBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .include('reference')
      .orderBy('created_at', 'desc')
      .get();

    // 4.3 Çoklu Dil Karşılaştırma
    const trWorkItem = await workItemsBuilder
      .locale('tr')
      .where('status', 'eq', 'publish')
      .first();

    const enWorkItem = await workItemsBuilder
      .locale('en')
      .where('id', 'eq', trWorkItem?.id || '')
      .first();

    // 5. Gelişmiş İlişki Sorguları
    // 5.1 İç İçe İlişkiler
    const nestedRelations = await workItemsBuilder
      .locale('en')
      .where('status', 'eq', 'publish')
      .where('category_id', 'ne', '')
      .include('workcategories')
      .get();

    // 5.2 İlişki Filtreleme
    const categoryId = (await workItemsBuilder
      .locale('en')
      .where('category_id', 'ne', '')
      .first())?.category_id;
    console.log(categoryId, 'Found category id');
    const filteredByRelation = categoryId
      ? await workItemsBuilder
        .locale('en')
        .where('category_id', 'eq', categoryId)
        .include('workcategories')
        .get()
      : null;

    // Sonuçları markdown dosyasına yaz
    const markdownContent = `
# Contentrain SQLite Query Builder Örnekleri

## 1. Temel Sorgular
### 1.1 Filtreleme ve Sıralama
${workItems.data.map(item => `- ${item.title} (Oluşturulma: ${item.created_at})`).join('\n')}

### 1.2 Sayfalama
${pagedItems.data.map(item => `- ${item.title}`).join('\n')}
Sayfalama: Limit ${pagedItems.pagination?.limit}, Offset ${pagedItems.pagination?.offset}

### 1.3 İlk Öğe
- ${firstItem?.title} (ID: ${firstItem?.id})

## 2. İlişki Sorguları
### 2.1 Bire-Bir İlişki
${testimonials.data.map(t => `- ${t.name} -> ${t._relations?.['creative-work']?.title}`).join('\n')}

### 2.2 Bire-Çok İlişki
${tabItems.data.map(t => `- ${t.description} -> ${t._relations?.category?.category}`).join('\n')}

## 3. Gelişmiş Sorgular
### 3.1 Çoklu Filtreler
${filteredServices.data.map(s => `- ${s.reference_id} -> ${s._relations?.reference?.logo}`).join('\n')}

### 3.2 Sayısal Karşılaştırmalar
${orderedItems.data.map(item => `- ${item.title} (Oluşturulma: ${item.created_at})`).join('\n')}

### 3.3 String Operasyonları
${searchResults.data.map(s => `- ${s.title}`).join('\n')}

## 4. Çoklu Dil Senaryoları
### 4.1 TR Servisler
${trServices.data.map(s => `- ${s.reference_id} -> ${s._relations?.reference?.logo}`).join('\n')}

### 4.2 EN Servisler
${enServices.data.map(s => `- ${s.reference_id} -> ${s._relations?.reference?.logo}`).join('\n')}

### 4.3 Çoklu Dil Karşılaştırma
TR: ${trWorkItem?.title}
EN: ${enWorkItem?.title}

## 5. Gelişmiş İlişki Sorguları
### 5.1 İç İçe İlişkiler
${nestedRelations.data.map(item => `- ${item.title} (Kategori: ${item._relations?.category?.category})`).join('\n')}

### 5.2 İlişki Filtreleme
${filteredByRelation?.data.map(item => `- ${item.title} (Kategori: ${item._relations?.category?.category})`).join('\n') || 'İlişki bulunamadı'}
`;

    // Markdown dosyasını kaydet
    await writeFile(
      join(markdownsDir, 'sql-output.md'),
      markdownContent,
      'utf8',
    );
  }
  catch (error) {
    console.error('SQL Query Error:', error);
    throw error;
  }
  finally {
    if (loader) {
      await loader.close();
    }
  }
}
