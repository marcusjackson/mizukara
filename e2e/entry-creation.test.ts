/**
 * E2E Test: Entry Creation Flow
 *
 * Tests the complete flow of creating new journal entries:
 * - Navigate to entry day view (defaults to today)
 * - Type content into create form textarea
 * - Click "New Entry" button
 * - Verify entry appears in list
 * - Verify entry content matches input
 * - Verify created timestamp displayed
 * - Verify textarea cleared after save
 * - Create multiple entries to verify list ordering
 *
 * Requirements tested: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { expect, test } from '@playwright/test'

import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  createEntry,
  waitForEntries,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Entry Creation Flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view (defaults to today)
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization using web-first assertion
    await waitForPageReady(page)
  })

  test('creates a new entry successfully', async ({ page }) => {
    // Type content into create form textarea
    const textarea = page.getByLabel('Content')
    await textarea.fill(TEST_ENTRY_CONTENT.WALK)

    // Click "New Entry" button
    const submitButton = page.getByRole('button', { name: 'New Entry' })
    await submitButton.click()

    // Verify entry appears in list below
    const entryCard = page.getByTestId('entry-card').first()
    await expect(entryCard).toBeVisible()

    // Verify entry content matches input
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.WALK
    )

    // Verify created timestamp displayed
    const timestamp = entryCard.getByTestId('created-at')
    await expect(timestamp).toBeVisible()
    await expect(timestamp).toContainText(/\d{1,2}:\d{2}/)

    // Verify textarea cleared after save
    await expect(textarea).toHaveValue('')

    // Verify textarea is focused after save
    await expect(textarea).toBeFocused()
  })

  test('creates multiple entries and verifies ordering', async ({ page }) => {
    const entries = [
      TEST_ENTRY_CONTENT.FIRST,
      TEST_ENTRY_CONTENT.SECOND,
      TEST_ENTRY_CONTENT.THIRD
    ]

    // Create three entries using helper function
    for (const content of entries) {
      await createEntry(page, content)
    }

    // Verify all entries are displayed and list is stable
    await waitForEntries(page, [
      TEST_ENTRY_CONTENT.FIRST,
      TEST_ENTRY_CONTENT.SECOND,
      TEST_ENTRY_CONTENT.THIRD
    ])
    const entryCards = page.getByTestId('entry-card')

    // Verify entries display in creation order (oldest first by order_position)
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

  test('shows validation error for empty content', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'New Entry' })

    // Button should be disabled when content is empty
    await expect(submitButton).toBeDisabled()

    // Type content
    const textarea = page.getByLabel('Content')
    await textarea.fill('Valid content')

    // Button should now be enabled
    await expect(submitButton).toBeEnabled()

    // Clear content
    await textarea.clear()

    // Button should be disabled again
    await expect(submitButton).toBeDisabled()
  })

  test('displays empty state when no entries exist', async ({ page }) => {
    const emptyState = page.getByTestId('empty-state')

    // Fresh browser context means no entries exist — empty state must be visible
    await expect(emptyState).toBeVisible()
    await expect(emptyState).toContainText(/no entries/i)

    // Create form should always be visible
    await expect(page.getByTestId('create-form')).toBeVisible()
  })

  test('shows entry creation timestamp in human-readable format', async ({
    page
  }) => {
    // Create entry using helper
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.TIMESTAMP_TEST)

    // Verify timestamp shows time in HH:MM format
    const timestamp = entryCard.getByTestId('created-at')
    await expect(timestamp).toBeVisible()

    // Timestamp should contain time (e.g., "14:30" or "2:30 PM")
    const timestampText = await timestamp.textContent()
    expect(timestampText).toMatch(/\d{1,2}:\d{2}/)
  })

  test('supports keyboard shortcut Cmd+S to save entry', async ({ page }) => {
    // Type content
    const textarea = page.getByLabel('Content')
    await textarea.fill(TEST_ENTRY_CONTENT.SIMPLE)

    // Press Cmd+S (or Ctrl+S on non-Mac)
    await textarea.press('Meta+s')

    // Verify entry was created
    const entryCard = page.getByTestId('entry-card').first()
    await expect(entryCard).toBeVisible()
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.SIMPLE
    )

    // Verify textarea cleared
    await expect(textarea).toHaveValue('')
  })

  test('supports keyboard shortcut Escape to clear textarea', async ({
    page
  }) => {
    // Type content
    const textarea = page.getByLabel('Content')
    await textarea.fill(TEST_ENTRY_CONTENT.DISCARDED)

    // Verify content is there
    await expect(textarea).toHaveValue(TEST_ENTRY_CONTENT.DISCARDED)

    // Press Escape
    await textarea.press('Escape')

    // Verify textarea is cleared
    await expect(textarea).toHaveValue('')
  })
})
