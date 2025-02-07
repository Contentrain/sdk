import type { BaseQueryModel, RelationOptions } from '@contentrain/sqlite-generator';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DatabaseAdapter, QueryBuilder } from '@contentrain/sqlite-generator';

// Model tanımları
interface Reference extends BaseQueryModel {
  logo: string
  name: string
  url: string
}

interface Service extends BaseQueryModel {
  title: string
  description: string
  icon: string
  reference_id: string // İlişki alanı _id ile bitmeli
  reference: Reference | null // Tekil ilişki null olabilir
}

interface SocialLink extends BaseQueryModel {
  icon: string
  link: string
  service_id: string // İlişki alanı _id ile bitmeli
  service: Service | null // Tekil ilişki null olabilir
}

interface WorkCategory extends BaseQueryModel {
  category: string
  description: string
}

interface TabItem extends BaseQueryModel {
  description: string
  category_id: string[] // Çoklu ilişki için string array
  category: WorkCategory[] // Çoklu ilişki için array
}

interface WorkItem extends BaseQueryModel {
  title: string
  description: string
  image: string
  field_order: number
}

interface TestimonialItem extends BaseQueryModel {
  title: string
  description: string
  creative_work_id: string // İlişki alanı _id ile bitmeli
  creative_work: WorkItem | null // Tekil ilişki null olabilir
}

