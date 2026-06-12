// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/reset.css'],

  modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxtjs/i18n'],

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'ru',
    locales: [
      { code: 'ru', language: 'ru-RU' },
      { code: 'en', language: 'en-US' },
      { code: 'th', language: 'th-TH' },
    ],
  },

  runtimeConfig: {
    public: {
      // Переопределяется через NUXT_PUBLIC_API_BASE
      apiBase: '/api/backend',
      // Переопределяется через NUXT_PUBLIC_BACKEND_URL
      backendUrl: 'http://localhost:3001',
      // Переопределяется через NUXT_PUBLIC_APP_ENV
      appEnv: 'development',
    },
  },
})
