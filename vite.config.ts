import basicSsl from '@vitejs/plugin-basic-ssl'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import pkg from './package.json' with { type: 'json' }

/* eslint-disable max-lines-per-function */
export default defineConfig(({ command }) => ({
  // Base path for GitHub Pages deployment
  // Only apply /mizukara/ base during production build on GitHub Actions
  // Dev server always uses '/' so Playwright E2E tests work correctly
  base:
    command === 'build' && process.env['GITHUB_ACTIONS'] ? '/mizukara/' : '/',

  plugins: [
    vue(),
    // Self-signed HTTPS for `pnpm dev:mobile` only (opt-in via VITE_HTTPS) —
    // `navigator.mediaDevices` (device-sync's QR camera scanner) doesn't
    // exist at all on a non-secure origin, and `--host` serves dev over a
    // LAN IP, which only counts as secure over HTTPS (unlike `localhost`,
    // which browsers always treat as secure). Left off for plain `pnpm dev`
    // and the Playwright webServer, which both expect the plain-HTTP
    // `http://localhost:5173` origin. Accept the browser's self-signed cert
    // warning once per device.
    ...(command === 'serve' && process.env['VITE_HTTPS'] ? [basicSsl()] : []),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'Mizukara',
        short_name: 'Mizukara',
        description:
          'A personal, offline-first space for capturing and reflecting on your memories',
        theme_color: '#5a8a94',
        background_color: '#fafafa',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,wasm}'],
        // Runtime caching for sql.js WASM files
        runtimeCaching: [
          {
            // Cache sql.js WASM files from CDN
            urlPattern: /^https:\/\/sql\.js\.org\/dist\/.*\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sql-js-wasm',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache WASM files from node_modules (bundled)
            urlPattern: /\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],

  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },

  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src')
    }
  },

  // sql.js requires special handling for WASM files
  optimizeDeps: {
    include: ['sql.js']
  },

  build: {
    target: 'es2022',
    sourcemap: process.env['NODE_ENV'] !== 'production'
  },

  server: {
    port: 5173,
    strictPort: true,
    // Enable CORS for local development
    cors: true,
    // Required headers for SharedArrayBuffer (needed by sql.js in some cases)
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },

  preview: {
    port: 4173,
    strictPort: true,
    // Required headers for SharedArrayBuffer (same as dev server)
    // sql.js WASM requires these headers to function correctly
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
}))
/* eslint-enable max-lines-per-function */
