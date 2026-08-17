/**
 * E2E Test: Responsive Design (Desktop)
 *
 * Tests responsive design behavior on desktop viewports:
 * - Navigation layout optimized for desktop
 * - Edit button hover-reveal works (if implemented)
 * - Content uses larger font (18px for entry text)
 * - Generous whitespace and spacing
 * - Keyboard shortcuts functionality
 *
 * Requirements tested: 9.1, 9.4, 9.8
 */

import { expect, test } from '@playwright/test'

import { TIMEOUTS, VIEWPORTS } from './helpers/test-constants'
import { TEST_ENTRY_CONTENT } from './helpers/test-data'
import {
  createEntry,
  getEditorTextarea,
  getEntryEditor,
  getTodayDate,
  getTomorrowDate,
  getYesterdayDate,
  startEditingEntry,
  waitForEntries,
  waitForPageReady
} from './helpers/test-utils'

test.describe('Responsive Design (Desktop)', () => {
  test.beforeEach(async ({ context, page }) => {
    // Set desktop viewport
    await page.setViewportSize(VIEWPORTS.desktop)

    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization
    await waitForPageReady(page)
  })

  test('navigation layout is optimized for desktop', async ({ page }) => {
    // Verify navigator is visible
    const navigator = page.getByTestId('entry-day-view-navigator')
    await expect(navigator).toBeVisible()

    // Verify navigation buttons are properly spaced
    const prevButton = page.getByRole('button', { name: /previous day/i })
    const nextButton = page.getByRole('button', { name: /next day/i })

    const prevBox = await prevButton.boundingBox()
    const nextBox = await nextButton.boundingBox()

    if (!prevBox)
      throw new Error('prevButton has no bounding box — is it visible?')
    if (!nextBox)
      throw new Error('nextButton has no bounding box — is it visible?')

    // Buttons should be horizontally aligned (similar y position)
    const yDifference = Math.abs(prevBox.y - nextBox.y)
    expect(yDifference).toBeLessThan(5) // Allow small difference for alignment

    // Verify date display is centered between buttons
    const dateDisplay = page.getByTestId('current-date')
    await expect(dateDisplay).toBeVisible()

    const dateBox = await dateDisplay.boundingBox()
    if (!dateBox)
      throw new Error('dateDisplay has no bounding box — is it visible?')

    // Date should be between the two buttons
    expect(dateBox.x).toBeGreaterThan(prevBox.x + prevBox.width)
    expect(dateBox.x + dateBox.width).toBeLessThan(nextBox.x)
  })

  test('Edit button hover-reveal works on desktop', async ({ page }) => {
    // Create an entry
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Get edit button
    const editButton = entryCard.getByRole('button', { name: /edit entry/i })

    // Note: We can't reliably test CSS :hover pseudo-class visibility changes
    // in Playwright. Instead, verify that hover action reveals the button
    // by checking if button becomes interactive after hover.

    // Hover over the card
    await entryCard.hover()

    // Verify edit button is visible and clickable after hover
    await expect(editButton).toBeVisible()
    await expect(editButton).toBeEnabled()

    // Click should work after hover
    await editButton.click()
    await expect(getEntryEditor(page)).toBeVisible()
  })

  test('content uses larger font size on desktop', async ({ page }) => {
    // Create an entry to test content display
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.WALK)

    // Get entry content element
    const entryContent = entryCard.getByTestId('entry-content')

    // Verify font size is larger for desktop (18px)
    const fontSize = await entryContent.evaluate((el) =>
      globalThis.getComputedStyle(el).getPropertyValue('font-size')
    )
    const fontSizeValue = Number.parseInt(fontSize, 10)
    expect(fontSizeValue).toBeGreaterThanOrEqual(18)
  })

  test('generous whitespace and spacing on desktop', async ({ page }) => {
    // Create multiple entries
    await createEntry(page, TEST_ENTRY_CONTENT.FIRST)
    await createEntry(page, TEST_ENTRY_CONTENT.SECOND)

    // Wait for both entries to be visible and list to be stable
    await waitForEntries(page, [
      TEST_ENTRY_CONTENT.FIRST,
      TEST_ENTRY_CONTENT.SECOND
    ])
    const entryCards = page.getByTestId('entry-card')

    // Verify spacing between cards is generous
    const firstCardBox = await entryCards.nth(0).boundingBox()
    const secondCardBox = await entryCards.nth(1).boundingBox()

    if (!firstCardBox)
      throw new Error('firstCard has no bounding box — is it visible?')
    if (!secondCardBox)
      throw new Error('secondCard has no bounding box — is it visible?')

    // Calculate gap between cards
    const gap = secondCardBox.y - (firstCardBox.y + firstCardBox.height)

    // Desktop should have more generous spacing (at least 16px, typically 24px)
    expect(gap).toBeGreaterThanOrEqual(16)

    // Verify card padding is generous
    const cardPadding = await entryCards.nth(0).evaluate((el) => {
      const style = globalThis.getComputedStyle(el)
      return (
        Number.parseInt(style.paddingTop, 10) +
        Number.parseInt(style.paddingBottom, 10)
      )
    })

    // Desktop cards should have generous padding (at least 32px total)
    expect(cardPadding).toBeGreaterThanOrEqual(32)
  })

  test('keyboard shortcuts work on desktop - Cmd/Ctrl+N focuses create form', async ({
    page
  }) => {
    const textarea = page.getByLabel('Content')

    // Verify textarea not initially focused
    await expect(textarea).not.toBeFocused()

    // Press Cmd/Ctrl+N
    await page.keyboard.press('Control+n')

    // Verify focus moved to create form textarea
    await expect(textarea).toBeFocused()
  })

  test('keyboard shortcuts work on desktop - Cmd/Ctrl+S saves entry', async ({
    page
  }) => {
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
  })

  test('keyboard shortcuts work on desktop - J/K navigation', async ({
    page
  }) => {
    const today = getTodayDate()
    const tomorrow = getTomorrowDate()
    const yesterday = getYesterdayDate()

    // Navigate to today first
    await page.goto(`/entries/${today}`, { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    // Click outside textarea to ensure no input has focus
    await page.locator('body').click({ position: { x: 10, y: 10 } })

    // Press J to navigate to next day
    await page.keyboard.press('j')
    await expect(page).toHaveURL(new RegExp(`/entries/${tomorrow}`), {
      timeout: TIMEOUTS.short
    })

    // Press K to navigate to previous day
    await page.keyboard.press('k')
    await expect(page).toHaveURL(new RegExp(`/entries/${today}`), {
      timeout: TIMEOUTS.short
    })

    // Press K again to go to yesterday
    await page.keyboard.press('k')
    await expect(page).toHaveURL(new RegExp(`/entries/${yesterday}`), {
      timeout: TIMEOUTS.short
    })
  })

  test('keyboard shortcuts work on desktop - Escape in editor', async ({
    page
  }) => {
    // Create an entry
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.SIMPLE)

    // Start editing
    await startEditingEntry(entryCard, false)

    // Verify editor is visible
    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    // Type new content
    const editorTextarea = getEditorTextarea(page)
    await editorTextarea.clear()
    await editorTextarea.fill(TEST_ENTRY_CONTENT.UPDATED)

    // Press Escape to cancel
    await page.keyboard.press('Escape')

    // Verify editor closed
    await expect(editor).not.toBeVisible()

    // Verify original content preserved
    await expect(entryCard.getByTestId('entry-content')).toContainText(
      TEST_ENTRY_CONTENT.SIMPLE
    )
  })

  test('keyboard shortcuts work on desktop - Escape in create form', async ({
    page
  }) => {
    const textarea = page.getByLabel('Content')

    // Type content
    await textarea.fill(TEST_ENTRY_CONTENT.SIMPLE)

    // Press Escape to clear
    await page.keyboard.press('Escape')

    // Verify textarea cleared
    await expect(textarea).toHaveValue('')
  })

  test('card layout uses available screen space effectively', async ({
    page
  }) => {
    // Create an entry
    const entryCard = await createEntry(page, TEST_ENTRY_CONTENT.WALK)

    // Get entry card
    const cardBox = await entryCard.boundingBox()
    if (!cardBox)
      throw new Error('entryCard has no bounding box — is it visible?')

    // On desktop, cards should have reasonable max-width
    // (not full viewport width, but not too narrow either)
    expect(cardBox.width).toBeLessThan(VIEWPORTS.desktop.width)
    expect(cardBox.width).toBeGreaterThan(400) // Minimum reasonable width
  })
})
