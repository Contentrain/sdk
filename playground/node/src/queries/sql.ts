import type { ContentrainStatus, IDBRecord } from '@contentrain/query';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QueryFactory, SQLiteLoader } from '@contentrain/query';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Model tipleri
interface WorkItem extends IDBRecord {
    title: string
    description: string
    image: string
    category_id: string
    link: string
    status: ContentrainStatus
    created_at: string
    updated_at: string
    field_order: number
    _relations?: {
        category: WorkCategory
    }
}

interface WorkCategory extends IDBRecord {
    category: string
    status: ContentrainStatus
    created_at: string
    updated_at: string
    field_order: number
}

interface TabItem extends IDBRecord {
    image: string
    link: string
    description: string
    status: ContentrainStatus
    category_id: string
    created_at: string
    updated_at: string
    _relations?: {
        category: WorkCategory[]
    }
}

interface TestimonialItem extends IDBRecord {
    name: string
    description: string
    title: string
    image: string
    creative_work_id: string
    status: ContentrainStatus
    created_at: string
    updated_at: string
    _relations?: {
        'creative-work': WorkItem
    }
}

interface Reference extends IDBRecord {
    logo: string
    status: ContentrainStatus
    created_at: string
    updated_at: string
}

interface Service extends IDBRecord {
    title: string
    description: string
    reference_id: string
    status: ContentrainStatus
    created_at: string
    updated_at: string
    _relations?: {
        reference: Reference
    }
}

interface FaqItem extends IDBRecord {
    question: string
    answer: string
    status: ContentrainStatus
    created_at: string
    updated_at: string
    field_order: number
}

interface SocialLink extends IDBRecord {
    link: string
    icon: string
    service_id: string
    status: ContentrainStatus
    created_at: string
    updated_at: string
    _relations?: {
        service: Service
    }
}

