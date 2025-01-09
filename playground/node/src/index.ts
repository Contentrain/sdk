import type { BaseContentrainType } from '@contentrain/core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ContentrainSDK from '@contentrain/core';

// SDK'yı yapılandır
const sdk = new ContentrainSDK({
  contentDir: join(__dirname, '../contentrain'),
  defaultLocale: 'tr',
  cache: true,
  ttl: 60 * 1000,
  maxCacheSize: 100,
});

// Tip tanımlamaları
interface IProcessItems extends BaseContentrainType {
  title: string
  description: string
  icon: string
}

interface IWorkItem extends BaseContentrainType {
  title: string
  description: string
  image: string
  category: IWorkCategory
  link: string
  order: number
}

interface IWorkCategory extends BaseContentrainType {
  category: string
  order: number
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
  'creative-work': IWorkItem
}

async function main() {
  try {
    // Tüm sorguları çalıştır
    const processes = await sdk.query<IProcessItems>('processes')
      .orderBy('title', 'asc')
      .limit(3)
      .get();

    const workItems = await sdk.query<IWorkItem>('workitems')
      .include('category')
      .orderBy('order', 'asc')
      .get();

    const publishedFaqs = await sdk.query<IFaqItem>('faqitems')
      .where('status', 'eq', 'publish')
      .orderBy('order', 'asc')
      .get();

    const metaTags = await sdk.query<IMetaTag>('meta-tags')
      .where('name', 'startsWith', 'og')
      .get();

    const testimonails = await sdk.query<ITestimonialItem>('testimonail-items')
      .locale('en')
      .include('creative-work')
      .where('status', 'eq', 'publish')
      .get();

    const filteredWorks = await sdk.query<IWorkItem>('workitems')
      .where('status', 'eq', 'publish')
      .where('order', 'gt', 0)
      .orderBy('order', 'asc')
      .limit(5)
      .get();

    const singleWork = await sdk.query<IWorkItem>('workitems').locale('tr').where('ID', 'eq', '1a01328952b4').include('category').first();

    const englishContent = await sdk.query<IProcessItems>('processes')
      .locale('en')
      .get();
    const turkishContent = await sdk.query<IProcessItems>('processes')
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

    console.log('Tüm sorgu sonuçları query-results.md dosyasına yazıldı.');
  }
  catch (error) {
    console.error('Hata:', error);
  }
}

// Ana fonksiyonu çalıştır ve hataları yakala
main().catch((error) => {
  console.error('Beklenmeyen hata:', error);
});
