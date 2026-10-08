// Embeds text in headless Chromium so no native onnxruntime-node binary is needed (none exists for
// Intel macOS). Node stays in charge of data and scoring. Vectors are cached on disk by
// (model, dtype, text), so reruns only pay for new text.
import http from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'

const ROOT = path.resolve(import.meta.dirname, '../..')
const CACHE_DIR = path.join(import.meta.dirname, '.cache')
const BATCH = 32
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.wasm': 'application/wasm',
  '.json': 'application/json'
}

export async function startEmbedder() {
  const server = http.createServer(async (req, res) => {
    try {
      const file = path.join(
        ROOT,
        decodeURIComponent(new URL(req.url, 'http://x').pathname)
      )
      const body = await readFile(file)
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream'
      })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise((resolve) => server.listen(0, resolve))
  const browser = await chromium.launch()
  const page = await browser.newPage()
  page.on(
    'console',
    (m) => m.type() === 'error' && console.error('[console]', m.text())
  )
  page.on('pageerror', (e) => console.error('[pageerror]', e.message))
  await page.goto(
    `http://localhost:${server.address().port}/scripts/tag-head/embedder.html`
  )
  await page.waitForFunction('window.ready === true')
  await mkdir(CACHE_DIR, { recursive: true })

  async function embed(model, dtype, texts) {
    const key = createHash('md5').update(`${model}|${dtype}`).digest('hex')
    const cacheFile = path.join(CACHE_DIR, `${key}.json`)
    const store = existsSync(cacheFile)
      ? JSON.parse(readFileSync(cacheFile, 'utf8'))
      : {}
    const missing = [...new Set(texts.filter((t) => !(t in store)))]
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH)
      const vectors = await page.evaluate(
        ([m, d, t]) => window.api.embed(m, d, t),
        [model, dtype, batch]
      )
      batch.forEach((t, j) => (store[t] = vectors[j]))
      console.error(
        `embedded ${Math.min(i + BATCH, missing.length)}/${missing.length}`
      )
    }
    if (missing.length) await writeFile(cacheFile, JSON.stringify(store))
    return texts.map((t) => store[t])
  }

  return {
    embed,
    close: async () => {
      await browser.close()
      server.close()
    }
  }
}
