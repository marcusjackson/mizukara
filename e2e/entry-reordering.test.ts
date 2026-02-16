/**
 * E2E Test: Entry Reordering Flow
 *
 * Tests the complete flow of reordering journal entries within a day:
 * - Create multiple entries on the same day
 * - Enter reorder mode
 * - Use Move Up/Down buttons to reorder entries
 * - Verify boundary checks (first entry can't move up, last can't move down)
 * - Exit reorder mode and verify order persists
 * - Refresh page and verify custom order persists
 *
 * Requirements tested: 4.9, 4.10, 4.11
 */

import { expect, test } from '@playwright/test'

import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import { createEntry, waitForPageReady } from './helpers/test-utils'

test.describe('Entry Reordering Flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view (defaults to today)
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization using web-first assertion
    await waitForPageReady(page)
  })

  test('enters and exits reorder mode', async ({ page }) => {
    // Create multiple entries to enable reorder mode
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)

    // Wait for entries to appear
    await expect(page.getByTestId('entry-card')).toHaveCount(2)

    // Verify reorder button appears
    const reorderButton = page.getByRole('button', { name: /reorder entries/i })
    await expect(reorderButton).toBeVisible()

    // Enter reorder mode
    await reorderButton.click()

    // Button text changes to "Done"
    await expect(
      page.getByRole('button', { name: /done reordering/i })
    ).toBeVisible()

    // Move buttons should be visible
    const moveUpButtons = page.getByRole('button', { name: /move up/i })
    await expect(moveUpButtons.first()).toBeVisible()

    // Exit reorder mode
    await page.getByRole('button', { name: /done reordering/i }).click()

    // Back to regular mode
    await expect(
      page.getByRole('button', { name: /reorder entries/i })
    ).toBeVisible()

    // Move buttons should be hidden
    await expect(moveUpButtons.first()).not.toBeVisible()
  })

  test('moves entry up in the list', async ({ page }) => {
    // Create three entries in order
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)
    await createEntry(page, TEST_ENTRY_CONTENT.THIRD)

    // Verify initial order
    const entriesBeforeReorder = page.getByTestId('entry-content')
    await expect(entriesBeforeReorder.nth(0)).toContainText(
      TEST_ENTRY_CONTENT.FIRST
    )
    await expect(entriesBeforeReorder.nth(1)).toContainText(
      TEST_ENTRY_CONTENT.SECOND
    )
    await expect(entriesBeforeReorder.nth(2)).toContainText(
      TEST_ENTRY_CONTENT.THIRD
    )

    // Enter reorder mode
    await page.getByRole('button', { name: /reorder entries/i }).click()

    // Move second entry up
    const moveUpButtons = page.getByRole('button', { name: /move up entry 2/i })
    await moveUpButtons.click()

    // Verify new order (second entry should now be first)
    await expect(entriesBeforeReorder.nth(0)).toContainText(
      TEST_ENTRY_CONTENT.SECOND
    )
    await expect(entriesBeforeReorder.nth(1)).toContainText(
      TEST_ENTRY_CONTENT.FIRST
    )
    await expect(entriesBeforeReorder.nth(2)).toContainText(
      TEST_ENTRY_CONTENT.THIRD
    )
  })

  test('moves entry down in the list', async ({ page }) => {
    // Create three entries
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)
    await createEntry(page, TEST_ENTRY_CONTENT.THIRD)

    // Enter reorder mode
    await page.getByRole('button', { name: /reorder entries/i }).click()

    // Move first entry down
    const moveDownButton = page.getByRole('button', {
      name: /move down entry 1/i
    })
    await moveDownButton.click()

    // Verify new order (first entry should now be second)
    const entries = page.getByTestId('entry-content')
    await expect(entries.nth(0)).toContainText(TEST_ENTRY_CONTENT.SECOND)
    await expect(entries.nth(1)).toContainText(TEST_ENTRY_CONTENT.FIRST)
    await expect(entries.nth(2)).toContainText(TEST_ENTRY_CONTENT.THIRD)
  })

  test('disables move up button for first entry', async ({ page }) => {
    // Create two entries
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)

    // Enter reorder mode
    await page.getByRole('button', { name: /reorder entries/i }).click()

    // First entry's move up button should be disabled
    const firstMoveUp = page.getByRole('button', { name: /move up entry 1/i })
    await expect(firstMoveUp).toBeDisabled()

    // Second entry's move up button should be enabled
    const secondMoveUp = page.getByRole('button', { name: /move up entry 2/i })
    await expect(secondMoveUp).toBeEnabled()
  })

  test('disables move down button for last entry', async ({ page }) => {
    // Create two entries
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)

    // Enter reorder mode
    await page.getByRole('button', { name: /reorder entries/i }).click()

    // First entry's move down button should be enabled
    const firstMoveDown = page.getByRole('button', {
      name: /move down entry 1/i
    })
    await expect(firstMoveDown).toBeEnabled()

    // Last entry's move down button should be disabled
    const secondMoveDown = page.getByRole('button', {
      name: /move down entry 2/i
    })
    await expect(secondMoveDown).toBeDisabled()
  })

  test('hides edit buttons in reorder mode', async ({ page }) => {
    // Create two entries
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)

    // Edit buttons visible in view mode
    const editButtons = page.getByRole('button', { name: /edit entry/i })
    await expect(editButtons.first()).toBeVisible()

    // Enter reorder mode
    await page.getByRole('button', { name: /reorder entries/i }).click()

    // Edit buttons should be hidden
    await expect(editButtons.first()).not.toBeVisible()

    // Exit reorder mode
    await page.getByRole('button', { name: /done reordering/i }).click()

    // Edit buttons visible again
    await expect(editButtons.first()).toBeVisible()
  })

  test('custom order persists after page refresh', async ({ page }) => {
    // Create three entries
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)
    await createEntry(page, TEST_ENTRY_CONTENT.THIRD)

    // Enter reorder mode
    await page.getByRole('button', { name: /reorder entries/i }).click()

    // Move second entry to first position
    await page.getByRole('button', { name: /move up entry 2/i }).click()

    // Exit reorder mode
    await page.getByRole('button', { name: /done reordering/i }).click()

    // Verify new order
    let entries = page.getByTestId('entry-content')
    await expect(entries.nth(0)).toContainText(TEST_ENTRY_CONTENT.SECOND)
    await expect(entries.nth(1)).toContainText(TEST_ENTRY_CONTENT.FIRST)

    // Refresh page
    await page.reload({ waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Wait for entries to be loaded from database after reload
    entries = page.getByTestId('entry-content')
    await expect(entries).toHaveCount(3, { timeout: 3000 })

    // Verify order persists
    await expect(entries.nth(0)).toContainText(TEST_ENTRY_CONTENT.SECOND)
    await expect(entries.nth(1)).toContainText(TEST_ENTRY_CONTENT.FIRST)
    await expect(entries.nth(2)).toContainText(TEST_ENTRY_CONTENT.THIRD)
  })

  test('does not show reorder button when no entries exist', async ({
    page
  }) => {
    // With no entries, reorder button should not be visible
    await expect(
      page.getByRole('button', { name: /reorder/i })
    ).not.toBeVisible()
  })

  test('does not show reorder button when only one entry exists', async ({
    page
  }) => {
    // Create single entry
    await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Reorder button should not be visible
    await expect(
      page.getByRole('button', { name: /reorder/i })
    ).not.toBeVisible()
  })

  test('multiple reorder operations work correctly', async ({ page }) => {
    // Create three entries
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)
    await createEntry(page, TEST_ENTRY_CONTENT.THIRD)

    // Enter reorder mode
    await page.getByRole('button', { name: /reorder entries/i }).click()

    // Move second entry up (Second becomes first)
    await page.getByRole('button', { name: /move up entry 2/i }).click()

    // Now move the new second entry (original First) down (First becomes third)
    await page.getByRole('button', { name: /move down entry 2/i }).click()

    // Final order should be: Second, Third, First
    const entries = page.getByTestId('entry-content')
    await expect(entries.nth(0)).toContainText(TEST_ENTRY_CONTENT.SECOND)
    await expect(entries.nth(1)).toContainText(TEST_ENTRY_CONTENT.THIRD)
    await expect(entries.nth(2)).toContainText(TEST_ENTRY_CONTENT.FIRST)
  })
})
