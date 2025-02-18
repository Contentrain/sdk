import type { ContentrainStatus, IBaseJSONRecord } from '@contentrain/query';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentrainSDK } from '@contentrain/query';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Model tipleri
interface IWorkItem extends IBaseJSONRecord {
  ID: string
  title: string
  description: string
  image: string
  category: string
  link: string
  order: number
  status: ContentrainStatus
  createdAt: string
  updatedAt: string
}

interface IWorkCategory extends IBaseJSONRecord {
  ID: string
  category: string
  order: number
  status: ContentrainStatus
  createdAt: string
  updatedAt: string
}

interface ITabItem extends IBaseJSONRecord {
  id: string
  title: string
  description: string
  order: number
  category: string[]
  status: ContentrainStatus
  createdAt: string
  updatedAt: string
  _relations?: {
    category: IWorkCategory[]
  }
}

interface IFaqItem extends IBaseJSONRecord {
  id: string
  question: string
  answer: string
  order: number
  status: ContentrainStatus
  createdAt: string
  updatedAt: string
}

interface ITestimonialItem extends IBaseJSONRecord {
  'id': string
  'name': string
  'description': string
  'title': string
  'image': string
  'creative-work': string
  'status': ContentrainStatus
  'createdAt': string
  'updatedAt': string
  '_relations'?: {
    'creative-work': IWorkItem
  }
}

interface ISection extends IBaseJSONRecord {
  id: string
  title: string
  description: string
  buttonText?: string
  buttonLink?: string
  name: string
  subtitle?: string
  status: ContentrainStatus
  createdAt: string
  updatedAt: string
}

interface IReference extends IBaseJSONRecord {
  id: string
  logo: string
  status: ContentrainStatus
  createdAt: string
  updatedAt: string
}

interface IService extends IBaseJSONRecord {
  id: string
  title: string
  description: string
  reference: string
  status: ContentrainStatus
  createdAt: string
  updatedAt: string
  _relations?: {
    reference: IReference
  }
}

interface ISocialLink extends IBaseJSONRecord {
  id: string
  icon: string
  link: string
  service?: string
  status: ContentrainStatus
  createdAt: string
  updatedAt: string
  _relations?: {
    service: IService
  }
}

