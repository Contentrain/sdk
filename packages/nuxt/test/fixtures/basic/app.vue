<script setup lang="ts">
import type { BaseContentrainType } from '@contentrain/query';
import { useAsyncData } from '#app';
import { useContentrain } from '#imports';

const { query } = useContentrain();

// Model Tipleri
interface IProcessItems extends BaseContentrainType {
  title: string
  description: string
  icon: string
  status: 'draft' | 'changed' | 'publish'
  order: number
  _relations: {
    category: IWorkCategory
  }
}

interface IWorkCategory extends BaseContentrainType {
  category: string
  order: number
  status: 'draft' | 'changed' | 'publish'
}

interface IWorkItem extends BaseContentrainType {
  title: string
  description: string
  image: string
  category: string
  link: string
  order: number
  status: 'draft' | 'changed' | 'publish'
  _relations: {
    category: IWorkCategory
  }
}

interface IFaqItem extends BaseContentrainType {
  question: string
  answer: string
  order: number
  status: 'draft' | 'changed' | 'publish'
}

// Veri Çekme
const { data: processesData } = await useAsyncData('processes', () =>
  query<IProcessItems>('processes')
    .where('status', 'eq', 'publish')
    .orderBy('order', 'asc')
    .get());

const { data: workItemsData } = await useAsyncData('workitems', () =>
  query<IWorkItem, 'en' | 'tr', { category: IWorkCategory }>('workitems')
    .include('category')
    .where('status', 'eq', 'publish')
    .orderBy('order', 'asc')
    .get());

const { data: faqData } = await useAsyncData('faq', () =>
  query<IFaqItem>('faqitems')
    .where('status', 'eq', 'publish')
    .orderBy('order', 'asc')
    .get());
</script>

<template>
  <div>
    <!-- Süreçler -->
    <div v-if="processesData">
      <div v-for="process in processesData.data" :key="process.ID">
        <h3>{{ process.title }}</h3>
        <p>{{ process.description }}</p>
      </div>
    </div>

    <!-- İş Öğeleri -->
    <div v-if="workItemsData">
      <div v-for="work in workItemsData.data" :key="work.ID">
        <h3>{{ work.title }}</h3>
        <p>{{ work.description }}</p>
        <span>{{ work._relations?.category?.category }}</span>
      </div>
    </div>

    <!-- FAQ -->
    <div v-if="faqData">
      <div v-for="faq in faqData.data" :key="faq.ID">
        <h3>{{ faq.question }}</h3>
        <p>{{ faq.answer }}</p>
      </div>
    </div>
  </div>
</template>
