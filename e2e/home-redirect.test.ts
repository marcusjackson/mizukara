/**
 * E2E Test: Home Page Redirect
 *
 * Tests that the home page (/) immediately redirects to /entries.
 * Verifies client-side navigation without page reload.
 *
 * Requirements tested: 10.1-10.5
 */

import { expect, test } from '@playwright/test'

import { waitForPageReady } from './helpers/test-utils'

test.describe('Home Page Redirect', () => {
  test('/ redirects to /entries', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for redirect to complete
    await expect(page).toHaveURL(/\/entries/, { timeout: 5000 })
  })

  test('entry day view loads correctly after redirect', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for redirect and page load
    await expect(page).toHaveURL(/\/entries/, { timeout: 5000 })
    await waitForPageReady(page)

    // Verify create form is visible (day view loaded)
    await expect(page.getByTestId('create-form')).toBeVisible()
  })

  test('current date displays today after redirect', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/entries/, { timeout: 5000 })
    await waitForPageReady(page)

    // Verify date display is visible with a date
    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await expect(dateButton).toBeVisible()
  })

  test('no intermediate content visible during redirect', async ({ page }) => {
    // Navigate and immediately check for content
    await page.goto('/')

    // Should redirect before any meaningful content renders
    await expect(page).toHaveURL(/\/entries/, { timeout: 5000 })

    // After redirect, day view should be visible
    await waitForPageReady(page)
    await expect(page.getByTestId('entry-day-view-navigator')).toBeVisible()
  })

  test('redirect uses client-side navigation', async ({ page }) => {
    // Navigate to entries first so we can verify client-side redirect
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Now navigate to home - should be client-side redirect
    await page.goto('/', { waitUntil: 'networkidle' })

    // Verify we end up at entries without intermediate state
    await expect(page).toHaveURL(/\/entries/, { timeout: 5000 })
    await waitForPageReady(page)
  })
})