interface Section extends BaseQueryModel {
  title: string
  description: string
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../db/contentrain.db');

async function runTests() {
  const output: string[] = [];
  const db = new DatabaseAdapter(dbPath);
  await db.initialize();

  try {
    // Ana tablo yapısını kontrol et
    const tableInfo = await db.all('PRAGMA table_info(tbl_services)');
    console.log('Services Ana tablo yapısı:', JSON.stringify(tableInfo, null, 2));
    const socialLinksTableInfo = await db.all('PRAGMA table_info(tbl_sociallinks)');
    console.log('SocialLinks Ana tablo yapısı:', JSON.stringify(socialLinksTableInfo, null, 2));
    const relationsTableInfo = await db.all('PRAGMA table_info(tbl_contentrain_relations)');
    console.log('Relations Ana tablo yapısı:', JSON.stringify(relationsTableInfo, null, 2));
    // const allTables = await db.all('PRAGMA table_list');
    // console.log('Tüm tablolar:', JSON.stringify(allTables, null, 2));
    const relationContentrainRelations = await db.get('SELECT COUNT(*) AS count FROM tbl_contentrain_relations');
    console.log(`Toplam Kayıt Sayısı: ${relationContentrainRelations.count}`);
    // Sorguyu düzelt
    const workItemsQuery = new QueryBuilder<WorkItem>(db, 'workitems')

      .locale('tr') // Translation tablosundan veri çek

      .select(['title', 'description', 'field_order']) // Translation alanları
      .orderBy('field_order', 'asc')
      .limit(4);

    const workItems = await workItemsQuery.get();
    for (const item of workItems.data) {
      output.push(`- ${item.title} (Sıra: ${item.field_order})`);
    }
    output.push('');

    // Sayfalama
    output.push('### Sayfalama');
    const pagedItemsQuery = new QueryBuilder<WorkItem>(db, 'workitems')
      .locale('tr')
      .limit(3)
      .offset(1);

    const pagedItems = await pagedItemsQuery.get();
    for (const item of pagedItems.data) {
      output.push(`- ${item.title}`);
    }
    output.push(`Sayfalama: Limit ${pagedItems.pagination?.limit}, Offset ${pagedItems.pagination?.offset}\n`);

    // 2. İlişki Sorguları
    output.push('## 2. İlişki Sorguları');

    // Bire-Bir İlişki
    output.push('### Bire-Bir İlişki');
    const testimonialQuery = new QueryBuilder<TestimonialItem>(db, 'testimonial_items')
      .locale('tr')
      .include('creative_work', {
        select: ['title', 'description'],
      } as RelationOptions<WorkItem>)
      .limit(3);

    const testimonials = await testimonialQuery.get();
    for (const item of testimonials.data) {
      output.push(`- ${item.title} -> ${item.creative_work?.title}`);
    }
    output.push('');

    // Bire-Çok İlişki
    output.push('### Bire-Çok İlişki');
    const tabItemsQuery = new QueryBuilder<TabItem>(db, 'tabitems')
      .locale('tr')
      .include('category', {
        select: ['category', 'description'],
      });

    const tabItems = await tabItemsQuery.get();
    for (const item of tabItems.data) {
      output.push(`- ${item.description} -> ${item.category?.map(c => c.category).join(', ')}`);
    }
    output.push('');

    // 3. Gelişmiş Sorgular
    output.push('## 3. Gelişmiş Sorgular');

    // Çoklu Filtreler
    output.push('### Çoklu Filtreler');
    const complexQuery = new QueryBuilder<WorkItem>(db, 'workitems')
      .locale('tr')
      .where('field_order', 'gt', 4)
      .orderBy('field_order', 'asc')
      .limit(1);

    const complexResults = await complexQuery.get();
    for (const item of complexResults.data) {
      output.push(`- ${item.title} (Sıra: ${item.field_order}) - ${item.description}\n`);
    }

    // Dizi Operatörleri
    output.push('### Dizi Operatörleri');
    const statusQuery = new QueryBuilder<WorkItem>(db, 'workitems')
      .locale('tr')
      .where('status', 'eq', 'publish');

    const statusResults = await statusQuery.get();
    for (const item of statusResults.data) {
      output.push(`- ${item.title} (${item.status})`);
    }
    output.push('');

    // 4. Çoklu Dil ve İlişki Senaryoları
    output.push('## 4. Çoklu Dil ve İlişki Senaryoları');

    // Farklı Dillerde İçerik
    output.push('### Farklı Dillerde İçerik');
    const sectionsQuery = new QueryBuilder<Section>(db, 'sections')
      .limit(1);

    const sectionsResult = await sectionsQuery.get();

    if (sectionsResult.data[0]) {
      const id = sectionsResult.data[0].id;

      // TR içerik
      const trQuery = new QueryBuilder<Section>(db, 'sections')
        .where('id', 'eq', id)
        .locale('tr');

      // EN içerik
      const enQuery = new QueryBuilder<Section>(db, 'sections')
        .where('id', 'eq', id)
        .locale('en');

      const [trContent, enContent] = await Promise.all([
        trQuery.first(),
        enQuery.first(),
      ]);

      if (trContent)
        output.push(`- TR: ${trContent.title}`);
      if (enContent)
        output.push(`- EN: ${enContent.title}`);
    }
    output.push('');

    // Services -> References İlişkisi
    output.push('### Services -> References İlişkisi');
    const servicesQuery = new QueryBuilder<Service>(db, 'services')
      .locale('en')
      .include('reference', {
        select: ['logo', 'name'],
      } as RelationOptions<Reference>);

    const services = await servicesQuery.get();
    for (const service of services.data) {
      output.push(`- ${service.title} -> ${service.reference?.logo || 'undefined'}`);
    }
    output.push('');

    // Sociallinks -> Services İlişkisi
    output.push('### Sociallinks -> Services İlişkisi');
    const socialLinksQuery = new QueryBuilder<SocialLink>(db, 'sociallinks')
      .include('service', {
        select: ['title', 'description'],
      } as RelationOptions<Service>)
      .limit(3);

    const socialLinks = await socialLinksQuery.get();
    for (const link of socialLinks.data) {
      output.push(`- ${link.icon} (${link.link}) -> ${link.service?.title}`);
    }
    output.push('');

    // TR Dili İçin İlişkili İçerik
    output.push('### TR Dili İçin İlişkili İçerik');
    const trServicesQuery = new QueryBuilder<Service>(db, 'services')
      .locale('tr')
      .include('reference', {
        select: ['logo', 'name'],
      } as RelationOptions<Reference>);

    const trServices = await trServicesQuery.get();
    for (const service of trServices.data) {
      output.push(`- ${service.title} -> ${service.reference?.logo || 'undefined'}`);
    }
    output.push('');

    // EN Dili İçin İlişkili İçerik
    output.push('### EN Dili İçin İlişkili İçerik');
    const enServicesQuery = new QueryBuilder<Service>(db, 'services')
      .locale('en')
      .include('reference', {
        select: ['logo', 'name'],
      } as RelationOptions<Reference>);

    const enServices = await enServicesQuery.get();
    for (const service of enServices.data) {
      output.push(`- ${service.title} -> ${service.reference?.logo || 'undefined'}`);
    }
    output.push('');

    // 5. Metadata ve Assets
    output.push('## 5. Metadata ve Assets');

    // Model Metadata
    const workitemsQuery = new QueryBuilder<WorkItem>(db, 'workitems');
    const totalCount = await workitemsQuery.count();

    output.push(`- Model: ${JSON.stringify({
      name: 'WorkItems',
      modelId: 'workitems',
      localization: true,
      type: 'JSON',
      createdBy: 'user',
      isServerless: false,
      totalRecords: totalCount,
    }, null, 2)}`);

    // Asset Sayısı
    const assetsQuery = new QueryBuilder<WorkItem>(db, 'workitems')
      .locale('tr') // Çeviri tablosunu kullanmak için locale ekle
      .where('image', 'ne', '');
    const assetCount = await assetsQuery.count();

    output.push(`- Assets: ${assetCount} adet\n`);

    // Sonuçları dosyaya yaz
    await writeFile(join(__dirname, 'sql-output.md'), output.join('\n'));
    console.log('Test sonuçları sql-output.md dosyasına yazıldı.');
  }
  catch (error) {
    console.error('Test sırasında hata:', error);
  }
  finally {
    db.close();
  }
}

// Testleri çalıştır
void runTests();
