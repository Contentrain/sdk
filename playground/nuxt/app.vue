<script setup lang="ts">
import type { Content, LocalizedContent, QueryResult } from '@contentrain/nuxt-json';

interface IWorkItem extends LocalizedContent {
    title: string
    description: string
    image: string
    category: string
    link: string
    order: number
    _lang: 'tr' | 'en'
    _relations: {
        category: IWorkCategory
    }
}

interface IWorkCategory extends LocalizedContent {
    category: string
    order: number
    _lang: 'tr' | 'en'
}

interface ITabItem extends LocalizedContent {
    title: string
    description: string
    order: number
    category: string
    _lang: 'tr' | 'en'
    _relations: {
        category: IWorkCategory[]
    }
}

interface ITestimonialItem extends LocalizedContent {
    'name': string
    'description': string
    'title': string
    'image': string
    'creative-work': string
    '_lang': 'tr' | 'en'
    '_relations': {
        'creative-work': IWorkItem
    }
}

interface IFaqItem extends LocalizedContent {
    question: string
    answer: string
    order: number
    _lang: 'tr' | 'en'
}

interface ISocialLink extends Content {
    icon: string
    link: string
    service: string
}

// Debug için
console.log('=== APP.VUE SETUP START ===');
const { data: models } = useAsyncData('models', async () => await useContentrainModels().getAll());
console.log('models', models.value);
// === 1. Temel Sorgular ===
// 1.1 Filtreleme ve Sıralama
const filteredWorkItemsQuery = useContentrainQuery<IWorkItem>('workitems')
    .locale('tr')
    .get();

const { data: filteredWorkItems } = await useAsyncData<QueryResult<IWorkItem>>('filtered-work-items', () =>
    filteredWorkItemsQuery);

console.log('filteredWorkItems', filteredWorkItems.value?.data);
// 1.2 Sayfalama
const { data: pagedWorkItems } = await useAsyncData<QueryResult<IWorkItem>>('paged-work-items', () =>
    useContentrainQuery<IWorkItem>('workitems')
        .limit(3)
        .offset(1)
        .locale('tr')
        .get());

// === 2. İlişki Sorguları ===
// 2.1 Bire-Bir İlişki
const { data: testimonials } = await useAsyncData<QueryResult<ITestimonialItem>>('testimonials', () =>
    useContentrainQuery<ITestimonialItem>('testimonial-items')
        .locale('tr')
        .include('creative-work')
        .get());

// 2.2 Bire-Çok İlişki
const { data: tabItems } = await useAsyncData<QueryResult<ITabItem>>('tab-items', () =>
    useContentrainQuery<ITabItem>('tabitems')
        .locale('tr')
        .where('status', 'eq', 'publish')
        .include('category')
        .get());

// === 3. Gelişmiş Sorgular ===
// 3.1 Çoklu Filtreler
const { data: advancedFilteredItems } = await useAsyncData<QueryResult<IWorkItem>>('advanced-filtered-items', () =>
    useContentrainQuery<IWorkItem>('workitems')
        .where('status', 'eq', 'publish')
        .where('order', 'gt', 2)
        .where('order', 'lt', 6)
        .where('description', 'contains', 'platform')
        .orderBy('order', 'asc')
        .locale('tr')
        .get());

// 3.2 Dizi Operatörleri
const { data: arrayFilteredItems } = await useAsyncData<QueryResult<IWorkItem>>('array-filtered-items', () =>
    useContentrainQuery<IWorkItem>('workitems')
        .where('status', 'ne', 'draft')
        .locale('tr')
        .get());

// 3.3 Array Operatörü Örneği
const { data: specificSocialLinks } = await useAsyncData<QueryResult<ISocialLink>>('specific-social-links', () =>
    useContentrainQuery<ISocialLink>('sociallinks')
        .where('icon', 'in', ['ri-twitter-line', 'ri-instagram-line', 'ri-linkedin-line'])
        .where('status', 'eq', 'publish')
        .orderBy('icon', 'asc')
        .get());

