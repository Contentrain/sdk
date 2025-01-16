<script setup lang="ts">
import type { BaseContentrainType, QueryResult } from '@contentrain/query';

// Composable'ı kullan
const { query } = useContentrain();

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

// Süreçleri çek
const { data: processesData, pending: processesPending, error: processesError } = await useAsyncData<QueryResult<IProcessItems>>('processes', () =>
  query<IProcessItems, 'en' | 'tr'>('processes')
    .orderBy('title', 'asc')
    .limit(3)
    .locale('tr')
    .get());

// İş öğelerini çek
const { data: workItemsData, pending: workItemsPending, error: workItemsError } = await useAsyncData<QueryResult<IWorkItem>>('workitems', () =>
  query<IWorkItem, 'en' | 'tr', { category: IWorkCategory }>('workitems')
    .include('category')
    .orderBy('order', 'asc')
    .where('status', 'eq', 'publish')
    .get());

// FAQ verilerini çek
const { data: faqData, pending: faqPending, error: faqError } = await useAsyncData<QueryResult<IFaqItem>>('faq', () =>
  query<IFaqItem, 'en' | 'tr'>('faqitems')
    .where('status', 'eq', 'publish')
    .orderBy('order', 'asc')
    .get());

// Meta etiketlerini çek
const { data: metaTagsData, pending: metaTagsPending, error: metaTagsError } = await useAsyncData<QueryResult<IMetaTag>>('meta-tags', () =>
  query<IMetaTag, 'en' | 'tr'>('meta-tags')
    .where('name', 'startsWith', 'og')
    .get());

// Referansları çek
const { data: testimonialsData, pending: testimonialsPending, error: testimonialsError } = await useAsyncData<QueryResult<ITestimonialItem>>('testimonials', () =>
  query<ITestimonialItem, 'en' | 'tr', { 'creative-work': IWorkItem }>('testimonail-items')
    .include('creative-work')
    .locale('tr')
    .where('status', 'eq', 'publish')
    .get());

// Test sorgusu
const res = await query<ITestimonialItem, 'en' | 'tr', { 'creative-work': IWorkItem }>('testimonail-items')
  .include('creative-work')
  .where('status', 'eq', 'publish')
  .locale('tr')
  .get();

console.log(res.data);

// Dil testi için sorgular
const trFaqData = await query<IFaqItem, 'en' | 'tr'>('faqitems')
  .where('status', 'eq', 'publish')
  .locale('tr')
  .get();

const enFaqData = await query<IFaqItem, 'en' | 'tr'>('faqitems')
  .where('status', 'eq', 'publish')
  .locale('en')
  .get();

// Dil testi için iş öğeleri
const trWorkData = await query<IWorkItem, 'en' | 'tr', { category: IWorkCategory }>('workitems')
  .include('category')
  .where('status', 'eq', 'publish')
  .locale('tr')
  .get();

const enWorkData = await query<IWorkItem, 'en' | 'tr', { category: IWorkCategory }>('workitems')
  .include('category')
  .where('status', 'eq', 'publish')
  .locale('en')
  .get();

// Sonuçları konsola yazdır
console.log('TR FAQ Data:', trFaqData.data);
console.log('EN FAQ Data:', enFaqData.data);
console.log('TR Work Data:', trWorkData.data);
console.log('EN Work Data:', enWorkData.data);

// Dil karşılaştırması
if (trFaqData.data.length > 0 && enFaqData.data.length > 0) {
  console.log('FAQ Dil Karşılaştırması:');
  console.log('TR Soru:', trFaqData.data[0].question);
  console.log('EN Soru:', enFaqData.data[0].question);
}

if (trWorkData.data.length > 0 && enWorkData.data.length > 0) {
  console.log('Work Items Dil Karşılaştırması:');
  console.log('TR İçerik:', trWorkData.data[0].description);
  console.log('EN İçerik:', enWorkData.data[0].description);
}

// Dil testi için yeni sorgular
const trMetaData = await query<IMetaTag, 'en' | 'tr'>('meta-tags')
  .where('name', 'startsWith', 'og')
  .locale('tr')
  .get();

const enMetaData = await query<IMetaTag, 'en' | 'tr'>('meta-tags')
  .where('name', 'startsWith', 'og')
  .locale('en')
  .get();

// Meta tag karşılaştırması
console.log('Meta Tags Dil Karşılaştırması:');
console.log('TR Meta Tags:', trMetaData.data);
console.log('EN Meta Tags:', enMetaData.data);

// Mevcut locale'i kontrol et
const config = useRuntimeConfig();
console.log('Default Locale:', config.public.contentrain.defaultLocale);

// Doğrudan API istekleri

