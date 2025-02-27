<script setup lang="ts">
import type { LocalizedContent } from '@contentrain/nuxt-json';

interface IWorkItem extends LocalizedContent {
    title: string
    description: string
    image: string
    category: string
    link: string
    order: number
    _lang: 'tr' | 'en'
    _relations: {
        category: any
    }
}
const { data: workItems } = await useAsyncData('test', async () => {
    const result = await useContentrainQuery<IWorkItem>('workitems').locale('tr').get();
    return result.data;
});
</script>

<template>
    <div>
        <section v-for="item in workItems" :key="item.ID" class="work-item-card p-4 border border-gray-300 rounded-lg">
            <h2 class="text-2xl font-bold">{{ item.title }}</h2>
            <p class="text-gray-600">{{ item.description }}</p>
            <NuxtLink :to="`/works/${item.ID}`">
                <button class="bg-blue-500 text-white px-4 py-2 rounded-md">
                    View Details
                </button>
            </NuxtLink>
        </section>
    </div>
</template>

<style scoped></style>
