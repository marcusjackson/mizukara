/**
 * E2E Test: Keyboard Shortcuts
 *
 * Tests keyboard shortcut functionality:
 * - Cmd/Ctrl+N: Focus create form textarea
 * - J/K: Navigate to next/previous day
 * - Cmd/Ctrl+S: Save entry (create form and edit mode)
 * - Escape: Clear content (create form) or exit edit mode
 * - Context-awareness: Shortcuts respect input focus
 *
 * Requirements tested: 7.1, 7.2, 7.3, 7.4
 */

import { expect, test } from '@playwright/test'

import { TIMEOUTS, VIEWPORTS } from './helpers/test-constants'
import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  blurFocusedElement,
  createEntry,
  getEntryEditor,
  getTodayDate,
  getTomorrowDate,
  getYesterdayDate,
  isMobileViewport,
  startEditingEntry,
  waitForEntries,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view (defaults to today)
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization
    await waitForPageReady(page)
  })

  test('Cmd/Ctrl+N focuses create form textarea', async ({ page }) => {
    const textarea = page.getByLabel('Content')

    // Verify textarea not initially focused
    await expect(textarea).not.toBeFocused()

    // Press Cmd/Ctrl+N
    await page.keyboard.press('Control+n')

    // Verify focus moved to create form textarea
    await expect(textarea).toBeFocused()
  })

  test('Cmd/Ctrl+S saves new entry from create form', async ({ page }) => {
    const textarea = page.getByLabel('Content')

    // Type content in create form
    await textarea.fill(TEST_ENTRY_CONTENT.SIMPLE)

    // Press Cmd/Ctrl+S
    await page.keyboard.press('Control+s')

    // Verify entry was created
    const entryCard = page.getByTestId('entry-card').first()
    await expect(entryCard).toBeVisible()
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.SIMPLE
    )

    // Verify textarea cleared
    await expect(textarea).toHaveValue('')

    // Verify only ONE entry was created (no duplicates)
    await waitForEntries(page, [TEST_ENTRY_CONTENT.SIMPLE])
  })

  test('J key navigates to next day', async ({ page }) => {
    const today = getTodayDate()
    const tomorrow = getTomorrowDate()

    // Navigate to today first to ensure consistent startingpoint
    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Blur any focused element to ensure navigation shortcuts fire
    await blurFocusedElement(page)

    // Press J key to navigate to next day
    await page.keyboard.press('j')

    // Verify navigation to next day (URL updates with date)
    await expect(page).toHaveURL(new RegExp(`/entries/${tomorrow}`), {
      timeout: TIMEOUTS.short
    })
  })

  test('K key navigates to previous day', async ({ page }) => {
    const today = getTodayDate()
    const yesterday = getYesterdayDate()

    // Navigate to today first to ensure consistent starting point
    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Blur any focused element to ensure navigation shortcuts fire
    await blurFocusedElement(page)

    // Press K key to navigate to previous day
    await page.keyboard.press('k')

    // Verify navigation to previous day (URL updates with date)
    await expect(page).toHaveURL(new RegExp(`/entries/${yesterday}`), {
      timeout: TIMEOUTS.short
    })
  })

  test('Arrow keys navigate between days', async ({ page }) => {
    const today = getTodayDate()
    const tomorrow = getTomorrowDate()
    const yesterday = getYesterdayDate()

    // Navigate to today first to ensure consistent starting point
    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Blur any focused element to ensure navigation shortcuts fire
    await blurFocusedElement(page)

    // Press ArrowDown (next day)
    await page.keyboard.press('ArrowDown')
    await expect(page).toHaveURL(new RegExp(`/entries/${tomorrow}`), {
      timeout: TIMEOUTS.short
    })

    // Press ArrowUp (previous day - back to today)
    await page.keyboard.press('ArrowUp')
    await expect(page).toHaveURL(new RegExp(`/entries/${today}`), {
      timeout: TIMEOUTS.short
    })

    // Press ArrowUp again (yesterday)
    await page.keyboard.press('ArrowUp')
    await expect(page).toHaveURL(new RegExp(`/entries/${yesterday}`), {
      timeout: TIMEOUTS.short
    })
  })

  test('Cmd/Ctrl+S saves entry in edit mode', async ({ page }) => {
    // Create an entry first
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Enter edit mode
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
    await expect(editor).not.toBeVisible({ timeout: TIMEOUTS.short })

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

  test('Escape exits edit mode without saving', async ({ page }) => {
    // Create an entry first
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.ORIGINAL)

    // Enter edit mode
    await startEditingEntry(entryCard, isMobileViewport(page))

    // Wait for editor to be visible
    const editor = page.getByTestId('entry-editor')
    await expect(editor).toBeVisible()

    // Modify content in editor
    const editorTextarea = editor.getByLabel('Content')
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.DISCARDED)

    // Press Escape to cancel
    await page.keyboard.press('Escape')

    // Verify editor closes
    await expect(editor).not.toBeVisible()

    // Verify original content still displayed (changes discarded)
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.ORIGINAL
    )
  })

  test('Escape clears content in create form', async ({ page }) => {
    const textarea = page.getByLabel('Content')

    // Type content in create form
    await textarea.fill(TEST_ENTRY_CONTENT.DISCARDED)

    // Verify content is there
    await expect(textarea).toHaveValue(TEST_ENTRY_CONTENT.DISCARDED)

    // Press Escape
    await page.keyboard.press('Escape')

    // Verify textarea is cleared
    await expect(textarea).toHaveValue('')
  })

  test('J/K keys do not navigate when textarea is focused', async ({
    page
  }) => {
    const textarea = page.getByLabel('Content')

    // Focus textarea
    await textarea.focus()

    // Type 'j' and 'k' as text content
    await textarea.pressSequentially('jjj kkk')

    // Verify URL hasn't changed (should still be at /entries without date)
    // If navigation had occurred, URL would contain a specific date
    expect(page.url()).toMatch(/\/entries\/?$/)

    // Verify content was typed (not triggering shortcuts)
    await expect(textarea).toHaveValue('jjj kkk')
  })

  test('Cmd/Ctrl+N does not focus textarea when already focused', async ({
    page
  }) => {
    const textarea = page.getByLabel('Content')

    // Type some content
    await textarea.fill('Initial content')

    // Press Cmd/Ctrl+N while focused
    await page.keyboard.press('Control+n')

    // Verify content is preserved (no focus change side effects)
    await expect(textarea).toHaveValue('Initial content')
    await expect(textarea).toBeFocused()
  })

  test('navigation shortcuts work after creating entry', async ({ page }) => {
    const today = getTodayDate()
    const tomorrow = getTomorrowDate()

    // Navigate to today first
    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Create an entry
    await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Blur any focused element (createEntry leaves textarea focused)
    await blurFocusedElement(page)

    // Press J to navigate to next day
    await page.keyboard.press('j')

    // Verify navigation worked (URL updates with date)
    await expect(page).toHaveURL(new RegExp(`/entries/${tomorrow}`), {
      timeout: TIMEOUTS.short
    })

    // Navigate back to verify K works too
    await page.keyboard.press('k')
    await expect(page).toHaveURL(new RegExp(`/entries/${today}`), {
      timeout: TIMEOUTS.short
    })
  })

  test('keyboard shortcuts work on mobile viewport', async ({
    context,
    page
  }) => {
    // Set mobile viewport
    await page.setViewportSize(VIEWPORTS.mobile)

    // Navigate to entry day view with specific date
    const today = getTodayDate()
    const tomorrow = getTomorrowDate()

    await context.clearCookies()
    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    const textarea = page.getByLabel('Content')

    // Test Cmd/Ctrl+N
    await page.keyboard.press('Control+n')
    await expect(textarea).toBeFocused()

    // Blur any focused element before testing navigation
    await blurFocusedElement(page)

    // Test J/K navigation
    await page.keyboard.press('j')
    await expect(page).toHaveURL(new RegExp(`/entries/${tomorrow}`), {
      timeout: TIMEOUTS.short
    })

    await page.keyboard.press('k')
    await expect(page).toHaveURL(new RegExp(`/entries/${today}`), {
      timeout: TIMEOUTS.short
    })
  })

  test('G key opens date picker dialog', async ({ page }) => {
    // Blur any focused element before pressing G
    await blurFocusedElement(page)

    // Press G key
    await page.keyboard.press('g')

    // Verify date picker dialog opens
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Jump to Date')).toBeVisible()

    // Close dialog
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('G key does not open date picker when textarea focused', async ({
    page
  }) => {
    const textarea = page.getByLabel('Content')

    // Focus textarea
    await textarea.focus()

    // Press G key
    await page.keyboard.press('g')

    // Dialog should NOT open
    const dialog = page.getByRole('dialog')
    await expect(dialog).not.toBeVisible({ timeout: 1000 })

    // 'g' should be typed in textarea instead
    await expect(textarea).toHaveValue('g')
  })
})
