import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // @ts-expect-error - Plugin type mismatch between vite versions
  plugins: [vue()],

  define: {
    __APP_VERSION__: JSON.stringify('0.3.0')
  },

  resolve: {
    alias: {
      '@test': `${__dirname}/test`,
      '@': `${__dirname}/src`,
      // Mock virtual module for PWA during tests
      'virtual:pwa-register/vue': `${__dirname}/test/mocks/pwa-register.ts`
    }
  },

  test: {
    globals: true,
    environment: 'jsdom',

    // Test file patterns
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'e2e'],

    // Setup files
    setupFiles: ['test/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/main.ts',
        'src/**/*.stories.ts'
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    },

    // Pool configuration for better performance
    pool: 'forks',

    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true
  }
})
