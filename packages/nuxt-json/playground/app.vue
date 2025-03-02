<script setup lang="ts">
import type { FaqItems, ProjectStats, ServicesItems, SocialLinks, TabItems, TestimonialItems, WorkItems } from '#build/types/contentrain';

// === 1. Temel Sorgular ===
// 1.1 Filtreleme ve Sıralama
const { data: workItems } = await useAsyncData('workitems', () => {
    const query = useContentrainQuery<WorkItems>('workitems');
    return query
        .where('status', 'eq', 'publish')
        .orderBy('title', 'desc')
        .get();
});

// 1.2 Sayfalama
const { data: pagedWorkItems } = await useAsyncData('paged-work-items', () => {
    const query = useContentrainQuery<WorkItems>('workitems');
    return query
        .locale('tr')
        .limit(3)
        .offset(1)
        .get();
});

// === 2. İlişki Sorguları ===
// 2.1 Bire-Bir İlişkiler (Testimonial -> Work)
const { data: testimonials } = await useAsyncData('testimonials', () => {
    const query = useContentrainQuery<TestimonialItems>('testimonial-items');
    return query
        .include('creative-work')
        .locale('tr')
        .get();
});

// 2.2 Bire-Çok İlişkiler (TabItems -> WorkCategories)
const { data: tabItems } = await useAsyncData('tab-items', () => {
    const query = useContentrainQuery<TabItems>('tabitems');
    return query
        .locale('tr')
        .where('status', 'eq', 'publish')
        .include('category')
        .get();
});

// 2.3 Çoklu İlişkiler
const { data: projectStats } = await useAsyncData('project-stats', () => {
    const query = useContentrainQuery<ProjectStats>('project-stats');
    return query
        .include('work')
        .include('reference')
        .where('status', 'eq', 'publish')
        .get();
});

// 2.4 Servis ve Referans İlişkisi
const { data: services } = await useAsyncData('services', async () => {
    const query = useContentrainQuery<ServicesItems>('services');
    console.info('[Contentrain] Querying services with reference relation');

    const result = await query
        .include('reference')
        .where('status', 'eq', 'publish')
        .orderBy('title', 'asc')
        .locale('en')
        .get();

    console.info('[Contentrain] Services query result:', {
        total: result.total,
        hasRelations: result.data.some(item => item._relations?.reference),
    });

    return result;
});

// 2.5 Sosyal Medya ve Servis İlişkisi
const { data: socialLinks } = await useAsyncData('social-links', () => {
    const query = useContentrainQuery<SocialLinks>('sociallinks');
    return query
        .include('service')
        .where('status', 'eq', 'publish')
        .orderBy('icon', 'asc')
        .get();
});

// === 3. Gelişmiş Sorgular ===
// 3.1 Çoklu Filtreler
const { data: advancedFilteredItems } = await useAsyncData('advanced-filtered-items', () => {
    const query = useContentrainQuery<WorkItems>('workitems');
    return query
        .locale('tr')
        .where('status', 'eq', 'publish')
        .where('order', 'gt', 2)
        .where('order', 'lt', 6)
        .where('description', 'contains', 'platform')
        .orderBy('order', 'asc')
        .get();
});

// 3.2 Dizi Operatörleri
const { data: arrayFilteredItems } = await useAsyncData('array-filtered-items', async () => {
    // Her sorgu için yeni bir query builder oluştur
    const allItemsQuery = useContentrainQuery<WorkItems>('workitems');
    const filteredQuery = useContentrainQuery<WorkItems>('workitems');

    // Önce tüm workitems'ları alalım
    const allItems = await allItemsQuery.get();
    console.log('Tüm Work Items:', allItems);

    // Sonra filtrelenmiş sorguyu çalıştıralım
    const result = await filteredQuery
        .locale('tr')
        .where('status', 'ne', 'draft')
        .get();

    console.log('Dizi Operatörleri Sorgu Sonucu:', result);

    return result;
});

// 3.3 Array Operatörü Örneği
const { data: specificSocialLinks } = await useAsyncData('specific-social-links', () => {
    const query = useContentrainQuery<SocialLinks>('sociallinks');
    return query
        .where('icon', 'in', ['ri-twitter-line', 'ri-instagram-line', 'ri-linkedin-line'] as unknown as string)
        .where('status', 'eq', 'publish')
        .orderBy('icon', 'asc')
        .get();
});

// === 4. Çoklu Dil Desteği ===
// 4.1 Farklı Dillerde İçerik
const { data: trContent } = await useAsyncData('tr-content', async () => {
    // TR sorguları için yeni query builder'lar
    const allTrQuery = useContentrainQuery<WorkItems>('workitems');
    const trFirstQuery = useContentrainQuery<WorkItems>('workitems');

    // Önce tüm TR içeriği alalım
    const allTrItems = await allTrQuery.locale('tr').get();
    console.log('Tüm TR İçerik:', allTrItems);

    const result = await trFirstQuery
        .locale('tr')
        .first();

    console.log('TR İçerik Sorgu Sonucu:', result);

    return result;
});

