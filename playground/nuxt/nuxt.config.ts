import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/_configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@contentrain/nuxt'],
  contentrain: {
    databasePath: join(fileURLToPath(new URL('.', import.meta.url)), '../contentrain-db/contentrain.db'),
    cache: true,
    ttl: 60 * 1000,
    maxCacheSize: 100,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
