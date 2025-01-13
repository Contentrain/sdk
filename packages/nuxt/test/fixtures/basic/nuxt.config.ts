import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import MyModule from '../../../src/module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '../../../../../playground/contentrain');

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  contentrain: {
    contentDir,
    defaultLocale: 'tr',
    cache: true,
    ttl: 60 * 1000,
    maxCacheSize: 1000,
  },
});
