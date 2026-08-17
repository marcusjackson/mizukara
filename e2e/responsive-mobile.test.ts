/**
 * E2E Test: Responsive Design (Mobile)
 *
 * Tests responsive design behavior on mobile viewports:
 * - Navigation buttons are 44x44px minimum (touch-friendly)
 * - Edit button visible without hover
 * - Save button in create form is 44x44px minimum
 * - Text content readable (appropriate font size)
 * - Cards display full-width
 * - Spacing appropriate for mobile
 * - Create entry on mobile viewport works
 * - Edit entry on mobile viewport works
 * - Touch interactions function correctly
 *
 * Requirements tested: 9.1, 9.2, 9.3, 9.5, 9.6, 9.7
 */

import { expect, test } from '@playwright/test'

import {
  MOBILE_LAYOUT,
  TOUCH_TARGET,
  VIEWPORTS
} from './helpers/test-constants'
import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  createEntry,
  getEditorTextarea,
  startEditingEntry,
  waitForEntries,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Responsive Design (Mobile)', () => {
  test.beforeEach(async ({ context, page }) => {
    // Set mobile viewport
    await page.setViewportSize(VIEWPORTS.mobile)

    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization
    await waitForPageReady(page)
  })

  test('navigation buttons are touch-friendly (44x44px minimum)', async ({
    page
  }) => {
    // Get navigation buttons
    const prevButton = page.getByRole('button', { name: /previous day/i })
    const nextButton = page.getByRole('button', { name: /next day/i })

    // Verify previous button meets minimum touch target size
    const prevBox = await prevButton.boundingBox()
    if (!prevBox)
      throw new Error('prevButton has no bounding box — is it visible?')
    expect(prevBox.width).toBeGreaterThanOrEqual(TOUCH_TARGET.MINIMUM)
    expect(prevBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET.MINIMUM)

    // Verify next button meets minimum touch target size
    const nextBox = await nextButton.boundingBox()
    if (!nextBox)
      throw new Error('nextButton has no bounding box — is it visible?')
    expect(nextBox.width).toBeGreaterThanOrEqual(TOUCH_TARGET.MINIMUM)
    expect(nextBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET.MINIMUM)
  })

  test('Edit button is visible without hover on mobile', async ({ page }) => {
    // Create an entry first
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Verify edit button is visible without hover
    const editButton = entryCard.getByRole('button', { name: /edit entry/i })
    await expect(editButton).toBeVisible()

    // Verify edit button is touch-friendly
    const editBox = await editButton.boundingBox()
    if (!editBox)
      throw new Error('editButton has no bounding box — is it visible?')
    expect(editBox.width).toBeGreaterThanOrEqual(TOUCH_TARGET.MINIMUM)
    expect(editBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET.MINIMUM)
  })

  test('Save button in create form is touch-friendly', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: 'New Entry' })

    // Verify save button is visible
    await expect(saveButton).toBeVisible()

    // Verify save button meets minimum touch target size
    const saveBox = await saveButton.boundingBox()
    if (!saveBox)
      throw new Error('saveButton has no bounding box — is it visible?')
    expect(saveBox.width).toBeGreaterThanOrEqual(TOUCH_TARGET.MINIMUM)
    expect(saveBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET.MINIMUM)
  })

  test('text content is readable with appropriate font size', async ({
    page
  }) => {
    // Create an entry to test content display
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.WALK)

    // Get entry content element
    const entryContent = entryCard.getByTestId('entry-content')

    // Verify font size is readable (at least 16px for mobile)
    const fontSize = await entryContent.evaluate((el) =>
      globalThis.getComputedStyle(el).getPropertyValue('font-size')
    )
    const fontSizeValue = Number.parseInt(fontSize, 10)
    expect(fontSizeValue).toBeGreaterThanOrEqual(16)
  })

  test('cards display full-width on mobile', async ({ page }) => {
    // Create an entry
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Get container and card widths
    const container = page.getByTestId('entry-list')
    const containerBox = await container.boundingBox()
    const cardBox = await entryCard.boundingBox()

    if (!containerBox)
      throw new Error('container has no bounding box — is it visible?')
    if (!cardBox)
      throw new Error('entryCard has no bounding box — is it visible?')

    // Card should be close to full container width (allowing for padding)
    const expectedMinWidth =
      containerBox.width - MOBILE_LAYOUT.PADDING_ALLOWANCE
    expect(cardBox.width).toBeGreaterThanOrEqual(expectedMinWidth)
  })

  test('spacing is appropriate for mobile', async ({ page }) => {
    // Create multiple entries
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)

    // Wait for both entries to be visible and list to be stable
    await waitForEntries(page, [
      TEST_ENTRY_CONTENT.FIRST,
      TEST_ENTRY_CONTENT.SECOND
    ])
    const entryCards = page.getByTestId('entry-card')

    // Verify spacing between cards (vertical gap)
    const firstCardBox = await entryCards.nth(0).boundingBox()
    const secondCardBox = await entryCards.nth(1).boundingBox()

    if (!firstCardBox)
      throw new Error('firstCard has no bounding box — is it visible?')
    if (!secondCardBox)
      throw new Error('secondCard has no bounding box — is it visible?')

    // Calculate gap between cards
    const gap = secondCardBox.y - (firstCardBox.y + firstCardBox.height)

    // Verify gap is reasonable (at least 12px, typically 16px-24px)
    expect(gap).toBeGreaterThanOrEqual(12)
    expect(gap).toBeLessThanOrEqual(48)
  })

  test('creating entry works on mobile viewport', async ({ page }) => {
    // Type content into create form
    const textarea = page.getByLabel('Content')
    await textarea.fill(TEST_ENTRY_CONTENT.WALK)

    // Tap "New Entry" button
    const submitButton = page.getByRole('button', { name: 'New Entry' })
    await submitButton.click()

    // Verify entry was created and displays
    const entryCard = page.getByTestId('entry-card').first()
    await expect(entryCard).toBeVisible()
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.WALK
    )

    // Verify textarea cleared
    await expect(textarea).toHaveValue('')
  })

  test('editing entry works on mobile viewport', async ({ page }) => {
    // Create an entry
    await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Get the entry card
    const entryCard = page
      .getByTestId('entry-card')
      .filter({ hasText: TEST_ENTRY_CONTENT.SIMPLE })

    // Start editing (mobile doesn't need hover)
    await startEditingEntry(entryCard, true)

    // Verify editor is visible
    const editor = page.getByTestId('entry-editor')
    await expect(editor).toBeVisible()

    // Edit content
    const editorTextarea = getEditorTextarea(page)
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.UPDATED)

    // Save edit
    const saveButton = editor.getByRole('button', { name: 'Save' })
    await saveButton.click()
    await expect(editor).not.toBeVisible()

    // Verify updated content displays
    const updatedCard = page
      .getByTestId('entry-card')
      .filter({ hasText: TEST_ENTRY_CONTENT.UPDATED })
    await expect(updatedCard).toBeVisible()
  })

  test('touch interactions work correctly', async ({ page }) => {
    // Create an entry
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Test click on edit button (click works for touch too)
    const editButton = entryCard.getByRole('button', { name: /edit entry/i })
    await editButton.click()

    // Verify editor opens
    const editor = page.getByTestId('entry-editor')
    await expect(editor).toBeVisible()

    // Test click on cancel button
    const cancelButton = editor.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify editor closes
    await expect(editor).not.toBeVisible()

    // Test navigation with click
    const nextButton = page.getByRole('button', { name: /next day/i })
    await nextButton.click()

    // Verify navigation occurred (URL changed)
    await expect(page).toHaveURL(/\/entries\/\d{4}-\d{2}-\d{2}/)
  })
})
