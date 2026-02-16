import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env['CI']

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',

  // Global timeout for each test
  timeout: 8 * 1000,

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: isCI,

  // Retry on CI only
  retries: isCI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  // Configure projects for major browsers
  projects: [
    // New UI tests (empty until we start building new UI)
    {
      name: 'chromium',
      testMatch: '*.test.ts',
      testIgnore: ['**/visual-regression.test.ts'],
      use: { ...devices['Desktop Chrome'] }
    },
    // Visual regression testing - single browser for consistency
    {
      name: 'visual',
      testMatch: '**/visual-regression.test.ts',
      timeout: 30000, // 30s timeout for VRT tests
      use: {
        ...devices['Desktop Chrome'],
        // Consistent viewport for visual regression
        viewport: { width: 1280, height: 800 }
      }
    }
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 120 * 1000
  }
})
