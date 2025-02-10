import type { BaseContentrainType, QueryConfig } from '@contentrain/query';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentLoader, ContentrainSDK } from '@contentrain/query';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Model tipleri
interface IWorkItem extends BaseContentrainType {
  title: string
  description: string
  image: string
  category: string
  link: string
  order: number
}

interface IWorkCategory extends BaseContentrainType {
  category: string
  order: number
}

interface ITabItem extends BaseContentrainType {
  title: string
  description: string
  order: number
  category: string[]
  _relations?: {
    category: IWorkCategory[]
  }
}

interface IFaqItem extends BaseContentrainType {
  question: string
  answer: string
  order: number
}

interface ITestimonialItem extends BaseContentrainType {
  'name': string
  'description': string
  'title': string
  'image': string
  'creative-work': string
  '_relations'?: {
    'creative-work': IWorkItem
  }
}

interface ISection extends BaseContentrainType {
  title: string
  description: string
  buttonText?: string
  buttonLink?: string
  name: string
  subtitle?: string
}

interface IReference extends BaseContentrainType {
  logo: string
}

interface IService extends BaseContentrainType {
  title: string
  description: string
  reference: string
  _relations?: {
    reference: IReference
  }
}

interface ISocialLink extends BaseContentrainType {
  icon: string
  link: string
  service?: string
  _relations?: {
    service: IService
  }
}

// Query Config tipleri
interface IWorkItemQuery extends QueryConfig<IWorkItem, 'en' | 'tr', { category: IWorkCategory }> {}
interface ITabItemQuery extends QueryConfig<ITabItem, 'en' | 'tr', { category: IWorkCategory }> {}
interface IFaqItemQuery extends QueryConfig<IFaqItem, 'en' | 'tr'> {}
interface ITestimonialItemQuery extends QueryConfig<ITestimonialItem, 'en' | 'tr', { 'creative-work': IWorkItem }> {}
interface ISectionQuery extends QueryConfig<ISection, 'en' | 'tr'> {}
interface ISocialLinkQuery extends QueryConfig<ISocialLink, never, { service: IService }> {}
interface IServiceQuery extends QueryConfig<IService, 'en' | 'tr', { reference: IReference }> {}

// SDK'yı başlat
const sdk = new ContentrainSDK({
  contentDir: join(__dirname, '../../../contentrain'),
  defaultLocale: 'tr',
  cache: true,
  ttl: 60 * 1000,
  maxCacheSize: 100,
});

const loader = new ContentLoader({
  contentDir: join(__dirname, '../../../contentrain'),
  defaultLocale: 'en',
  cache: true,
});

