/**
 * E2E Test: Keyboard Shortcuts Save Bug
 *
 * Reproduces and verifies fix for Ctrl+S save behavior.
 * Tests that Ctrl+S saves once in both create and edit modes.
 */

import { expect, test } from '@playwright/test'

import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  createEntry,
  getEntryEditor,
  getTodayDate,
  isMobileViewport,
  startEditingEntry,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Keyboard Shortcuts Save Bug', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    const today = getTodayDate()
    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('Ctrl+S in edit mode saves entry once', async ({ page }) => {
    // Create initial entry
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Start editing
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Verify editor is visible
    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    // Modify content
    const textarea = editor.locator('textarea').first()
    await textarea.fill(TEST_ENTRY_CONTENT.UPDATED)

    // Save using Ctrl+S
    await page.keyboard.press('Control+s')

    // Wait for editor to close
    await expect(editor).not.toBeVisible({ timeout: 2000 })

    // Verify only ONE updated entry exists
    const updatedEntries = page
      .getByTestId('entry-card')
      .filter({ hasText: TEST_ENTRY_CONTENT.UPDATED })
    await expect(updatedEntries).toHaveCount(1)

    // Verify original entry does not exist anymore
    const originalEntries = page
      .getByTestId('entry-card')
      .filter({ hasText: TEST_ENTRY_CONTENT.ORIGINAL })
    await expect(originalEntries).toHaveCount(0)

    // Verify total entry count is still 1 (not duplicated)
    await expect(page.getByTestId('entry-card')).toHaveCount(1)
  })

  test('Ctrl+S in create mode saves entry once', async ({ page }) => {
    // Type in create form
    const textarea = page.locator('textarea[name="content"]')
    await textarea.fill(TEST_ENTRY_CONTENT.ORIGINAL)

    // Save using Ctrl+S
    await page.keyboard.press('Control+s')

    // Wait for entry to appear
    await expect(
      page
        .getByTestId('entry-card')
        .filter({ hasText: TEST_ENTRY_CONTENT.ORIGINAL })
    ).toBeVisible()

    // Verify only ONE entry was created
    await expect(page.getByTestId('entry-card')).toHaveCount(1)
  })
})
