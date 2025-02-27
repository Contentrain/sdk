<template>
    <div>
        <header class="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold">Contentrain Nuxt</h1>
            <p class="text-gray-400">Playground</p>
            <nav class="flex gap-4">
                <NuxtLink to="/">Home</NuxtLink>
                <NuxtLink to="/works">Works</NuxtLink>
            </nav>
        </header>
        <NuxtPage />
        <footer class="bg-gray-800 text-white p-4 text-center space-y-4 space-x-4">
            <p class="text-gray-400">Contentrain Nuxt</p>
            <p class="text-gray-400">Playground</p>
        </footer>
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
