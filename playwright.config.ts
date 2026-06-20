import { defineConfig, devices } from '@playwright/test'

/**
 * Onvu Playwright config — kept intentionally lean.
 *
 * Specs live under `tests-e2e/specs`. They drive a `next dev` server, so
 * the same content/notes/ fixture set you author against is what the
 * browser sees. CI sets ONVU_E2E=1 so the dev server can short-circuit
 * any heavy startup work that isn't relevant for tests (none today, but
 * the hook is there).
 *
 * Projects: chromium desktop is the primary signal. webkit and the
 * chromium mobile viewport catch the layout-specific regressions the
 * jsdom-level component tests can't see (mobile panel overlay, etc).
 */
export default defineConfig({
  testDir: './tests-e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'en-US',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ONVU_E2E: '1' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
