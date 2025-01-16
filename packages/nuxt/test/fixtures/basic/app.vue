<script setup lang="ts">
import type { BaseContentrainType, ContentrainStatus } from '@contentrain/query';
import { onMounted, ref } from 'vue';
import { useContentrain } from '../../../.nuxt/imports';

interface IWorkCategory extends BaseContentrainType {
  category: string
  order: number
  status: ContentrainStatus
}

interface IWorkItem extends BaseContentrainType {
  title: string
  description: string
  image: string
  category: string
  link: string
  order: number
  status: ContentrainStatus
  _relations: {
    category: IWorkCategory
  }
}

interface ITabItem extends BaseContentrainType {
  title: string
  description: string
  order: number
  category: string[]
  status: ContentrainStatus
  _relations?: {
    category: IWorkCategory[]
  }
}

interface IFaqItem extends BaseContentrainType {
  question: string
  answer: string
  order: number
  status: ContentrainStatus
}

interface ITestimonialItem extends BaseContentrainType {
  'name': string
  'description': string
  'title': string
  'image': string
  'creative-work': string
  'status': ContentrainStatus
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
  status: ContentrainStatus
}

interface ISocialLink extends BaseContentrainType {
  icon: string
  link: string
  status: ContentrainStatus
}

// Temel Sorgular
const basicQueryItems = ref<IWorkItem[]>([]);
const paginatedItems = ref<IWorkItem[]>([]);
const paginationInfo = ref<{ total: number, limit: number, offset: number }>();

// İlişki Sorguları
const testimonialItems = ref<ITestimonialItem[]>([]);
const tabItems = ref<ITabItem[]>([]);

// Gelişmiş Sorgular
const filteredServices = ref<IWorkItem[]>([]);

// Çoklu Dil Desteği
const trContent = ref<ISection | null>(null);
const enContent = ref<ISection | null>(null);
const socialLinks = ref<ISocialLink[]>([]);

// Önbellek ve Metadata
const bypassCacheItems = ref<IFaqItem[]>([]);
const modelMetadata = ref<any>(null);
const assetsCount = ref<number>(0);

onMounted(async () => {
  const { query, load } = useContentrain();

  // 1. Temel Sorgular
  // 1.1 Filtreleme ve Sıralama
  const workItems = await query<IWorkItem>('workitems')
    .where('status', 'eq', 'publish')
    .where('order', 'lt', 5)
    .orderBy('order', 'asc')
    .get();
  basicQueryItems.value = workItems.data;

  // 1.2 Sayfalama
  const pagedItems = await query<IWorkItem>('workitems')
    .limit(3)
    .offset(1)
    .get();
  paginatedItems.value = pagedItems.data;
  paginationInfo.value = {
    total: pagedItems.total,
    limit: pagedItems.pagination?.limit || 0,
    offset: pagedItems.pagination?.offset || 0,
  };

  // 2. İlişki Sorguları
  // 2.1 Bire-Bir İlişki
  const testimonials = await query<ITestimonialItem>('testimonail-items')
    .include('creative-work')
    .get();
  testimonialItems.value = testimonials.data;

  // 2.2 Bire-Çok İlişki
  const tabs = await query<ITabItem>('tabitems')
    .where('status', 'eq', 'publish')
    .include('category')
    .orderBy('order', 'asc')
    .get();
  tabItems.value = tabs.data;

  // 3. Gelişmiş Sorgular
  // 3.1 Çoklu Filtreler
  const services = await query<IWorkItem>('workitems')
    .where('status', 'eq', 'publish')
    .where('order', 'gt', 2)
    .where('order', 'lt', 6)
    .where('description', 'contains', 'platform')
    .orderBy('order', 'asc')
    .get();
  filteredServices.value = services.data;

  // 4. Çoklu Dil Desteği
  // 4.1 Farklı Dillerde İçerik
  trContent.value = await query<ISection>('sections')
    .locale('tr')
    .first();
  enContent.value = await query<ISection>('sections')
    .locale('en')
    .first();

  // 4.2 Lokalize Olmayan Model
  const links = await query<ISocialLink>('sociallinks')
    .where('status', 'eq', 'publish')
    .orderBy('icon', 'asc')
    .get();
  socialLinks.value = links.data;

  // 5. Önbellek Yönetimi
  const bypassCache = await query<IFaqItem>('faqitems')
    .noCache()
    .get();
  bypassCacheItems.value = bypassCache.data;

  // 6. Metadata ve Assets
  const modelData = await load('workitems');
  modelMetadata.value = modelData.model.metadata;
  assetsCount.value = modelData.assets?.length || 0;
});
</script>

