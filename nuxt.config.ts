export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  modules: ['@nuxt/ui'],
  css: [
    'chessground/assets/chessground.base.css',
    'chessground/assets/chessground.brown.css',
    'chessground/assets/chessground.cburnett.css',
  ],
  app: {
    head: {
      title: 'rt2k — Chess leak analysis',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})