export async function sqlQueryExample() {
    try {
    // Dizin yapısını oluştur
        const outputDir = join(__dirname, '../outputs');
        const dbDir = join(outputDir, 'db');
        const markdownsDir = join(outputDir, 'markdowns');

        await mkdir(dbDir, { recursive: true });
        await mkdir(markdownsDir, { recursive: true });
        const dbPath = join(dbDir, 'contentrain.db');
        // SQLite loader'ı oluştur
        const loader = new SQLiteLoader({
            databasePath: dbPath,
            cache: true,
            maxCacheSize: 100,
            defaultLocale: 'tr',
        });

        // Loader'ı QueryFactory'ye set et
        QueryFactory.setLoader(loader);

        // Builder'ları oluştur
        const workItemsBuilder = QueryFactory.createSQLiteBuilder<WorkItem>('workitems');
        const testimonialBuilder = QueryFactory.createSQLiteBuilder<TestimonialItem>('testimonial-items');
        const tabItemBuilder = QueryFactory.createSQLiteBuilder<TabItem>('tabitems');
        const serviceBuilder = QueryFactory.createSQLiteBuilder<Service>('services');
        const faqBuilder = QueryFactory.createSQLiteBuilder<FaqItem>('faqitems');
        const categoryBuilder = QueryFactory.createSQLiteBuilder<WorkCategory>('workcategories');
        const socialLinksBuilder = QueryFactory.createSQLiteBuilder<SocialLink>('sociallinks');
        const referencesBuilder = QueryFactory.createSQLiteBuilder<Reference>('references');

        console.log('\n=== 1. Dil Sorguları Örnekleri ===');

        // 1.1 Aynı içeriğin farklı dillerdeki versiyonları
        const trServices = await serviceBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .include('reference')
            .get();

        const enServices = await serviceBuilder
            .locale('en')
            .where('status', 'eq', 'publish')
            .include('reference')
            .get();

        console.log('TR/EN Servis Karşılaştırması:', trServices.data.map((trItem: Service, index: number) => ({
            tr_title: trItem.title,
            en_title: enServices.data[index]?.title,
        })));

        console.log('\n=== 2. Bire-Bir İlişki Örnekleri ===');

        // 2.1 Work Items -> Categories (Bire-bir)
        const workItems = await workItemsBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .include('category')
            .get();

        console.log('İş Öğeleri ve Kategorileri:', workItems.data.map((item: WorkItem) => ({
            title: item.title,
            category: item._relations?.category?.category,
        })));

        // 2.2 Services -> References (Bire-bir)
        const servicesWithRefs = await serviceBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .where('reference_id', 'ne', '')
            .include('reference')
            .get();

        console.log('Servisler ve Referansları:', servicesWithRefs.data.map((item: Service) => ({
            title: item.title,
            reference_logo: item._relations?.reference?.logo,
        })));

        console.log('\n=== 3. Bire-Çok İlişki Örnekleri ===');

        // 3.1 TabItems -> Categories (Bire-çok)
        const tabItemsMultiCategory = await tabItemBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .include('category')
            .get();

        console.log('Tab Items ve Çoklu Kategorileri:', tabItemsMultiCategory.data.map((item: TabItem) => ({
            description: item.description,
            categories: item._relations?.category?.map((c: WorkCategory) => c.category),
        })));

        console.log('\n=== 4. Gelişmiş Filtreleme Örnekleri ===');

        // 4.1 Belirli bir kategorideki ve "platform" içeren işler
        const platformProjects = await workItemsBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .where('description', 'contains', 'platform')
            .include('category')
            .get();

        console.log('Platform İçeren Projeler:', platformProjects.data.map((item: WorkItem) => ({
            title: item.title,
            category: item._relations?.category?.category,
        })));

        // 4.2 Frontend ve Backend kategorilerindeki tab items
        const devTools = await tabItemBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .where('category_id', 'in', ['cab37361e7e6', 'cab37361e7e7']) // Frontend ve Backend kategorileri
            .include('category')
            .get();

        console.log('Geliştirme Araçları:', devTools.data.map((item: TabItem) => ({
            title: item.description,
            categories: item._relations?.category?.map((c: WorkCategory) => c.category),
        })));

        // 4.3 Son eklenen testimonial'lar
        const recentTestimonials = await testimonialBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .orderBy('created_at', 'desc')
            .limit(3)
            .include({
                relation: 'creative-work',
                locale: 'tr',
            })
            .get();

        console.log('Son Eklenen Referanslar:', recentTestimonials.data.map((item: TestimonialItem) => ({
            name: item.name,
            project: item._relations?.['creative-work']?.title,
            created_at: item.created_at,
        })));

        // 4.4 Sıralı SSS öğeleri (Çevirisiz örnek)
        const faqItems = await faqBuilder
            .where('status', 'eq', 'publish')
            .orderBy('field_order', 'asc')
            .locale('tr')
            .get();

        console.log('SSS (Çevirisiz):', faqItems.data.map((item: FaqItem) => ({
            question: item.question,
            answer: item.answer,
            order: item.field_order,
        })));

        // 4.5 Kategorilerin sıralı listesi
        const categories = await categoryBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .orderBy('field_order', 'asc')
            .get();

        console.log('Kategoriler:', categories.data.map((item: WorkCategory) => ({
            category: item.category,
            order: item.field_order,
        })));

        console.log('\n=== 5. Sosyal Medya ve Referans Örnekleri ===');

        // 5.1 Sosyal medya linkleri ve ilişkili servisler
        const socialLinks = await socialLinksBuilder
            .where('status', 'eq', 'publish')
            .include({
                relation: 'service',
                locale: 'tr',
            })
            .get();

        console.log('Sosyal Medya Linkleri:', socialLinks.data.map((item: SocialLink) => ({
            link: item.link,
            icon: item.icon,
            service: item._relations?.service?.title,
        })));

        // 5.2 Referanslar ve ilişkili servisler
        const references = await referencesBuilder
            .where('status', 'eq', 'publish')
            .get();

        const servicesWithReferences = await serviceBuilder
            .locale('tr')
            .where('status', 'eq', 'publish')
            .where('reference_id', 'in', references.data.map((ref: Reference) => ref.id))
            .include('reference')
            .get();

        console.log('Referanslar ve Servisler:', servicesWithReferences.data.map(item => ({
            service: item.title,
            reference_logo: item._relations?.reference?.logo,
        })));

        // Markdown içeriğini oluştur
        const markdownContent = `
# SQLite Sorgu Test Sonuçları

## 1. Dil Sorguları Örnekleri

### TR/EN Servis Karşılaştırması
${trServices.data.map((trItem: Service, index: number) => `- **${trItem.title}** / **${enServices.data[index]?.title}**
  - TR: ${trItem.description}
  - EN: ${enServices.data[index]?.description}
`).join('\n')}

## 2. Bire-Bir İlişki Örnekleri

### Work Items ve Kategorileri
${workItems.data.map((item: WorkItem) => `- **${item.title}**
  - Kategori: ${item._relations?.category?.category}
  - Açıklama: ${item.description}
`).join('\n')}

### Servisler ve Referansları
${servicesWithRefs.data.map((item: Service) => `- **${item.title}**
  - Referans: ${item._relations?.reference?.logo}
  - Açıklama: ${item.description}
`).join('\n')}

## 3. Bire-Çok İlişki Örnekleri

### Tab Items ve Çoklu Kategorileri
${tabItemsMultiCategory.data.map((item: TabItem) => `- **${item.id}**
  - Kategoriler: ${item._relations?.category?.map((c: WorkCategory) => c.category).join(', ')}
  - Açıklama: ${item.description}
  - Link: ${item.link}
`).join('\n')}

## 4. Gelişmiş Filtreleme Örnekleri

### Platform İçeren Projeler
${platformProjects.data.map((item: WorkItem) => `- **${item.title}**
  - Kategori: ${item._relations?.category?.category}
  - Açıklama: ${item.description}
`).join('\n')}

### Geliştirme Araçları (Frontend ve Backend)
${devTools.data.map((item: TabItem) => `- **${item.description}**
  - Kategoriler: ${item._relations?.category?.map((c: WorkCategory) => c.category).join(', ')}
  - Açıklama: ${item.description}
`).join('\n')}

### Son Eklenen Referanslar
${recentTestimonials.data.map((item: TestimonialItem) => `- **${item.name}**
  - İlişkili Proje: ${item._relations?.['creative-work']?.title}
  - Eklenme Tarihi: ${item.created_at}
  - Yorum: ${item.description}
`).join('\n')}

### SSS Öğeleri (Çevirisiz Örnek)
${faqItems.data.map((item: FaqItem) => `- **${item.field_order}. ${item.question}**
  - Cevap: ${item.answer}
`).join('\n')}

### Kategoriler
${categories.data.map((item: WorkCategory) => `- **${item.category}**
  - Sıra: ${item.field_order}
`).join('\n')}

## 5. Sosyal Medya ve Referans Örnekleri

### Sosyal Medya Linkleri ve Servisler
${socialLinks.data.map((item: SocialLink) => `- **${item._relations?.service.title}**
  - Link: ${item.link}
  - İkon: ${item.icon}
`).join('\n')}

### Referanslar ve İlişkili Servisler
${servicesWithReferences.data.map(item => `- **${item.title}**
  - Logo: ${item._relations?.reference?.logo}
  - Açıklama: ${item.description}
`).join('\n')}
`;

        // Markdown dosyasını kaydet
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
}
