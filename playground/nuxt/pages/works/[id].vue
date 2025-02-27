<script setup lang="ts">
import type { WorkItems } from '#build/types/contentrain';

const route = useRoute();
const slug = computed(() => route.params.id);
const { data: workItem } = await useAsyncData('work-item', () =>
    useContentrainQuery<WorkItems>('workitems').where('ID', 'eq', slug.value as string).locale('tr').first());
</script>

<template>
    <div class="container mx-auto p-4">
        <h1 class="text-2xl font-bold">{{ workItem.data.title }}</h1>
        <p class="text-gray-600">{{ workItem.data.description }}</p>
    </div>
</template>

<style scoped></style>
