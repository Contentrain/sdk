import type { BaseContentrainType, QueryConfig } from '@contentrain/query';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exit } from 'node:process';
import { ContentrainSDK } from '@contentrain/query';

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

interface ISocialLink extends BaseContentrainType {
  icon: string
  link: string
}

// Query Config tipleri
interface IWorkItemQuery extends QueryConfig<IWorkItem, 'en' | 'tr', { category: IWorkCategory }> {}
interface ITabItemQuery extends QueryConfig<ITabItem, 'en' | 'tr', { category: IWorkCategory }> {}
interface IFaqItemQuery extends QueryConfig<IFaqItem, 'en' | 'tr'> {}
interface ITestimonialItemQuery extends QueryConfig<ITestimonialItem, 'en' | 'tr', { 'creative-work': IWorkItem }> {}
interface ISectionQuery extends QueryConfig<ISection, 'en' | 'tr'> {}
interface ISocialLinkQuery extends QueryConfig<ISocialLink> {}

// SDK'yı başlat
const sdk = new ContentrainSDK({
  contentDir: join(__dirname, '../../contentrain'),
  defaultLocale: 'tr',
  cache: true,
  ttl: 60 * 1000,
  maxCacheSize: 100,
});

async function main() {
  try {
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
      .query<ITestimonialItemQuery>('testimonail-items')
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

    console.log('\n=== 4. Çoklu Dil Desteği ===');

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

    // 4.2 Lokalize Olmayan Model
    console.log('\n--- Lokalize Olmayan Model ---');
    const socialLinks = await sdk
      .query<ISocialLinkQuery>('sociallinks')
      .where('status', 'eq', 'publish')
      .orderBy('icon', 'asc')
      .get();
    console.log('Sosyal Medya Linkleri:', socialLinks.data.length);

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

## 4. Çoklu Dil Desteği
### Lokalize İçerik
- TR: ${trContent?.title}
- EN: ${enContent?.title}

### Lokalize Olmayan İçerik
${socialLinks.data.map(link => `- ${link.icon}: ${link.link}`).join('\n')}

## 5. Önbellek Yönetimi
- Bypass Sonuçları: ${bypassCache.data.length} öğe

## 6. Metadata ve Assets
- Model: ${JSON.stringify(modelData.model.metadata, null, 2)}
- Assets: ${modelData.assets?.length} adet
`;

    await writeFile(join(__dirname, './output.md'), markdownContent);
    console.log('\nSonuçlar output.md dosyasına yazıldı.');
  }
  catch (error) {
    console.error('Hata:', error);
  }
}

void main().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  exit(1);
});