const { data: enContent } = await useAsyncData('en-content', async () => {
    // EN sorguları için yeni query builder'lar
    const allEnQuery = useContentrainQuery<WorkItems>('workitems');
    const enFirstQuery = useContentrainQuery<WorkItems>('workitems');

    // Önce tüm EN içeriği alalım
    const allEnItems = await allEnQuery.locale('en').get();
    console.log('Tüm EN İçerik:', allEnItems);

    const result = await enFirstQuery
        .locale('en')
        .first();

    console.log('EN İçerik Sorgu Sonucu:', result);

    return result;
});

// 4.2 Lokalize Olmayan Model
const { data: socialLinks2 } = await useAsyncData('social-links-2', () => {
    const query = useContentrainQuery<SocialLinks>('sociallinks');
    return query
        .where('icon', 'eq', 'ri-instagram-line')
        .orderBy('icon', 'asc')
        .get();
});

const { data: faqItems } = await useAsyncData('faq-items', () => {
    const query = useContentrainQuery<FaqItems>('faqitems');
    return query
        .where('status', 'eq', 'publish')
        .orderBy('order', 'asc')
        .get();
});

// Debug için
console.log('Tüm Sorgular ve Sonuçları:', {
    'Temel Sorgular': {
        'Filtreleme ve Sıralama': workItems.value,
        'Sayfalama': pagedWorkItems.value,
    },
    'İlişki Sorguları': {
        'Bire-Bir İlişki (Testimonials)': testimonials.value,
        'Bire-Çok İlişki (Tab Items)': tabItems.value,
    },
    'Gelişmiş Sorgular': {
        'Çoklu Filtreler': advancedFilteredItems.value,
        'Dizi Operatörleri': arrayFilteredItems.value,
        'Array Operatörü Örneği': specificSocialLinks.value,
    },
    'Çoklu Dil Desteği': {
        'TR İçerik': trContent.value,
        'EN İçerik': enContent.value,
        'Lokalize Olmayan Model': {
            'Social Links': socialLinks.value,
            'Social Links 2': socialLinks2.value,
        },
    },
    'FAQ Items': faqItems.value,
});
</script>

