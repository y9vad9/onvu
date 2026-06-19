import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/core/**', 'src/lib/**', 'src/adapters/memory/**'],
    },
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@config': resolve(__dirname, './src/config'),
      '@adapters': resolve(__dirname, './src/adapters'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@store': resolve(__dirname, './src/store'),
      '@lib': resolve(__dirname, './src/lib'),
      '@i18n': resolve(__dirname, './src/i18n'),
      '~/site.config': resolve(__dirname, './site.config'),
      '~/content': resolve(__dirname, './content'),
    },
  },
})
