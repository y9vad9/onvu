import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const aliases = {
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
}

// Tests under `hooks/` and `components/`, plus any `.tsx` test file, exercise
// React + DOM and need jsdom. Everything else runs in pure node for speed.
export default defineConfig({
  esbuild: {
    // Match Next.js + tsconfig "preserve" so JSX uses the automatic runtime
    // and tests don't need to import React explicitly.
    jsx: 'automatic',
  },
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/core/**',
        'src/lib/**',
        'src/adapters/**',
        'src/store/**',
        'src/hooks/**',
        'src/components/**',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/app/**',
        'src/**/*.css',
        'tests-e2e/**',
      ],
      thresholds: {
        lines: 70,
        branches: 65,
        functions: 70,
        statements: 70,
      },
    },
    exclude: ['tests-e2e/**', 'node_modules/**', 'dist/**', '.next/**'],
    projects: [
      {
        resolve: { alias: aliases },
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: [
            'tests/core/**/*.test.ts',
            'tests/adapters/**/*.test.ts',
            'tests/lib/**/*.test.ts',
            'tests/store/**/*.test.ts',
            'tests/app/**/*.test.ts',
            'tests/content/**/*.test.ts',
          ],
        },
      },
      {
        resolve: { alias: aliases },
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: [
            'tests/hooks/**/*.test.{ts,tsx}',
            'tests/components/**/*.test.{ts,tsx}',
          ],
        },
      },
    ],
  },
  resolve: { alias: aliases },
})