<template>
  <div class="container">
    <h1>Contentrain SDK Test Senaryoları</h1>

    <!-- 1. Temel Sorgular -->
    <section class="test-case">
      <h2>1. Temel Sorgular</h2>

      <!-- 1.1 Filtreleme ve Sıralama -->
      <div class="sub-section">
        <h3>1.1 Filtreleme ve Sıralama</h3>
        <div v-if="basicQueryItems.length">
          <div v-for="item in basicQueryItems" :key="item.ID" class="item">
            <h4>{{ item.title }}</h4>
            <p>Sıra: {{ item.order }}</p>
          </div>
        </div>
      </div>

      <!-- 1.2 Sayfalama -->
      <div class="sub-section">
        <h3>1.2 Sayfalama</h3>
        <div v-if="paginatedItems.length">
          <div v-for="item in paginatedItems" :key="item.ID" class="item">
            <h4>{{ item.title }}</h4>
          </div>
          <div class="pagination-info">
            Toplam: {{ paginationInfo?.total }} |
            Limit: {{ paginationInfo?.limit }} |
            Offset: {{ paginationInfo?.offset }}
          </div>
        </div>
      </div>
    </section>

    <!-- 2. İlişki Sorguları -->
    <section class="test-case">
      <h2>2. İlişki Sorguları</h2>

      <!-- 2.1 Bire-Bir İlişki -->
      <div class="sub-section">
        <h3>2.1 Bire-Bir İlişki (Testimonials)</h3>
        <div v-if="testimonialItems.length">
          <div v-for="item in testimonialItems" :key="item.ID" class="item">
            <h4>{{ item.title }}</h4>
            <p>İlişkili İş: {{ item._relations?.['creative-work']?.title }}</p>
          </div>
        </div>
      </div>

      <!-- 2.2 Bire-Çok İlişki -->
      <div class="sub-section">
        <h3>2.2 Bire-Çok İlişki (Tab Items)</h3>
        <div v-if="tabItems.length">
          <div v-for="item in tabItems" :key="item.ID" class="item">
            <h4>{{ item.title }}</h4>
            <p>Kategoriler: {{ item._relations?.category?.map(c => c.category).join(', ') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Gelişmiş Sorgular -->
    <section class="test-case">
      <h2>3. Gelişmiş Sorgular</h2>

      <!-- 3.1 Çoklu Filtreler -->
      <div class="sub-section">
        <h3>3.1 Çoklu Filtreler</h3>
        <div v-if="filteredServices.length">
          <div v-for="item in filteredServices" :key="item.ID" class="item">
            <h4>{{ item.title }}</h4>
            <p>Sıra: {{ item.order }}</p>
            <p>{{ item.description.slice(0, 100) }}...</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Çoklu Dil Desteği -->
    <section class="test-case">
      <h2>4. Çoklu Dil Desteği</h2>

      <!-- 4.1 Farklı Dillerde İçerik -->
      <div class="sub-section">
        <h3>4.1 Farklı Dillerde İçerik</h3>
        <div class="item">
          <h4>Türkçe</h4>
          <p>{{ trContent?.title }}</p>
          <h4>İngilizce</h4>
          <p>{{ enContent?.title }}</p>
        </div>
      </div>

      <!-- 4.2 Lokalize Olmayan Model -->
      <div class="sub-section">
        <h3>4.2 Lokalize Olmayan Model (Social Links)</h3>
        <div v-if="socialLinks.length">
          <div v-for="link in socialLinks" :key="link.ID" class="item">
            <p>{{ link.icon }}: {{ link.link }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Önbellek Yönetimi -->
    <section class="test-case">
      <h2>5. Önbellek Yönetimi</h2>
      <div class="sub-section">
        <h3>Cache Bypass Sonuçları</h3>
        <div v-if="bypassCacheItems.length">
          <div v-for="item in bypassCacheItems" :key="item.ID" class="item">
            <h4>{{ item.question }}</h4>
            <p>{{ item.answer }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. Metadata ve Assets -->
    <section class="test-case">
      <h2>6. Metadata ve Assets</h2>
      <div class="sub-section">
        <h3>Model Metadata</h3>
        <pre class="metadata">{{ JSON.stringify(modelMetadata, null, 2) }}</pre>
        <p>Assets Sayısı: {{ assetsCount }}</p>
      </div>
    </section>
  </div>
</template>

<style>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.test-case {
  margin: 3rem 0;
  padding: 2rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sub-section {
  margin: 2rem 0;
  padding: 1.5rem;
  border-left: 4px solid #0070f3;
  background-color: #f7f7f7;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #333;
  text-align: center;
}

h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #0070f3;
}

h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #666;
}

h4 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.item {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #666;
}

.metadata {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  overflow-x: auto;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background-color: #0051cc;
}
</style>
