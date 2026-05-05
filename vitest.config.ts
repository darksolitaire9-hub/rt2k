import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'node',
    include: ['shared/**/*.test.ts', 'app/**/*.test.ts'],
    environmentMatchGlobs: [
      ['app/components/**/*.test.ts', 'nuxt'],
      ['app/pages/**/*.test.ts', 'nuxt'],
    ],
    hookTimeout: 30000,
  },
})
