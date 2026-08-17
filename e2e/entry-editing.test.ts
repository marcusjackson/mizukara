/**
 * E2E Test: Entry Editing Flow
 *
 * Tests the complete flow of editing existing journal entries:
 * - Create entry with test content
 * - Click Edit button on entry
 * - Verify editor replaces card view
 * - Verify textarea contains original content
 * - Modify content in textarea
 * - Click Save button
 * - Verify updated content displays
 * - Verify updated indicator shows
 * - Edit entry again, click Cancel
 * - Verify changes discarded, original content remains
 *
 * Requirements tested: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { expect, test } from '@playwright/test'

import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  cancelEntryEdit,
  createEntry,
  getEditorTextarea,
  getEntryEditor,
  isMobileViewport,
  saveEntryEdit,
  startEditingEntry,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Entry Editing Flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view (defaults to today)
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization
    await waitForPageReady(page)
  })

  test('edits entry content and saves successfully', async ({ page }) => {
    // Create a test entry first
    await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Get reference to first entry card (not filtered by content)
    const entryCard = page.getByTestId('entry-card').first()

    // Start editing (handles hover for desktop automatically)
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Verify editor replaces card view
    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()
    await expect(entryCard).not.toBeVisible()

    // Verify textarea contains original content
    const editorTextarea = getEditorTextarea(page)
    await expect(editorTextarea).toHaveValue(TEST_ENTRY_CONTENT.ORIGINAL)

    // Modify content in textarea
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.UPDATED)

    // Save changes
    await saveEntryEdit(page)

    // Verify card reappears (get fresh reference)
    await expect(page.getByTestId('entry-card').first()).toBeVisible()

    // Verify updated content displays
    await expect(
      page.getByTestId('entry-card').first().getByTestId('entry-content')
    ).toContainText(TEST_ENTRY_CONTENT.UPDATED)

    // Verify updated indicator shows (edited indicator)
    const updatedIndicator = page
      .getByTestId('entry-card')
      .first()
      .getByTestId('updated-indicator')
    await expect(updatedIndicator).toBeVisible()
    await expect(updatedIndicator).toContainText(/edited/i)

    // Verify created timestamp still shows
    await expect(
      page.getByTestId('entry-card').first().getByTestId('created-at')
    ).toBeVisible()
  })

  test('cancels editing and discards changes', async ({ page }) => {
    // Create a test entry first
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Start editing
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Verify editor is visible
    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    // Modify content in textarea
    const editorTextarea = getEditorTextarea(page)
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.DISCARDED)

    // Cancel editing
    await cancelEntryEdit(page)

    // Verify card reappears
    await expect(entryCard).toBeVisible()

    // Verify original content remains (changes were discarded)
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.ORIGINAL
    )

    // Verify discarded content is NOT present
    await expect(entryCard.getByTestId('entry-content')).not.toContainText(
      TEST_ENTRY_CONTENT.DISCARDED
    )

    // Verify no updated indicator (entry was not actually edited)
    await expect(entryCard.getByTestId('updated-indicator')).not.toBeVisible()
  })

  test('cancels editing via Escape key', async ({ page }) => {
    // Create a test entry first
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.ESCAPE_TEST)

    // Start editing
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Verify editor is visible
    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    // Modify content in textarea
    const editorTextarea = getEditorTextarea(page)
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.DISCARDED)

    // Press Escape key to cancel
    await page.keyboard.press('Escape')

    // Wait for editor to close and card to reappear
    await expect(editor).not.toBeVisible()
    await expect(entryCard).toBeVisible()

    // Verify original content remains
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.ESCAPE_TEST
    )

    // Verify discarded content is NOT present
    await expect(entryCard.getByTestId('entry-content')).not.toContainText(
      TEST_ENTRY_CONTENT.DISCARDED
    )
  })

  test('saves edited entry via keyboard shortcut', async ({ page }) => {
    // Create a test entry first
    await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Get reference to first entry card
    const entryCard = page.getByTestId('entry-card').first()

    // Start editing
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Verify editor is visible
    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    // Modify content in textarea
    const editorTextarea = getEditorTextarea(page)
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.UPDATED)

    // Ensure textarea is focused
    await editorTextarea.focus()

    // Save via keyboard shortcut (ControlOrMeta+s covers both Mac and Windows/Linux)
    await page.keyboard.press('ControlOrMeta+s')

    // Wait for editor to close and card to reappear
    await expect(editor).not.toBeVisible()
    await expect(page.getByTestId('entry-card').first()).toBeVisible()

    // Verify updated content displays
    await expect(
      page.getByTestId('entry-card').first().getByTestId('entry-content')
    ).toContainText(TEST_ENTRY_CONTENT.UPDATED)

    // Verify updated indicator shows
    await expect(
      page.getByTestId('entry-card').first().getByTestId('updated-indicator')
    ).toBeVisible()
  })

  test('displays correct timestamps before and after editing', async ({
    page
  }) => {
    // Create a test entry first
    await createEntry(page, TEST_ENTRY_CONTENT.TIMESTAMP_TEST)

    // Get reference to first entry card
    const entryCard = page.getByTestId('entry-card').first()

    // Capture original created timestamp
    const createdTimestamp = entryCard.getByTestId('created-at')
    const createdAtBefore = await createdTimestamp.textContent()

    // Start editing
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Modify and save
    const editorTextarea = getEditorTextarea(page)
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.UPDATED)
    await saveEntryEdit(page)

    // Wait for card to reappear (get fresh reference)
    const updatedCard = page.getByTestId('entry-card').first()
    await expect(updatedCard).toBeVisible()

    // Verify created timestamp remains the same
    const createdAtAfter = await updatedCard
      .getByTestId('created-at')
      .textContent()
    expect(createdAtAfter).toBe(createdAtBefore)

    // Verify updated indicator now shows
    await expect(updatedCard.getByTestId('updated-indicator')).toBeVisible()
  })
})
