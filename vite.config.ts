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
        start_url: '.',
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
        // Cache all static assets. `wasm` is kept so sql.js's own ~660 KB
        // binary stays precached — it is needed before the app can read
        // anything at all.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,wasm}'],
        // ONNX Runtime's WASM binary (~24 MB; 23.6 MB measured in the
        // embedding build) and the inference worker chunk
        // that carries Transformers.js (~500 KB) are only ever needed by the
        // local-inference feature, which most sessions never enable.
        // Precaching them would spend that on every install, phones included.
        // Both are picked up on first use by the runtime rules below instead —
        // which always happens while online, since the worker is what performs
        // the model download in the first place.
        // Re-derive sizes with: ls -l dist/assets/*.wasm dist/*.wasm
        globIgnores: ['**/ort-*.wasm', '**/inference-worker-*.js'],
        // Explicit guard rather than Workbox's 2 MiB default. vite-plugin-pwa
        // *throws* when a file exceeds this — the build fails outright, it does
        // not warn and skip. Keep this above the largest precached asset and
        // check `ls -lS dist/assets/ | head` before raising it further, since
        // raising it silently admits anything in the new band.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // ONNX Runtime's WASM, served from our own origin but deliberately
            // kept out of the precache manifest above. The Cache API has no
            // per-entry size cap, so caching it here on first use is fine.
            urlPattern: /\/assets\/ort-.*\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'onnx-runtime-wasm',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // The inference worker chunk, likewise excluded from precache.
            urlPattern: /\/assets\/inference-worker-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'inference-worker',
              expiration: {
                maxEntries: 4,
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
    include: ['sql.js'],
    // esbuild's pre-bundling rewrites onnxruntime-web's dynamic WASM loading
    // and breaks it on the dev server. Let Vite serve the package as-is.
    exclude: ['@huggingface/transformers']
  },

  build: {
    target: 'es2022',
    sourcemap: process.env['NODE_ENV'] !== 'production'
  },

  // The inference worker pulls in Transformers.js, which dynamically imports
  // its ONNX backends. Vite's default worker format is 'iife', which cannot
  // code-split — the build errors rather than degrading.
  worker: {
    format: 'es'
  },

  // This app is deliberately not cross-origin isolated. The COOP/COEP headers
  // that used to be set here claimed sql.js required them; it does not — the
  // shipped build is single-threaded and uses no SharedArrayBuffer. GitHub
  // Pages never sends them and ignores a static _headers file, so setting them here
  // only made dev and preview behave unlike production.
  server: {
    port: 5173,
    strictPort: true,
    // Enable CORS for local development
    cors: true
  },

  preview: {
    port: 4173,
    strictPort: true
  }
}))
/* eslint-enable max-lines-per-function */
