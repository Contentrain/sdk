// https://nuxt.com/docs/_configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@contentrain/nuxt'],
  runtimeConfig: {
    contentrain: {
      contentDir: '../contentrain',
      defaultLocale: 'tr',
      cache: true,
      ttl: 60 * 1000,
    },
    public: {
      contentrain: {
        defaultLocale: 'tr',
      },
    },
  },
});
