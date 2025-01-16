import type { BaseContentrainType, QueryConfig } from '@contentrain/query';
import { readFile, writeFile } from 'node:fs/promises';
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
interface IWorkCategories extends BaseContentrainType {
  category: string
  order: number
}

interface ITabItem extends BaseContentrainType {
  title: string
  description: string
  order: number
  category: string[]
  _relations: {
    category: IWorkCategories[]
  }
}

interface IFaqItem extends BaseContentrainType {
  title: string
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
}

// Query Config tipleri
interface IWorkItemQuery extends QueryConfig<IWorkItem, 'en' | 'tr', { category: IWorkItem }> {}
interface ITabItemQuery extends QueryConfig<ITabItem, 'en' | 'tr', { category: IWorkItem }> {}
interface IFaqItemQuery extends QueryConfig<IFaqItem, 'en' | 'tr'> {}
interface ITestimonialItemQuery extends QueryConfig<ITestimonialItem, 'en' | 'tr', { 'creative-work': IWorkItem }> {}

// SDK'yı başlat
const sdk = new ContentrainSDK({
  contentDir: join(__dirname, '../../contentrain'),
  defaultLocale: 'tr',
});

async function main() {
  try {
    // 1. Temel Sorgular - Türkçe İçerik
    console.log('\n--- Türkçe İş Öğeleri (Sıralı ve Limitli) ---');
    const workItems = await sdk
      .query<IWorkItemQuery>('workitems')
      .where('status', 'eq', 'publish')
      .orderBy('order', 'asc')
      .limit(5)
      .locale('tr')
      .get();
    console.log('Türkçe İş Öğeleri:', workItems.data.length);

    // 2. İngilizce İçerik ve İlişkiler
    console.log('\n--- İngilizce İş Öğeleri (Kategorileriyle) ---');
    const workItemsWithCategories = await sdk
      .query<IWorkItemQuery>('workitems')
      .where('status', 'eq', 'publish')
      .include('category')
      .locale('en')
      .get();
    console.log('İngilizce İş Öğeleri ve Kategorileri:', workItemsWithCategories.data.length);

    // 3. İç İçe İlişkiler
    console.log('\n--- Referanslar ve İlişkili İçerikler ---');
    const testimonials = await sdk
      .query<ITestimonialItemQuery>('testimonail-items')
      .include(['creative-work'])
      .locale('tr')
      .get();
    console.log('Referanslar:', testimonials.data.length);

    // 4. Çoklu Filtre ve Sıralama
    console.log('\n--- Filtrelenmiş ve Sıralı Tab Öğeleri ---');
    const tabItems = await sdk
      .query<ITabItemQuery>('tabitems')
      .where('status', 'eq', 'publish')
      .orderBy('order', 'asc')
      .include('category')
      .locale('tr')
      .get();
    console.log('Tab Öğeleri:', tabItems.data[0]._relations);

    // 5. Sayfalama ile Sorgu
    console.log('\n--- Sayfalanmış Servis Öğeleri ---');
    const services = await sdk
      .query<IWorkItemQuery>('services')
      .where('status', 'eq', 'publish')
      .offset(0)
      .limit(3)
      .locale('tr')
      .get();
    console.log('Servisler:', services.data.length);

    // 6. Metin Arama
    console.log('\n--- İçerikte Metin Arama ---');
    const searchResults = await sdk
      .query<IFaqItemQuery>('faqitems')
      .where('title', 'contains', 'nasıl')
      .locale('tr')
      .get();
    console.log('Arama Sonuçları:', searchResults.data.length);

    // 7. Metadata ve Assets
    console.log('\n--- Model Metadata ve Assets ---');
    const modelData = await sdk.load('workitems');
    console.log('Model Metadata:', modelData.model.metadata);
    console.log('Assets Sayısı:', modelData.assets?.length);

    const markdownContent = `
    # --- Türkçe İş Öğeleri (Sıralı ve Limitli) ---
    ${workItems.data.map(item => `- ${item.description}`).join('\n')}
    # --- İngilizce İş Öğeleri (Kategorileriyle) ---
    ${workItemsWithCategories.data.map(item => `- ${item.description}`).join('\n')}
    # --- Referanslar ve İlişkili İçerikler ---
    ${testimonials.data.map(item => `- ${item.title}`).join('\n')}
    # --- Filtrelenmiş ve Sıralı Tab Öğeleri ---
    ${tabItems.data.map(item => `- ${item._relations.category.map(category => category.order).join(', ')}`).join('\n')}
    # --- Sayfalanmış Servis Öğeleri ---
    ${services.data.map(item => `- ${item.title}`).join('\n')}
    # --- İçerikte Metin Arama ---
    ${searchResults.data.map(item => `- ${item.title}`).join('\n')}
    # --- Model Metadata ve Assets ---
    ${modelData.model.metadata}
    ${modelData.assets?.length}
    # --- Assets ---
    ${modelData.assets?.map(asset => `- ${asset.path}`).join('\n')}
    `;
    await writeFile(join(__dirname, './output.md'), markdownContent);
  }
  catch (error) {
    console.error('Hata:', error);
  }
}

// Promise zincirini düzelt
void main().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  // Hata durumunda programı sonlandır
  exit(1);
});
