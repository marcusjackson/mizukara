/**
 * E2E Test: Date Picker Navigation
 *
 * Tests the date picker dialog for direct date navigation.
 * Verifies opening, date selection, validation, and keyboard shortcuts.
 *
 * Requirements tested: 11.1-11.10
 */

import { expect, test } from '@playwright/test'

import { getTodayDate, waitForPageReady } from './helpers/test-utils'

test.describe('Date Picker Navigation', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('opens date picker via trigger button', async ({ page }) => {
    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await dateButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Jump to Date')).toBeVisible()
  })

  test('date input pre-filled with current date', async ({ page }) => {
    const today = getTodayDate()

    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await dateButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const input = dialog.getByLabel(/select date/i)
    await expect(input).toHaveValue(today)
  })

  test('navigates to selected date', async ({ page }) => {
    const targetDate = '2026-03-01'

    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await dateButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const input = dialog.getByLabel(/select date/i)
    await input.fill(targetDate)

    await dialog.getByRole('button', { name: /go to date/i }).click()

    // Dialog closes
    await expect(dialog).not.toBeVisible()

    // Page navigates to target date
    await expect(page).toHaveURL(new RegExp(`/entries/${targetDate}`), {
      timeout: 3000
    })
  })

  test('cancel closes dialog without navigation', async ({ page }) => {
    const today = getTodayDate()
    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await dateButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /cancel/i }).click()

    // Dialog closes
    await expect(dialog).not.toBeVisible()

    // URL unchanged (still on today)
    await expect(page).toHaveURL(new RegExp(`/entries/${today}`))
  })

  test('G key opens date picker', async ({ page }) => {
    // Click outside to ensure no input focused
    await page.locator('body').click({ position: { x: 10, y: 10 } })

    await page.keyboard.press('g')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Jump to Date')).toBeVisible()
  })

  test('G key does not open picker when input focused', async ({ page }) => {
    // Focus the create form textarea
    const textarea = page.getByLabel('Content')
    await textarea.focus()

    // Press G - should type 'g' instead of opening picker
    await page.keyboard.press('g')

    // Dialog should not open
    const dialog = page.getByRole('dialog')
    await expect(dialog).not.toBeVisible({ timeout: 1000 })

    // 'g' should be typed in textarea
    await expect(textarea).toHaveValue('g')
  })

  test('shows validation error for invalid date', async ({ page }) => {
    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await dateButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const input = dialog.getByLabel(/select date/i)
    // Clear and type invalid value
    await input.fill('')
    await input.pressSequentially('invalid-date', { delay: 50 })

    await dialog.getByRole('button', { name: /go to date/i }).click()

    // Validation error visible
    await expect(dialog.getByText(/invalid date/i)).toBeVisible()

    // Dialog stays open
    await expect(dialog).toBeVisible()
  })

  test('Escape closes date picker', async ({ page }) => {
    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await dateButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(dialog).not.toBeVisible()
  })

  test('date picker works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await dateButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Input should be visible and usable
    const input = dialog.getByLabel(/select date/i)
    await expect(input).toBeVisible()

    // Navigate to a date
    await input.fill('2026-03-15')
    await dialog.getByRole('button', { name: /go to date/i }).click()

    await expect(dialog).not.toBeVisible()
    await expect(page).toHaveURL(/\/entries\/2026-03-15/, { timeout: 3000 })
  })

  test('date picker entries reload after navigation', async ({ page }) => {
    // Navigate to a specific date and verify entries page loads
    const dateButton = page.getByRole('button', { name: /jump to date/i })
    await dateButton.click()

    const dialog = page.getByRole('dialog')
    const input = dialog.getByLabel(/select date/i)
    await input.fill('2026-01-15')
    await dialog.getByRole('button', { name: /go to date/i }).click()

    await expect(dialog).not.toBeVisible()
    await expect(page).toHaveURL(/\/entries\/2026-01-15/, { timeout: 3000 })

    // Page should show the day view for that date
    await waitForPageReady(page)
    await expect(page.getByTestId('entry-day-view-navigator')).toBeVisible()
  })
})
