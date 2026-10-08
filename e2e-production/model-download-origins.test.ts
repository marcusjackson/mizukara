/**
 * Production E2E: where the model download reaches
 *
 * The app promises that nothing leaves the device except the one model
 * download. A production build once fetched its ONNX runtime from a public CDN
 * on top of that; the dev server never did, so nothing else caught it.
 *
 * This downloads and loads the real model, so it needs the network.
 */

import { expect, test } from '@playwright/test'

const APP_ORIGIN = 'http://localhost:4199'
const MODEL_HOSTS = /(^|\.)(huggingface\.co|hf\.co)$/

test('the model download reaches only the app and the model host', async ({
  context,
  page
}) => {
  const foreign = new Set<string>()
  // On the context, not the page: it also sees what the service worker fetches.
  context.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol === 'data:' || url.protocol === 'blob:') return
    if (url.origin === APP_ORIGIN || MODEL_HOSTS.test(url.hostname)) return
    foreign.add(url.origin)
  })

  await page.goto('/settings')
  await page.getByRole('button', { name: /Download/ }).click()

  // "In use" appears only once the model has loaded from the bundled runtime;
  // a failed or cancelled download can leave a Delete button without it.
  await expect(page.getByText('In use')).toBeVisible()
  await page.waitForLoadState('networkidle')

  expect([...foreign]).toEqual([])
})
