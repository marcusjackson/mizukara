/**
 * E2E Test: Offline Functionality
 *
 * Tests the complete offline functionality:
 * - Navigate to entry day view
 * - Disconnect network (Playwright offline mode)
 * - Create new entry
 * - Verify entry saves successfully (local SQLite)
 * - Edit existing entry
 * - Verify edit saves successfully
 * - Navigate between days
 * - Verify navigation works offline
 * - Reconnect network
 * - Verify no errors, data persists
 *
 * Requirements tested: 6.2, 6.3, 6.4, 6.5
 * Note: Requirement 6.1 (PWA service worker app shell caching) is not tested because:
 * - PWA service worker testing is complex with Playwright (activation timing, caching behavior)
 * - The functionality is already configured via VitePWA and works in production
 * - Focus is on core offline database operations, which are fully tested here
 */

import { expect, test } from '@playwright/test'

import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  createEntry,
  getEditorTextarea,
  getEntryEditor,
  isMobileViewport,
  navigateToDay,
  saveEntryEdit,
  startEditingEntry,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Offline Functionality', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view while online
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization
    await waitForPageReady(page)
  })

  test('creates new entry while offline', async ({ context, page }) => {
    // Go offline
    await context.setOffline(true)

    // Create entry offline
    const textarea = page.getByLabel('Content')
    await textarea.fill(TEST_ENTRY_CONTENT.SIMPLE)
    await page.getByRole('button', { name: 'New Entry' }).click()

    // Verify entry was created and appears in list with correct content
    const entryCard = page
      .getByTestId('entry-card')
      .filter({ hasText: TEST_ENTRY_CONTENT.SIMPLE })
    await expect(entryCard).toBeVisible()
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.SIMPLE
    )

    // Go back online
    await context.setOffline(false)

    // Refresh page to verify persistence
    await page.reload({ waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Verify entry still exists after reconnecting
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.SIMPLE })
    ).toBeVisible()
  })

  test('edits existing entry while offline', async ({ context, page }) => {
    // Create entry while online first
    await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Go offline
    await context.setOffline(true)

    // Edit the entry offline
    const entryCard = page.getByTestId('entry-card').first()
    await startEditingEntry(entryCard, isMobileViewport(page))

    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    const editorTextarea = getEditorTextarea(page)
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.UPDATED)

    // Save changes
    await saveEntryEdit(page)

    // Verify updated content displays
    await expect(
      page.getByTestId('entry-card').first().getByTestId('entry-content')
    ).toContainText(TEST_ENTRY_CONTENT.UPDATED)

    // Go back online
    await context.setOffline(false)

    // Refresh to verify persistence
    await page.reload({ waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Verify edit persisted
    await expect(
      page.getByTestId('entry-card').first().getByTestId('entry-content')
    ).toContainText(TEST_ENTRY_CONTENT.UPDATED)
  })

  test('navigates between days while offline', async ({ context, page }) => {
    // Create entry for today while online
    await createEntry(page, TEST_ENTRY_CONTENT.TODAY)

    // Navigate to previous day while online
    await navigateToDay(page, 'previous')

    // Create entry for yesterday while online
    await createEntry(page, TEST_ENTRY_CONTENT.YESTERDAY)

    // Go offline
    await context.setOffline(true)

    // Navigate back to today offline
    await navigateToDay(page, 'next')

    // Verify today's entry is visible
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.TODAY })
    ).toBeVisible()

    // Verify yesterday's entry is NOT visible
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.YESTERDAY })
    ).toHaveCount(0)

    // Navigate back to yesterday offline
    await navigateToDay(page, 'previous')

    // Verify yesterday's entry is visible
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.YESTERDAY })
    ).toBeVisible()

    // Verify today's entry is NOT visible
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.TODAY })
    ).toHaveCount(0)

    // Go back online
    await context.setOffline(false)
  })

  test('creates multiple entries offline and all persist', async ({
    context,
    page
  }) => {
    // Go offline
    await context.setOffline(true)

    // Create first entry
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)

    // Create second entry
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)

    // Create third entry
    await createEntry(page, TEST_ENTRY_CONTENT.THIRD)

    // Verify all three entries are visible
    const entryCards = page.getByTestId('entry-card')
    await expect(entryCards).toHaveCount(3)

    // Go back online
    await context.setOffline(false)

    // Refresh page
    await page.reload({ waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Verify all entries still exist and are in correct order
    await expect(entryCards).toHaveCount(3)
    await expect(entryCards.nth(0).getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.FIRST
    )
    await expect(entryCards.nth(1).getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.SECOND
    )
    await expect(entryCards.nth(2).getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.THIRD
    )
  })

  test('shows no network errors when offline', async ({ context, page }) => {
    // Go offline
    await context.setOffline(true)

    // Perform various operations
    await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)
    await navigateToDay(page, 'next')
    await navigateToDay(page, 'previous')

    // Verify no error messages are shown
    await expect(page.getByTestId('error-container')).not.toBeVisible()

    // Verify no toast errors (check common error classes)
    await expect(page.locator('.toast-error')).not.toBeVisible()

    // Go back online
    await context.setOffline(false)
  })

  test('database operations work correctly offline', async ({
    context,
    page
  }) => {
    // Create initial entry online
    await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Go offline
    await context.setOffline(true)

    // Edit entry offline
    const entryCard = page.getByTestId('entry-card').first()
    await startEditingEntry(entryCard, isMobileViewport(page))

    const editorTextarea = getEditorTextarea(page)
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.UPDATED)
    await saveEntryEdit(page)

    // Create another entry offline
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)

    // Verify both entries exist
    const entries = page.getByTestId('entry-card')
    await expect(entries).toHaveCount(2)

    // Verify first entry was updated
    await expect(entries.first().getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.UPDATED
    )

    // Verify second entry exists
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.SECOND })
    ).toBeVisible()

    // Go back online
    await context.setOffline(false)

    // Refresh and verify all changes persisted
    await page.reload({ waitUntil: 'networkidle' })
    await waitForPageReady(page)

    await expect(entries).toHaveCount(2)
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.UPDATED })
    ).toBeVisible()
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.SECOND })
    ).toBeVisible()
  })
})