// === 4. Çoklu Dil Desteği ===
// 4.1 Farklı Dillerde İçerik
const { data: trContent } = await useAsyncData<IWorkItem | null>('tr-content', () =>
    useContentrainQuery<IWorkItem>('workitems')
        .locale('tr')
        .first());

const { data: enContent } = await useAsyncData<IWorkItem | null>('en-content', () =>
    useContentrainQuery<IWorkItem>('workitems')
        .locale('en')
        .first());

// 4.2 Lokalize Olmayan Model
const { data: socialLinks } = await useAsyncData<QueryResult<ISocialLink>>('social-links', () =>
    useContentrainQuery<ISocialLink>('sociallinks')
        .where('status', 'eq', 'publish')
        .orderBy('icon', 'asc')
        .get());

const { data: socialLinks2 } = await useAsyncData<QueryResult<ISocialLink>>('social-links-2', () =>
    useContentrainQuery<ISocialLink>('sociallinks')
        .where('icon', 'eq', 'ri-instagram-line')
        .orderBy('icon', 'asc')
        .get());

// === 5. Önbellek Yönetimi ===
// 5.1 Önbellek Bypass
const { data: bypassCacheItems } = await useAsyncData<QueryResult<IFaqItem>>('bypass-cache-items', () =>
    useContentrainQuery<IFaqItem>('faqitems')
        .locale('tr')
        .get());
</script>

<template>
    <div class="container mx-auto p-8">
        <h1 class="text-3xl font-bold mb-12 text-center">Contentrain SDK Test Senaryoları</h1>
        <!-- 1. Temel Sorgular -->
        <section class="mb-12">
            <h2 class="text-2xl font-semibold mb-6 pb-2 border-b">1. Temel Sorgular</h2>
            <pre class="bg-gray-100 p-4 rounded mb-4">{{ socialLinks2 }}</pre>
            <!-- 1.1 Filtreleme ve Sıralama -->
            <div class="mb-8">
                <h3 class="text-xl font-medium mb-4">1.1 Filtreleme ve Sıralama</h3>
                <div class="bg-white shadow rounded-lg p-6">
                    <div v-if="filteredWorkItems" class="grid gap-4">
                        <div v-for="item in filteredWorkItems.data" :key="item.ID"
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
                    <div v-if="pagedWorkItems" class="grid gap-4">
                        <div v-for="item in pagedWorkItems.data" :key="item.ID"
                            class="border p-4 rounded-lg hover:shadow-md transition-shadow">
                            <h4 class="font-medium">{{ item.title }}</h4>
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
                    <div v-if="testimonials" class="grid gap-6">
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
                    <div v-if="tabItems" class="grid gap-4">
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
                                <h5 class="font-medium">{{ trContent.title }}</h5>
                                <p class="text-gray-600 mt-2">{{ trContent.description }}</p>
                            </div>
                        </div>
                        <div class="border p-4 rounded-lg">
                            <h4 class="font-medium text-blue-600 mb-2">EN İçerik</h4>
                            <div v-if="enContent">
                                <h5 class="font-medium">{{ enContent.title }}</h5>
                                <p class="text-gray-600 mt-2">{{ enContent.description }}</p>
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

        <!-- 5. Önbellek Yönetimi -->
        <section class="mb-12">
            <h2 class="text-2xl font-semibold mb-6 pb-2 border-b">5. Önbellek Yönetimi</h2>

            <!-- 5.1 Önbellek Bypass -->
            <div class="mb-8">
                <h3 class="text-xl font-medium mb-4">5.1 Önbellek Bypass</h3>
                <div class="bg-white shadow rounded-lg p-6">
                    <div v-if="bypassCacheItems" class="grid gap-4">
                        <div v-for="item in bypassCacheItems.data" :key="item.ID"
                            class="border p-4 rounded-lg hover:shadow-md transition-shadow">
                            <h4 class="font-medium">{{ item.question }}</h4>
                            <p class="text-gray-600 mt-2">{{ item.answer }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

.container {
    max-width: 1200px;
}
</style>
