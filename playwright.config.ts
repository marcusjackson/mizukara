import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env['CI']

// Another project's dev server may already hold 5173, and reusing it would run
// these specs against the wrong app. E2E_PORT=5199 starts this app's own server
// on a free port instead.
const customPort = process.env['E2E_PORT']
const port = customPort ?? '5173'
const origin = `http://localhost:${port}`

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',

  // Global timeout for each test
  timeout: 30_000,

  // Global expect assertion timeout (default: 5000ms, increase for load resilience)
  // Screenshots never capture a mid-animation frame, whatever a test file does
  expect: { timeout: 10_000, toHaveScreenshot: { animations: 'disabled' } },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: isCI,

  // Retry on CI only
  retries: isCI ? 2 : 0,

  // Opt out of parallel tests on CI; allow parallel locally
  ...(isCI && { workers: 1 }),

  // Reporter to use
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    baseURL: origin,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000
  },

  // Configure projects for major browsers
  projects: [
    // Chromium / Chrome
    {
      name: 'chromium',
      testMatch: '*.test.ts',
      testIgnore: ['**/visual-regression*.test.ts'],
      use: { ...devices['Desktop Chrome'] }
    },
    // Firefox
    {
      name: 'firefox',
      testMatch: '*.test.ts',
      testIgnore: ['**/visual-regression*.test.ts'],
      use: { ...devices['Desktop Firefox'] }
    },
    // WebKit (Safari engine)
    {
      name: 'webkit',
      testMatch: '*.test.ts',
      testIgnore: ['**/visual-regression*.test.ts'],
      use: { ...devices['Desktop Safari'] }
    },
    // Visual regression testing - single browser for consistency
    {
      name: 'visual',
      testMatch: '**/visual-regression*.test.ts',
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
    command: `pnpm dev --port ${port}`,
    url: origin,
    reuseExistingServer: !isCI && !customPort,
    timeout: 120 * 1000
  }
})
