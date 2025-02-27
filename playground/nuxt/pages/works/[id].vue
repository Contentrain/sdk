<script setup lang="ts">
const route = useRoute();
const slug = computed(() => route.params.id);
const { data: workItem } = await useAsyncData('work-item', async () => {
    const result = await useContentrainQuery<any>('workitems').where('ID', 'eq', slug.value).locale('tr').first();
    return result;
});
</script>

<template>
    <div class="container mx-auto p-4">
        <h1 class="text-2xl font-bold">{{ workItem.title }}</h1>
        <p class="text-gray-600">{{ workItem.description }}</p>
    </div>
</template>

<style scoped></style>
