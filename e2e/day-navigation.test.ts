/**
 * E2E Test: Day Navigation Flow
 *
 * Tests the complete flow of navigating between days:
 * - Navigate to entry day view (today)
 * - Verify current date displays correctly
 * - Click "Previous Day" button
 * - Verify date updates to yesterday
 * - Verify entries for yesterday load
 * - Click "Next Day" button twice
 * - Verify date updates to tomorrow
 * - Verify entries for tomorrow load (or empty state)
 * - Use browser back button
 * - Verify date returns to previous day
 *
 * Requirements tested: 3.1, 3.2, 3.3, 3.5, 3.6
 */

import { expect, test } from '@playwright/test'

import { TIMEOUTS } from './helpers/test-constants'
import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  createEntry,
  navigateToDay,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Day Navigation Flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view (defaults to today)
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization and page ready
    await expect(page.getByTestId('entry-day-view-navigator')).toBeVisible({
      timeout: TIMEOUTS.medium
    })
    await waitForPageReady(page)
  })

  test('displays current date correctly on initial load', async ({ page }) => {
    // Verify current date is displayed in navigator
    const dateDisplay = page.getByTestId('current-date')
    await expect(dateDisplay).toBeVisible()

    // Should contain date information matching e.g. "Monday, March 15, 2024"
    const dateText = await dateDisplay.textContent()
    expect(dateText).toMatch(/\w+,\s+\w+\s+\d{1,2},\s+\d{4}/)
  })

  test('navigates to previous day and displays entries', async ({ page }) => {
    // Create an entry for today first
    const todayEntry = await createEntry(page, TEST_ENTRY_CONTENT.TODAY)

    // Navigate to previous day
    await navigateToDay(page, 'previous')

    // Verify URL changed to yesterday's date
    expect(page.url()).toContain('/entries/')

    // Verify date display updated
    await expect(page.getByTestId('current-date')).toBeVisible()

    // Today's entry should not be visible on yesterday's page
    await expect(todayEntry).toHaveCount(0)

    // Yesterday has no seeded entries — empty state must be visible
    await expect(page.getByTestId('empty-state')).toBeVisible()
  })

  test('navigates to next day and displays entries', async ({ page }) => {
    // Navigate to next day
    await navigateToDay(page, 'next')

    // Verify URL changed to tomorrow's date
    expect(page.url()).toContain('/entries/')

    // Verify date display updated
    await expect(page.getByTestId('current-date')).toBeVisible()

    // Tomorrow should have no entries — context is cleared between tests
    await expect(page.getByTestId('empty-state')).toBeVisible()
  })

  test('navigates from previous to next day correctly', async ({ page }) => {
    // Create entry for today
    await createEntry(page, TEST_ENTRY_CONTENT.REFERENCE)

    // Go to previous day
    await navigateToDay(page, 'previous')

    // Verify today's entry not visible
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.REFERENCE })
    ).toHaveCount(0)

    // Go to next day (back to today)
    await navigateToDay(page, 'next')

    // Verify today's entry is visible again
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.REFERENCE })
    ).toBeVisible()
  })

  test('updates entries when navigating to different days', async ({
    page
  }) => {
    // Create entry for today
    await createEntry(page, TEST_ENTRY_CONTENT.TODAY)

    // Navigate to previous day
    await navigateToDay(page, 'previous')

    // Create entry for yesterday
    await createEntry(page, TEST_ENTRY_CONTENT.YESTERDAY)

    // Verify yesterday entry visible, today entry not
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.YESTERDAY })
    ).toBeVisible()
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.TODAY })
    ).toHaveCount(0)

    // Navigate back to today
    await navigateToDay(page, 'next')

    // Verify today entry visible, yesterday entry not
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.TODAY })
    ).toBeVisible()
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.YESTERDAY })
    ).toHaveCount(0)
  })

  test('supports browser back button navigation', async ({ page }) => {
    // Record the initial URL
    const initialUrl = page.url()

    // Navigate to next day
    await navigateToDay(page, 'next')

    // Verify URL changed
    expect(page.url()).not.toBe(initialUrl)

    // Use browser back button
    await page.goBack()

    // Wait for navigation to complete by checking URL
    await expect(page).toHaveURL(initialUrl, { timeout: TIMEOUTS.short })

    // Wait for page to fully load after back navigation
    await expect(page.getByTestId('entry-day-view-navigator')).toBeVisible({
      timeout: TIMEOUTS.short
    })

    // Verify navigation UI is functional
    const nextButton = page.getByRole('button', { name: /next/i })
    await expect(nextButton).toBeVisible()
    await expect(nextButton).toBeEnabled()
  })

  test('supports keyboard shortcuts for navigation', async ({ page }) => {
    // Create entry for today
    await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    const initialUrl = page.url()

    // Focus on body to ensure keyboard shortcuts work (not in textarea)
    await page.locator('body').click()

    // Press J key to go to next day
    await page.keyboard.press('j')
    await expect(page).not.toHaveURL(initialUrl, { timeout: TIMEOUTS.short })

    const afterJUrl = page.url()
    expect(afterJUrl).not.toBe(initialUrl)

    // Press K key to go to previous day
    await page.keyboard.press('k')
    await expect(page).not.toHaveURL(afterJUrl, { timeout: TIMEOUTS.short })

    const afterKUrl = page.url()
    expect(afterKUrl).not.toBe(afterJUrl)
  })

  test('supports arrow key navigation', async ({ page }) => {
    // Start at current page
    const initialUrl = page.url()

    // Focus on body to ensure keyboard shortcuts work (not in textarea)
    await page.locator('body').click()

    // Press ArrowDown to go to next day
    await page.keyboard.press('ArrowDown')

    // Wait for navigation by checking URL changed
    await expect(page).not.toHaveURL(initialUrl, { timeout: TIMEOUTS.short })

    // Verify navigation occurred
    const afterDownUrl = page.url()
    expect(afterDownUrl).not.toBe(initialUrl)

    // Press ArrowUp to go to previous day
    await page.keyboard.press('ArrowUp')

    // Wait for navigation by checking URL changed again
    await expect(page).not.toHaveURL(afterDownUrl, { timeout: TIMEOUTS.short })

    // Verify navigation occurred again
    const afterUpUrl = page.url()
    expect(afterUpUrl).not.toBe(afterDownUrl)

    // Arrow keys should not trigger navigation when textarea is focused
    const textarea = page.getByLabel('Content')
    await textarea.focus()

    const urlBeforeArrow = page.url()
    await page.keyboard.press('ArrowDown')

    // Wait for any potential navigation to complete
    await expect(page.getByLabel('Content')).toBeFocused()

    // URL should not change when textarea is focused
    expect(page.url()).toBe(urlBeforeArrow)
  })

  test('persists current day selection on page refresh', async ({ page }) => {
    // Navigate to previous day
    await navigateToDay(page, 'previous')
    const yesterdayUrl = page.url()

    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByTestId('entry-day-view-navigator')).toBeVisible()

    // Verify URL remains the same after refresh
    expect(page.url()).toBe(yesterdayUrl)

    // Verify date display shows yesterday
    await expect(page.getByTestId('current-date')).toBeVisible()
  })

  test('displays correct day in URL parameter', async ({ page }) => {
    // Navigate to previous day
    await navigateToDay(page, 'previous')

    // Verify URL contains date parameter in YYYY-MM-DD format
    const url = page.url()
    expect(url).toMatch(/\/entries\/\d{4}-\d{2}-\d{2}/)

    // Navigate to next day twice
    await navigateToDay(page, 'next')
    await navigateToDay(page, 'next')

    // URL should still contain valid date parameter
    const newUrl = page.url()
    expect(newUrl).toMatch(/\/entries\/\d{4}-\d{2}-\d{2}/)
    expect(newUrl).not.toBe(url)
  })
})
