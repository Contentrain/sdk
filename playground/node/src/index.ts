import type { BaseContentrainType, QueryConfig } from '@contentrain/core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ContentrainSDK } from '@contentrain/core';

// Base Model Tipleri
interface IProcessItems extends BaseContentrainType {
  title: string
  description: string
  icon: string
}

interface IWorkCategory extends BaseContentrainType {
  category: string
  order: number
}

interface IWorkItem extends BaseContentrainType {
  title: string
  description: string
  image: string
  category: string
  link: string
  order: number
  _relations: {
    category: IWorkCategory
  }
}

interface IFaqItem extends BaseContentrainType {
  question: string
  answer: string
  order: number
}

interface IMetaTag extends BaseContentrainType {
  name: string
  content: string
  description: string
}

interface ITestimonialItem extends BaseContentrainType {
  'name': string
  'description': string
  'title': string
  'image': string
  'creative-work': string
  '_relations': {
    'creative-work': IWorkItem
  }
}

// Query Config Tipleri
interface IProcessItemsQuery extends QueryConfig<
  IProcessItems,
  'en' | 'tr',
  Record<string, never>
> {}

interface IWorkItemQuery extends QueryConfig<
  IWorkItem,
  'en' | 'tr',
  { category: IWorkCategory }
> {}

interface IFaqItemQuery extends QueryConfig<
  IFaqItem,
  'en' | 'tr',
  Record<string, never>
> {}

interface IMetaTagQuery extends QueryConfig<
  IMetaTag,
  'en' | 'tr',
  Record<string, never>
> {}

interface ITestimonialItemQuery extends QueryConfig<
  ITestimonialItem,
  'en' | 'tr',
  { 'creative-work': IWorkItem }
> {}

// SDK'yı yapılandır
const sdk = new ContentrainSDK({
  contentDir: join(__dirname, '../../contentrain'),
  defaultLocale: 'tr',
  cache: true,
  ttl: 60 * 1000,
  maxCacheSize: 100,
});

async function main() {
  try {
    // Tüm sorguları çalıştır
    const processes = await sdk.query<IProcessItemsQuery>('processes')
      .orderBy('title', 'asc')
      .limit(3)
      .get();

    const workItems = await sdk.query<IWorkItemQuery>('workitems')
      .include('category')
      .orderBy('order', 'asc')
      .get();

    const publishedFaqs = await sdk.query<IFaqItemQuery>('faqitems')
      .where('status', 'eq', 'publish')
      .orderBy('order', 'asc')
      .get();

    const metaTags = await sdk.query<IMetaTagQuery>('meta-tags')
      .where('name', 'startsWith', 'og')
      .get();

    const testimonails = await sdk.query<ITestimonialItemQuery>('testimonail-items')
      .locale('en')
      .include('creative-work')
      .where('status', 'eq', 'publish')
      .get();

    let lang: 'en' | 'tr' = 'en';
    async function changeLangTest(lang: 'en' | 'tr') {
      const testimonails = await sdk.query<ITestimonialItemQuery>('testimonail-items')
        .locale(lang)
        .include('creative-work')
        .where('status', 'eq', 'publish')
        .get();
      console.log(testimonails);
    }

    const intervalId = setInterval(() => {
      lang = lang === 'en' ? 'tr' : 'en';
      changeLangTest(lang).catch(console.error);
    }, 1000);
    clearInterval(intervalId);
    const filteredWorks = await sdk.query<IWorkItemQuery>('workitems')
      .where('status', 'eq', 'publish')
      .where('order', 'gt', 0)
      .orderBy('order', 'asc')
      .limit(5)
      .get();

    const singleWork = await sdk.query<IWorkItemQuery>('workitems')
      .locale('tr')
      .where('ID', 'eq', '1a01328952b4')
      .include('category')
      .first();

    const englishContent = await sdk.query<IProcessItemsQuery>('processes')
      .locale('en')
      .get();

    const turkishContent = await sdk.query<IProcessItemsQuery>('processes')
      .locale('tr')
      .get();

    // Markdown içeriğini oluştur
    const markdown = `# Contentrain SDK Sorgu Örnekleri ve Sonuçları

## Örnek 1: Süreçleri Başlığa Göre Sıralama ve Limit Uygulama
\`\`\`typescript
sdk.query<IProcessItems>('processes')
  .orderBy('title', 'asc')
  .limit(3)
  .get();
\`\`\`

<results>
${JSON.stringify(processes.data, null, 2)}
</results>

## Örnek 2: İş Öğeleri ve Kategorilerini Çekme
\`\`\`typescript
sdk.query<IWorkItem>('workitems')
  .include('category')
  .orderBy('order', 'asc')
  .get();
\`\`\`

<results>
${JSON.stringify(workItems.data, null, 2)}
</results>

## Örnek 3: Yayındaki SSS Öğelerini Filtreleme
\`\`\`typescript
sdk.query<IFaqItem>('faqitems')
  .where('status', 'eq', 'publish')
  .orderBy('order', 'asc')
  .get();
\`\`\`

<results>
${JSON.stringify(publishedFaqs.data, null, 2)}
</results>

## Örnek 4: 'og' ile Başlayan Meta Etiketlerini Filtreleme
\`\`\`typescript
sdk.query<IMetaTag>('meta-tags')
  .where('name', 'startsWith', 'og')
  .get();
\`\`\`

<results>
${JSON.stringify(metaTags.data, null, 2)}
</results>

## Örnek 5: İngilizce Referansları ve İlişkili İş Öğelerini Çekme
\`\`\`typescript
sdk.query<ITestimonialItem>('testimonail-items')
  .locale('en')
  .where('status', 'eq', 'publish')
  .get();
\`\`\`

<results>
${JSON.stringify(testimonails.data, null, 2)}
</results>

## Örnek 6: Yayındaki ve Sırası 0'dan Büyük İş Öğelerini Filtreleme
\`\`\`typescript
sdk.query<IWorkItem>('workitems')
  .where('status', 'eq', 'publish')
  .where('order', 'gt', 0)
  .orderBy('order', 'asc')
  .limit(5)
  .get();
\`\`\`

<results>
${JSON.stringify(filteredWorks.data, null, 2)}
</results>

## Örnek 7: ID'si 1 Olan Tekil İş Öğesini Çekme
\`\`\`typescript
sdk.query<IWorkItem>('workitems')
  .where('ID', 'eq', 'b770c71013d2')
  .include('category')
  .first();
\`\`\`

<results>
${JSON.stringify(singleWork, null, 2)}
</results>

## Örnek 8: İngilizce Süreçleri Çekme
\`\`\`typescript
sdk.query<IProcessItems>('processes')
  .locale('en')
  .get();
\`\`\`

<results>
${JSON.stringify(englishContent.data, null, 2)}
</results>

## Örnek 9: Türkçe Süreçleri Çekme
\`\`\`typescript
sdk.query<IProcessItems>('processes')
  .locale('tr')
  .get();
\`\`\`

<results>
${JSON.stringify(turkishContent.data, null, 2)}
</results>


`;

    // Markdown dosyasına yaz
    writeFileSync(
      join(__dirname, 'query-results.md'),
      markdown,
      'utf-8',
    );

    console.log('All query results have been written to query-results.md file.');
  }
  catch (error) {
    console.error('Error:', error);
  }
}

// Ana fonksiyonu çalıştır ve hataları yakala
main().catch((error) => {
  console.error('Beklenmeyen hata:', error);
});
