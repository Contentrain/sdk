import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/_configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    modules: ['@contentrain/nuxt-json'],
    contentrain: {
        path: join(fileURLToPath(new URL('.', import.meta.url)), '../contentrain'),
    },
    vite: {
        plugins: [tailwindcss()],
    },
});
