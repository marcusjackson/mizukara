import { defineConfig, devices } from '@playwright/test'

/**
 * Checks that only a production build can answer, so they cannot run against
 * the dev server `playwright.config.ts` uses. Run with
 * `make test-e2e-production`.
 *
 * Kept out of `make ci`: the origin check downloads the 34 MB model from
 * Hugging Face, which routine CI should not depend on.
 */
export default defineConfig({
  testDir: './e2e-production',
  outputDir: './test-results-production',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4199', actionTimeout: 15_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'pnpm exec vite build && pnpm exec vite preview --port 4199 --strictPort',
    url: 'http://localhost:4199',
    reuseExistingServer: false,
    timeout: 300_000
  }
})
