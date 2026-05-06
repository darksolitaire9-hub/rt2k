export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  modules: ['@nuxt/ui', '@nuxt/test-utils/module'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'rt2k — Master your chess mistakes',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Personalized chess training based on your own games. Analyze your form, detect leaks, and solve custom puzzles to reach 2000 ELO.' },
        { property: 'og:title', content: 'rt2k — Chess leak analysis & training' },
        { property: 'og:description', content: 'Stop solving generic puzzles. Train on your actual mistakes and master the patterns holding you back.' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' }
      ],
    },
  },
  vite: {
    optimizeDeps: {
      include: ['chess.js', 'chessground', 'idb-keyval'],
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  },
  routeRules: {
    '/**': {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  },
})