export async function jsonQueryExample() {
  try {
    // Çıktı dizinini oluştur
    const outputDir = join(__dirname, '../outputs/markdowns');
    await mkdir(outputDir, { recursive: true });

    console.log('\n=== 1. Temel Sorgular ===');

    // 1.1 Filtreleme ve Sıralama
    console.log('\n--- Filtreleme ve Sıralama ---');
    const workItems = await sdk
      .query<IWorkItemQuery>('workitems')
      .where('status', 'eq', 'publish')
      .where('order', 'lt', 5)
      .orderBy('order', 'asc')
      .get();
    console.log('Filtrelenmiş İş Öğeleri:', workItems.data.length);

    // 1.2 Sayfalama
    console.log('\n--- Sayfalama ---');
    const pagedItems = await sdk
      .query<IWorkItemQuery>('workitems')
      .limit(3)
      .offset(1)
      .get();
    console.log('Sayfalanmış Öğeler:', pagedItems.data.length);
    console.log('Sayfalama Bilgisi:', pagedItems.pagination);

    console.log('\n=== 2. İlişki Sorguları ===');

    // 2.1 Bire-Bir İlişki
    console.log('\n--- Bire-Bir İlişki ---');
    const testimonials = await sdk
      .query<ITestimonialItemQuery>('testimonial-items')
      .include('creative-work')
      .get();
    console.log('Referanslar ve İlişkili İşler:', testimonials.data.map(t => ({
      title: t.title,
      work: t._relations?.['creative-work']?.title,
    })));

    // 2.2 Bire-Çok İlişki
    console.log('\n--- Bire-Çok İlişki ---');
    const tabItems = await sdk
      .query<ITabItemQuery>('tabitems')
      .where('status', 'eq', 'publish')
      .include('category')
      .get();
    console.log('Tab Öğeleri ve Kategorileri:', tabItems.data.map(t => ({
      description: t.description,
      categories: t._relations?.category?.map(c => c.category),
    })));

    console.log('\n=== 3. Gelişmiş Sorgular ===');

    // 3.1 Çoklu Filtreler
    console.log('\n--- Çoklu Filtreler ---');
    const filteredServices = await sdk
      .query<IWorkItemQuery>('workitems')
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
      .query<IWorkItemQuery>('workitems')
      .where('status', 'in', ['publish', 'draft'])
      .get();
    console.log('Durum Filtrelenmiş Öğeler:', statusFiltered.data.length);

    console.log('\n=== 4. Çoklu Dil ve İlişki Senaryoları ===');

    // 4.1 Farklı Dillerde İçerik
    console.log('\n--- Farklı Dillerde İçerik ---');
    const trContent = await sdk
      .query<ISectionQuery>('sections')
      .locale('tr')
      .first();
    const enContent = await sdk
      .query<ISectionQuery>('sections')
      .locale('en')
      .first();
    console.log('TR Başlık:', trContent?.title);
    console.log('EN Başlık:', enContent?.title);

    // 4.2 Lokalizasyonlu -> Lokalizasyonsuz İlişki (Services -> References)
    console.log('\n--- Services -> References İlişkisi ---');
    const services = await sdk
      .query<IServiceQuery>('services')
      .where('status', 'eq', 'publish')
      .include('reference')
      .get();
    console.log('Servisler ve Referansları:', services.data.map(s => ({
      service: s.title,
      referenceLogo: s._relations?.reference?.logo,
    })));

    // 4.3 Lokalizasyonsuz -> Lokalizasyonlu İlişki (Sociallinks -> Services)
    console.log('\n--- Sociallinks -> Services İlişkisi ---');
    const socialLinks = await sdk
      .query<ISocialLinkQuery>('sociallinks')
      .where('status', 'eq', 'publish')
      .include('service')
      .get();
    console.log('Sosyal Medya ve Servisler:', socialLinks.data.map(s => ({
      platform: s.icon,
      link: s.link,
      relatedService: s._relations?.service?.title,
    })));

    // 4.4 Lokalizasyonlu İlişkili İçerik - TR
    console.log('\n--- TR Dili İçin İlişkili İçerik ---');
    const trServices = await sdk
      .query<IServiceQuery>('services')
      .locale('tr')
      .include('reference')
      .get();
    console.log('TR Servisler ve Referansları:', trServices.data.map(s => ({
      service: s.title,
      referenceLogo: s._relations?.reference?.logo,
    })));

    // 4.5 Lokalizasyonlu İlişkili İçerik - EN
    console.log('\n--- EN Dili İçin İlişkili İçerik ---');
    const enServices = await sdk
      .query<IServiceQuery>('services')
      .locale('en')
      .include('reference')
      .get();
    console.log('EN Servisler ve Referansları:', enServices.data.map(s => ({
      service: s.title,
      referenceLogo: s._relations?.reference?.logo,
    })));

    console.log('\n=== 5. Önbellek Yönetimi ===');

    // 5.1 Önbellek Bypass
    console.log('\n--- Önbellek Bypass ---');
    const bypassCache = await sdk
      .query<IFaqItemQuery>('faqitems')
      .bypassCache()
      .get();
    console.log('Önbellek Bypass ile Alınan Öğeler:', bypassCache.data.length);

    console.log('\n=== 6. Metadata ve Assets ===');

    // 6.1 Model Metadata
    console.log('\n--- Model Metadata ---');
    const modelData = await sdk.load('workitems');
    console.log('Model Metadata:', modelData.model.metadata);

    // 6.2 Assets
    console.log('\n--- Assets ---');
    console.log('Assets Sayısı:', modelData.assets?.length);

    // Test için services modelini yükleyelim
    const servicesModel = await loader.load<IService>('services');
    console.log('Services:', servicesModel);

    // Sonuçları dosyaya yaz
    const markdownContent = `
# Contentrain SDK Test Sonuçları

## 1. Temel Sorgular
### Filtreleme ve Sıralama
${workItems.data.map(item => `- ${item.title} (Sıra: ${item.order})`).join('\n')}

### Sayfalama
${pagedItems.data.map(item => `- ${item.title}`).join('\n')}
Sayfalama: Limit ${pagedItems.pagination?.limit}, Offset ${pagedItems.pagination?.offset}

## 2. İlişki Sorguları
### Bire-Bir İlişki
${testimonials.data.map(t => `- ${t.title} -> ${t._relations?.['creative-work']?.title}`).join('\n')}

### Bire-Çok İlişki
${tabItems.data.map(t => `- ${t.description} -> ${t._relations?.category?.map(c => c.category).join(', ')}`).join('\n')}

## 3. Gelişmiş Sorgular
### Çoklu Filtreler
${filteredServices.data.map(s => `- ${s.title} (Sıra: ${s.order}) - ${s.description.slice(0, 100)}...`).join('\n')}

### Dizi Operatörleri
${statusFiltered.data.map(item => `- ${item.title} (${item.status})`).join('\n')}

## 4. Çoklu Dil ve İlişki Senaryoları
### Farklı Dillerde İçerik
- TR: ${trContent?.title}
- EN: ${enContent?.title}

### Services -> References İlişkisi
${services.data.map(s => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}

### Sociallinks -> Services İlişkisi
${socialLinks.data.map(s => `- ${s.icon} (${s.link}) -> ${s._relations?.service?.title}`).join('\n')}

### TR Dili İçin İlişkili İçerik
${trServices.data.map(s => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}

### EN Dili İçin İlişkili İçerik
${enServices.data.map(s => `- ${s.title} -> ${s._relations?.reference?.logo}`).join('\n')}

## 5. Önbellek Yönetimi
- Bypass Sonuçları: ${bypassCache.data.length} öğe

## 6. Metadata ve Assets
- Model: ${JSON.stringify(modelData.model.metadata, null, 2)}
- Assets: ${modelData.assets?.length} adet
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