export async function jsonQueryExample() {
  try {
    // Çıktı dizinini oluştur
    const outputDir = join(__dirname, '../outputs/markdowns');
    await mkdir(outputDir, { recursive: true });

    // SDK'yı başlat
    const sdk = new ContentrainSDK('json', {
      contentDir: join(__dirname, '../../../contentrain'),
      defaultLocale: 'tr',
      cache: true,
      ttl: 60 * 1000,
      maxCacheSize: 100,
    });

    console.log('\n=== 1. Temel Sorgular ===');

    // 1.1 Filtreleme ve Sıralama
    console.log('\n--- Filtreleme ve Sıralama ---');
    const workItems = await sdk
      .query<IWorkItem>('workitems')
      .where('status', 'eq', 'publish')
      .where('order', 'lt', 5)
      .orderBy('order', 'asc')
      .get();
    console.log('Filtrelenmiş İş Öğeleri:', workItems.data.length);

    // 1.2 Sayfalama
    console.log('\n--- Sayfalama ---');
    const pagedItems = await sdk
      .query<IWorkItem>('workitems')
      .limit(3)
      .offset(1)
      .get();
    console.log('Sayfalanmış Öğeler:', pagedItems.data.length);
    console.log('Sayfalama Bilgisi:', pagedItems.pagination);

    console.log('\n=== 2. İlişki Sorguları ===');

    // 2.1 Bire-Bir İlişki
    console.log('\n--- Bire-Bir İlişki ---');
    const recentTestimonials = await sdk
      .query<ITestimonialItem>('testimonial-items')
      .where('status', 'eq', 'publish')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .include('creative-work')
      .get();
    console.log('Referanslar ve İlişkili İşler:', recentTestimonials.data.map((t: ITestimonialItem) => ({
      title: t.title,
      work: t._relations?.['creative-work']?.title,
    })));

    // 2.2 Bire-Çok İlişki
    console.log('\n--- Bire-Çok İlişki ---');
    const tabItems = await sdk
      .query<ITabItem>('tabitems')
      .where('status', 'eq', 'publish')
      .include('category')
      .get();
    console.log('Tab Öğeleri ve Kategorileri:', tabItems.data.map((t: ITabItem) => ({
      description: t.description,
      categories: t._relations?.category?.map((c: IWorkCategory) => c.category),
    })));

    console.log('\n=== 3. Gelişmiş Sorgular ===');

    // 3.1 Çoklu Filtreler
    console.log('\n--- Çoklu Filtreler ---');
    const filteredServices = await sdk
      .query<IWorkItem>('workitems')
      .where('status', 'eq', 'publish')
      .where('order', 'gt', 2)
      .where('order', 'lt', 6)
      .where('description', 'contains', 'platform')
      .orderBy('order', 'asc')
      .get();
    console.log('Filtrelenmiş İş Öğeleri:', filteredServices.data.length);

    // 3.2 Dizi Operatörleri
    console.log('\n--- Dizi Operatörleri ---');
    const statusFiltered = await sdk
      .query<IWorkItem>('workitems')
      .where('status', 'in', ['publish', 'draft'])
      .get();
    console.log('Durum Filtrelenmiş Öğeler:', statusFiltered.data.length);

    console.log('\n=== 4. Çoklu Dil ve İlişki Senaryoları ===');

    // 4.1 Farklı Dillerde İçerik
    console.log('\n--- Farklı Dillerde İçerik ---');
    const trContent = await sdk
      .query<ISection>('sections')
      .locale('tr')
      .first();
    const enContent = await sdk
      .query<ISection>('sections')
      .locale('en')
      .first();
    console.log('TR Başlık:', trContent?.title);
    console.log('EN Başlık:', enContent?.title);

    // 4.2 Lokalizasyonlu -> Lokalizasyonsuz İlişki (Services -> References)
    console.log('\n--- Services -> References İlişkisi ---');
    const services = await sdk
      .query<IService>('services')
      .where('status', 'eq', 'publish')
      .include('reference')
      .get();
    console.log('Servisler ve Referansları:', services.data.map((s: IService) => ({
      service: s.title,
      referenceLogo: s._relations?.reference?.logo,
    })));

    // 4.3 Lokalizasyonsuz -> Lokalizasyonlu İlişki (Sociallinks -> Services)
    console.log('\n--- Sociallinks -> Services İlişkisi ---');
    const socialLinks = await sdk
      .query<ISocialLink>('sociallinks')
      .where('status', 'eq', 'publish')
      .include('service')
      .get();
    console.log('Sosyal Medya ve Servisler:', socialLinks.data.map((s: ISocialLink) => ({
      platform: s.icon,
      link: s.link,
      relatedService: s._relations?.service?.title,
    })));

    // 4.4 Lokalizasyonlu İlişkili İçerik - TR
    console.log('\n--- TR Dili İçin İlişkili İçerik ---');
    const trServices = await sdk
      .query<IService>('services')
      .locale('tr')
      .include('reference')
      .get();
    console.log('TR Servisler ve Referansları:', trServices.data.map((s: IService) => ({
      service: s.title,
      referenceLogo: s._relations?.reference?.logo,
    })));

    // 4.5 Lokalizasyonlu İlişkili İçerik - EN
    console.log('\n--- EN Dili İçin İlişkili İçerik ---');
    const enServices = await sdk
      .query<IService>('services')
      .locale('en')
      .include('reference')
      .get();
    console.log('EN Servisler ve Referansları:', enServices.data.map((s: IService) => ({
      service: s.title,
      referenceLogo: s._relations?.reference?.logo,
    })));

    console.log('\n=== 5. Önbellek Yönetimi ===');

    // 5.1 Önbellek Bypass
    console.log('\n--- Önbellek Bypass ---');
    const bypassCache = await sdk
      .query<IFaqItem>('faqitems')
      .bypassCache()
      .get();
    console.log('Önbellek Bypass ile Alınan Öğeler:', bypassCache.data.length);

    console.log('\n=== 6. Metadata ve Assets ===');

    // 6.1 Model Metadata
    console.log('\n--- Model Metadata ---');
    const modelData = await sdk.load<IService>('services');
    console.log('Services:', modelData);

    // Markdown içeriğini oluştur
    const markdownContent = `
# Contentrain SDK Test Sonuçları

## 1. Temel Sorgular
### Filtreleme ve Sıralama
${workItems.data.map((item: IWorkItem) => `- ${item.title} (Sıra: ${item.order})`).join('\n')}

### Sayfalama
${pagedItems.data.map((item: IWorkItem) => `- ${item.title}`).join('\n')}
Sayfalama: Limit ${pagedItems.pagination?.limit}, Offset ${pagedItems.pagination?.offset}

## 2. İlişki Sorguları
### Bire-Bir İlişki
${recentTestimonials.data.map((t: ITestimonialItem) => `- ${t.title} -> ${t._relations?.['creative-work']?.title}`).join('\n')}

### Bire-Çok İlişki
${tabItems.data.map((t: ITabItem) => `- ${t.description} -> ${t._relations?.category?.map((c: IWorkCategory) => c.category).join(', ')}`).join('\n')}

## 3. Gelişmiş Sorgular
### Çoklu Filtreler
${filteredServices.data.map((s: IWorkItem) => `- ${s.title} (Sıra: ${s.order}) - ${s.description.slice(0, 100)}...`).join('\n')}

### Dizi Operatörleri
${statusFiltered.data.map((item: IWorkItem) => `- ${item.title} (${item.status})`).join('\n')}

## 4. Çoklu Dil ve İlişki Senaryoları
### Farklı Dillerde İçerik
- TR: ${trContent?.title}
- EN: ${enContent?.title}

### Services -> References İlişkisi
${services.data.map((s: IService) => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}

### Sociallinks -> Services İlişkisi
${socialLinks.data.map((s: ISocialLink) => `- ${s.icon} (${s.link}) -> ${s._relations?.service?.title}`).join('\n')}

### TR Dili İçin İlişkili İçerik
${trServices.data.map((s: IService) => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}

### EN Dili İçin İlişkili İçerik
${enServices.data.map(s => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}

## 5. Önbellek Yönetimi
- Bypass Sonuçları: ${bypassCache.data.length} öğe

## 6. Metadata ve Assets
- Services: ${JSON.stringify(modelData, null, 2)}
`;

    // Markdown çıktısı için doğru path
    await writeFile(
      join(outputDir, 'json-output.md'),
      markdownContent,
      'utf8',
    );

    console.log('\nSonuçlar json-output.md dosyasına yazıldı.');
  }
  catch (error) {
    console.error('JSON Query Error:', error);
    throw error;
  }
}
