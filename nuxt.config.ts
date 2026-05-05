export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@nuxt/test-utils/module'],
  supabase: {
    redirect: false
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'rt2k — Chess leak analysis',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  vite: {
    optimizeDeps: {
      include: ['chess.js', 'chessground'],
    },
  },
})
