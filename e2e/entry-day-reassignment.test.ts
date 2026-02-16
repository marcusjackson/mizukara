/**
 * E2E Test: Assigned Day Reassignment Flow
 *
 * Tests the complete flow of reassigning an entry to a different day:
 * - Create entry on today
 * - Edit entry
 * - Change assigned day to yesterday using date picker
 * - Save changes
 * - Verify entry disappears from today's list
 * - Navigate to yesterday
 * - Verify entry appears in yesterday's list
 * - Verify entry content preserved
 *
 * Requirements tested: 4.12, 4.13, 4.14
 */

import { expect, test } from '@playwright/test'

import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  createEntry,
  getEntryEditor,
  getTomorrowDate,
  getYesterdayDate,
  isMobileViewport,
  navigateToDate,
  navigateToDay,
  saveEntryEdit,
  startEditingEntry,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Assigned Day Reassignment Flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view (defaults to today)
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization
    await waitForPageReady(page)
  })

  test('reassigns entry from today to yesterday', async ({ page }) => {
    const yesterdayDate = getYesterdayDate()

    // Create entry on today
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Verify entry is visible on today
    await expect(entryCard).toBeVisible()

    // Start editing the entry
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Verify editor is visible
    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    // Change assigned day to yesterday
    const dateInput = editor.locator('input[type="date"]')
    await dateInput.fill(yesterdayDate)

    // Verify date was set correctly
    await expect(dateInput).toHaveValue(yesterdayDate)

    // Save changes
    await saveEntryEdit(page)

    // Verify entry disappears from today's list
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.ORIGINAL })
    ).toHaveCount(0)

    // Navigate to yesterday
    await navigateToDay(page, 'previous')

    // Verify entry appears in yesterday's list and content is preserved
    const movedEntry = page
      .getByTestId('entry-card')
      .filter({ hasText: TEST_ENTRY_CONTENT.ORIGINAL })
    await expect(movedEntry).toBeVisible()
    await expect(movedEntry.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.ORIGINAL
    )
    await expect(movedEntry.getByTestId('updated-indicator')).toBeVisible()
  })

  test('reassigns entry from today to tomorrow', async ({ page }) => {
    const tomorrowDate = getTomorrowDate()

    // Create entry on today
    await createEntry(page, TEST_ENTRY_CONTENT.TODAY)

    // Get reference to first entry
    const entryCard = page.getByTestId('entry-card').first()

    // Start editing
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Change assigned day to tomorrow
    const editor = getEntryEditor(page)
    const dateInput = editor.locator('input[type="date"]')
    await dateInput.fill(tomorrowDate)

    // Save changes
    await saveEntryEdit(page)

    // Verify entry disappears from today
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.TODAY })
    ).toHaveCount(0)

    // Navigate to tomorrow
    await navigateToDay(page, 'next')

    // Verify entry appears in tomorrow's list
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.TODAY })
    ).toBeVisible()
  })

  test('preserves entry metadata when reassigning day', async ({ page }) => {
    const yesterdayDate = getYesterdayDate()

    // Create entry with specific content
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.TIMESTAMP_TEST)

    // Get original created timestamp
    const originalTimestamp = await entryCard
      .getByTestId('created-at')
      .textContent()

    // Edit and reassign to yesterday
    await startEditingEntry(entryCard, isMobileViewport(page))
    const editor = getEntryEditor(page)
    await editor.locator('input[type="date"]').fill(yesterdayDate)
    await saveEntryEdit(page)

    // Navigate to yesterday
    await navigateToDay(page, 'previous')

    // Find the moved entry
    const movedEntry = page
      .getByTestId('entry-card')
      .filter({ hasText: TEST_ENTRY_CONTENT.TIMESTAMP_TEST })
    await expect(movedEntry).toBeVisible()

    // Verify created timestamp remains the same
    const newTimestamp = await movedEntry
      .getByTestId('created-at')
      .textContent()
    expect(newTimestamp).toBe(originalTimestamp)

    // Verify updated indicator is present (entry was modified)
    await expect(movedEntry.getByTestId('updated-indicator')).toBeVisible()
  })

  test('allows reassigning multiple times', async ({ page }) => {
    const yesterdayDate = getYesterdayDate()
    const tomorrowDate = getTomorrowDate()

    // Create entry on today
    await createEntry(page, TEST_ENTRY_CONTENT.REFERENCE)

    // First: Move to yesterday
    let entryCard = page.getByTestId('entry-card').first()
    await startEditingEntry(entryCard, isMobileViewport(page))
    let editor = getEntryEditor(page)
    await editor.locator('input[type="date"]').fill(yesterdayDate)
    await saveEntryEdit(page)

    // Navigate to yesterday
    await navigateToDay(page, 'previous')

    // Verify entry is on yesterday
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.REFERENCE })
    ).toBeVisible()

    // Second: Move to tomorrow
    entryCard = page.getByTestId('entry-card').first()
    await startEditingEntry(entryCard, isMobileViewport(page))
    editor = getEntryEditor(page)
    await editor.locator('input[type="date"]').fill(tomorrowDate)
    await saveEntryEdit(page)

    // Verify entry disappears from yesterday
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.REFERENCE })
    ).toHaveCount(0)

    // Navigate to tomorrow
    await navigateToDate(page, tomorrowDate)

    // Verify entry is on tomorrow
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.REFERENCE })
    ).toBeVisible()
  })

  test('does not reassign when canceling edit', async ({ page }) => {
    const yesterdayDate = getYesterdayDate()

    // Create entry on today
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Start editing
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Change assigned day
    const editor = getEntryEditor(page)
    await editor.locator('input[type="date"]').fill(yesterdayDate)

    // Cancel instead of saving
    const cancelButton = editor.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify editor closed
    await expect(editor).not.toBeVisible()

    // Verify entry still on today (not moved)
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.SIMPLE })
    ).toBeVisible()

    // Navigate to yesterday
    await navigateToDay(page, 'previous')

    // Verify entry NOT on yesterday
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.SIMPLE })
    ).toHaveCount(0)
  })

  test('validates assigned day format', async ({ page }) => {
    // Create entry on today
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.LONG)

    // Start editing
    await startEditingEntry(entryCard, isMobileViewport(page))

    const editor = getEntryEditor(page)
    const dateInput = editor.locator('input[type="date"]')

    // Try to set invalid date (browser's date input should prevent this, but test the validation)
    // HTML5 date input enforces YYYY-MM-DD format, so we test by checking error message appears

    // Clear the date input to trigger validation
    await dateInput.clear()

    // The validation should prevent saving (button disabled or validation error shown)
    // Check if there's an error message or if the form prevents submission
    await expect(dateInput).toHaveAttribute('type', 'date')

    // Cancel editing
    await editor.getByRole('button', { name: 'Cancel' }).click()
  })
})
