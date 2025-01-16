import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '../../../../../playground/contentrain');

export default defineNuxtConfig({
  modules: ['../../../src/module'],

  contentrain: {
    contentDir,
    defaultLocale: 'tr',
    cache: true,
    ttl: 60 * 1000,
    maxCacheSize: 1000,
  },

  imports: {
    dirs: ['../../../src/runtime/composables'],
  },

  compatibilityDate: '2025-01-16',
});