// Doğrudan API istekleri
async function fetchContents() {
  // Süreçler
  const processes = await $fetch('/_contentrain/query', {
    method: 'POST',
    body: {
      model: 'processes',
      locale: 'tr',
      where: [['status', 'eq', 'publish']],
      limit: 1,
    },
  });

  // SSS
  const faq = await $fetch('/_contentrain/query', {
    method: 'POST',
    body: {
      model: 'faqitems',
      locale: 'tr',
      where: [['status', 'eq', 'publish']],
      limit: 1,
    },
  });

  // İş öğeleri
  const workitems = await $fetch('/_contentrain/query', {
    method: 'POST',
    body: {
      model: 'workitems',
      locale: 'tr',
      where: [['status', 'eq', 'publish']],
      limit: 1,
    },
  });

  console.log('API Sonuçları:');
  console.log('Süreçler:', processes);
  console.log('SSS:', faq);
  console.log('İş Öğeleri:', workitems);
}

onMounted(() => {
  fetchContents();
});
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-8">
      Contentrain Örneği
    </h1>

    <!-- Süreçler -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">
        Süreçlerimiz
      </h2>
      <div v-if="processesPending" class="text-gray-600">
        Yükleniyor...
      </div>
      <div v-else-if="processesError" class="text-red-600">
        {{ processesError.message }}
      </div>
      <div v-else-if="processesData?.data" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="process in processesData.data" :key="process.ID" class="p-4 border rounded">
          <div class="text-2xl mb-2">
            {{ process.icon }}
          </div>
          <h3 class="font-medium">
            {{ process.title }}
          </h3>
          <p class="text-gray-600 mt-2">
            {{ process.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- İş Öğeleri -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">
        Çalışmalarımız
      </h2>
      <div v-if="workItemsPending" class="text-gray-600">
        Yükleniyor...
      </div>
      <div v-else-if="workItemsError" class="text-red-600">
        {{ workItemsError.message }}
      </div>
      <div v-else-if="workItemsData?.data" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="work in workItemsData.data" :key="work.ID" class="p-4 border rounded">
          <img v-if="work.image" :src="work.image" :alt="work.title" class="w-full h-48 object-cover rounded mb-4" />
          <h3 class="font-medium">
            {{ work.title }}
          </h3>
          <p class="text-gray-600 mt-2">
            {{ work.description }}
          </p>
          <div class="mt-2 text-sm">
            <span class="bg-gray-100 px-2 py-1 rounded">{{ work._relations?.category?.category }}</span>
          </div>
          <a :href="work.link" target="_blank" class="text-blue-600 hover:underline mt-2 block">Projeyi İncele</a>
        </div>
      </div>
    </div>

    <!-- FAQ Öğeleri -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">
        Sık Sorulan Sorular
      </h2>
      <div v-if="faqPending" class="text-gray-600">
        Yükleniyor...
      </div>
      <div v-else-if="faqError" class="text-red-600">
        {{ faqError.message }}
      </div>
      <div v-else-if="faqData?.data" class="space-y-4">
        <div v-for="faq in faqData.data" :key="faq.ID" class="p-4 border rounded">
          <h3 class="font-medium">
            {{ faq.question }}
          </h3>
          <p class="text-gray-600 mt-2">
            {{ faq.answer }}
          </p>
        </div>
      </div>
    </div>

    <!-- Meta Etiketleri -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">
        Meta Etiketleri (og ile başlayanlar)
      </h2>
      <div v-if="metaTagsPending" class="text-gray-600">
        Yükleniyor...
      </div>
      <div v-else-if="metaTagsError" class="text-red-600">
        {{ metaTagsError.message }}
      </div>
      <div v-else-if="metaTagsData?.data" class="space-y-4">
        <div v-for="meta in metaTagsData.data" :key="meta.ID" class="p-4 border rounded">
          <h3 class="font-medium">
            {{ meta.name }}
          </h3>
          <p class="text-gray-600 mt-2">
            {{ meta.content }}
          </p>
          <p v-if="meta.description" class="text-sm text-gray-500 mt-1">
            {{ meta.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Referanslar -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Referanslar</h2>
      <div v-if="testimonialsPending" class="text-gray-600">
        Yükleniyor...
      </div>
      <div v-else-if="testimonialsError" class="text-red-600">
        {{ testimonialsError.message }}
      </div>
      <div v-else-if="testimonialsData?.data" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="testimonial in testimonialsData.data" :key="testimonial.ID" class="p-6 border rounded bg-gray-50">
          <img v-if="testimonial.image" :src="testimonial.image" :alt="testimonial.name"
            class="w-16 h-16 rounded-full mb-4" />
          <p class="text-gray-600 italic mb-4">"{{ testimonial.description }}"</p>
          <div class="flex items-start">
            <div>
              <h3 class="font-medium">{{ testimonial.name }}</h3>
              <p class="text-sm text-gray-500">{{ testimonial.title }}</p>
              <div v-if="testimonial._relations?.['creative-work']" class="mt-2">
                <a :href="testimonial._relations['creative-work'].link" target="_blank"
                  class="text-blue-600 hover:underline text-sm">
                  {{ testimonial._relations['creative-work'].title }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
