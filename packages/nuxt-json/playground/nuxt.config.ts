import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
    modules: ['../src/module', '@nuxtjs/tailwindcss'],

    contentrain: {
        path: join(__dirname, 'contentrain'),
    },

    devtools: { enabled: false },
    css: ['~/assets/css/main.css'],
    compatibilityDate: '2025-02-24',
});