<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-12 text-center">Contentrain SDK Test Senaryoları</h1>

    <!-- 1. Temel Sorgular -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 pb-2 border-b">1. Temel Sorgular</h2>

      <!-- 1.1 Filtreleme ve Sıralama -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">1.1 Filtreleme ve Sıralama</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="workItems?.data" class="grid gap-4">
            <div v-for="item in workItems.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <h4 class="font-medium">{{ item.title }}</h4>
              <p class="text-gray-600 text-sm">Sıra: {{ item.order }}</p>
              <p class="text-gray-500 mt-2">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 1.2 Sayfalama -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">1.2 Sayfalama</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="pagedWorkItems?.data" class="grid gap-4">
            <div v-for="item in pagedWorkItems.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <h4 class="font-medium">{{ item.title }}</h4>
              <p class="text-gray-600 text-sm">Sıra: {{ item.order }}</p>
              <p class="text-gray-500 mt-2">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. İlişki Sorguları -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 pb-2 border-b">2. İlişki Sorguları</h2>

      <!-- 2.1 Bire-Bir İlişki -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">2.1 Bire-Bir İlişki (Testimonials)</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="testimonials?.data" class="grid gap-6">
            <div v-for="item in testimonials.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4">
                <div>
                  <h4 class="font-medium">{{ item.name }}</h4>
                  <p class="text-gray-600 text-sm">{{ item.title }}</p>
                </div>
              </div>
              <p class="mt-4 text-gray-700">{{ item.description }}</p>
              <div v-if="item._relations?.['creative-work']" class="mt-4 text-sm">
                <p class="text-blue-600">
                  İlişkili Proje: {{ item._relations['creative-work'].title }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2.2 Bire-Çok İlişki -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">2.2 Bire-Çok İlişki (Tab Items)</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="tabItems?.data" class="grid gap-4">
            <div v-for="item in tabItems.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <h4 class="font-medium">{{ item.title }}</h4>
              <p class="text-gray-600 mt-2">{{ item.description }}</p>
              <div v-if="item._relations?.category" class="mt-4 flex gap-2 flex-wrap">
                <span v-for="cat in item._relations.category" :key="cat.ID"
                  class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {{ cat.category }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2.3 Çoklu İlişkiler -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">2.3 Çoklu İlişkiler (Proje İstatistikleri)</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="projectStats?.data" class="grid gap-6">
            <div v-for="stat in projectStats.data" :key="stat.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">

              <!-- İstatistik Bilgileri -->
              <div class="mb-4">
                <h4 class="font-medium text-xl">Görüntülenme: {{ stat.view_count }}</h4>
              </div>

              <!-- İlişkili Proje -->
              <div v-if="stat._relations?.work" class="mb-4 p-3 bg-gray-50 rounded">
                <h5 class="font-medium">İlişkili Proje</h5>
                <p class="text-gray-600">{{ stat._relations.work.title }}</p>
                <p class="text-gray-500 text-sm">{{ stat._relations.work.description }}</p>
              </div>

              <!-- İlişkili Referans -->
              <div v-if="stat._relations?.reference" class="mt-4 p-3 bg-gray-50 rounded">
                <h5 class="font-medium">Referans Logo Path</h5>
                <span class="bg-gray-200 p-2 rounded">{{ stat._relations.reference.logo }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2.4 Servis ve Referans İlişkisi -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">2.4 Servis ve Referans İlişkisi</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="services?.data" class="grid gap-8">
            <div v-for="service in services.data" :key="service.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4 mb-4">
                <img v-if="service.image" :src="service.image" alt="Servis Görseli"
                  class="h-16 w-16 object-cover rounded" />
                <div>
                  <h4 class="font-medium text-xl">{{ service.title }}</h4>
                  <p class="text-gray-600">{{ service.description }}</p>
                </div>
              </div>

              <!-- İlişkili Referans -->
              <div v-if="service._relations?.reference" class="mt-4">
                <h5 class="font-medium mb-2">Referans Logo Path </h5>
                <div class="p-3 bg-gray-50 rounded">
                  <span class="bg-gray-200 p-2 rounded">{{ service._relations.reference.logo }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2.5 Sosyal Medya ve Servis İlişkisi -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">2.5 Sosyal Medya ve Servis İlişkisi</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="socialLinks?.data" class="grid gap-6">
            <div v-for="link in socialLinks.data" :key="link.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">

              <!-- Sosyal Medya Bilgileri -->
              <div class="flex items-center gap-4">
                <span class="text-2xl">{{ link.icon }}</span>
                <a :href="link.link" target="_blank" class="text-blue-600 hover:underline">
                  {{ link.link }}
                </a>
              </div>

              <!-- İlişkili Servis -->
              <div v-if="link._relations?.service" class="mt-4 p-3 bg-gray-50 rounded">
                <h5 class="font-medium">Bağlı Olduğu Servis</h5>
                <p class="text-gray-600">{{ link._relations.service.title }}</p>
                <p class="text-gray-500 text-sm">{{ link._relations.service.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Gelişmiş Sorgular -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 pb-2 border-b">3. Gelişmiş Sorgular</h2>

      <!-- 3.1 Çoklu Filtreler -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">3.1 Çoklu Filtreler</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="advancedFilteredItems" class="grid gap-4">
            <div v-for="item in advancedFilteredItems.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <h4 class="font-medium">{{ item.title }}</h4>
              <p class="text-gray-600 text-sm">Sıra: {{ item.order }}</p>
              <p class="text-gray-500 mt-2">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 3.2 Dizi Operatörleri -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">3.2 Dizi Operatörleri</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="arrayFilteredItems" class="grid gap-4">
            <div v-for="item in arrayFilteredItems.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <h4 class="font-medium">{{ item.title }}</h4>
              <span class="inline-block px-2 py-1 text-sm rounded" :class="{
                'bg-green-100 text-green-800': item.status === 'publish',
                'bg-yellow-100 text-yellow-800': item.status === 'draft',
              }">
                {{ item.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3.3 Array Operatörü Örneği -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">3.3 Array Operatörü Örneği (Sosyal Medya)</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="specificSocialLinks" class="grid gap-4">
            <div v-for="item in specificSocialLinks.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4">
                <span class="text-2xl">{{ item.icon }}</span>
                <a :href="item.link" target="_blank" class="text-blue-600 hover:underline">
                  {{ item.link }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 3.4 Sayfalama Limit ve Offset  -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">3.4 Sayfalama Limit ve Offset</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="pagedWorkItems" class="grid gap-4">
            <div v-for="item in pagedWorkItems.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <h4 class="font-medium">{{ item.title }}</h4>
              <p class="text-gray-600 text-sm">Sıra: {{ item.order }}</p>
              <p class="text-gray-500 mt-2">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Çoklu Dil Desteği -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 pb-2 border-b">4. Çoklu Dil Desteği</h2>

      <!-- 4.1 Farklı Dillerde İçerik -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">4.1 Farklı Dillerde İçerik</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="border p-4 rounded-lg">
              <h4 class="font-medium text-red-600 mb-2">TR İçerik</h4>
              <div v-if="trContent">
                <h5 class="font-medium">{{ trContent.data }}</h5>
                <p class="text-gray-600 mt-2">{{ trContent.data.description }}</p>
              </div>
            </div>
            <div class="border p-4 rounded-lg">
              <h4 class="font-medium text-blue-600 mb-2">EN İçerik</h4>
              <div v-if="enContent">
                  <h5 class="font-medium">{{ enContent.data }}</h5>
                <p class="text-gray-600 mt-2">{{ enContent.data.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4.2 Lokalize Olmayan Model -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-4">4.2 Lokalize Olmayan Model (Social Links)</h3>
        <div class="bg-white shadow rounded-lg p-6">
          <div v-if="socialLinks" class="grid gap-4">
            <div v-for="item in socialLinks.data" :key="item.ID"
              class="border p-4 rounded-lg hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4">
                <span class="text-2xl">{{ item.icon }}</span>
                <a :href="item.link" target="_blank" class="text-blue-600 hover:underline">
                  {{ item.link }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

.container {
  max-width: 1200px;
}
</style>
