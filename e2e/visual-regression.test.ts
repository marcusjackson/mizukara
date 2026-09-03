/**
 * Visual Regression Tests
 *
 * These tests verify visual consistency of UI components and responsive layouts.
 * They complement unit and E2E tests by catching unintended visual changes.
 *
 * Strategy:
 * - PRIMARY: Element-level screenshots (isolate component changes, reduce maintenance)
 * - SECONDARY: Page-level screenshots (layout verification at breakpoints only)
 * - Stability: Disable animations, mask timestamps, hide cursor, wait for fonts
 * - Thresholds: 1% for components, 2% for page-level tests
 *
 * Key Principles:
 * - Test visual states not covered by functional tests (hover, focus, responsive)
 * - Prefer component-level over page-level (fails only when that component changes)
 * - Ensure deterministic screenshots (no animations, dynamic content masked)
 * - Update baselines only after reviewing diffs (intentional changes only)
 */

import { expect, test } from '@playwright/test'

import { TIMEOUTS, VIEWPORTS } from './helpers/test-constants'
import { createEntry, disableAnimations } from './helpers/test-utils'

import type { Page } from '@playwright/test'

/**
 * Fixed test date for consistency (avoids date-dependent failures)
 */
const TEST_DATE = '2026-02-14'

/**
 * Wait for page to be stable and ready for screenshot
 * - Wait for fonts to load
 * - Wait for content to be visible
 * - Hide cursor to prevent it appearing in screenshots
 */
async function preparePageForVRT(page: Page): Promise<void> {
  await page.goto(`/entries/${TEST_DATE}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByTestId('entry-day-view-navigator')).toBeVisible({
    timeout: TIMEOUTS.long
  })
  await expect(page.getByTestId('create-form')).toBeVisible()
  await page.mouse.move(0, 0) // Hide cursor
}

/**
 * Setup for all VRT tests
 */
test.beforeEach(async ({ page }) => {
  await disableAnimations(page)
})

/**
 * Component Visual Tests (Element-Level)
 *
 * Test individual components with distinct visual states.
 * Element-level screenshots isolate component changes and reduce maintenance.
 */
test.describe('Visual Regression: Components', () => {
  test.describe('EntryDayViewNavigator', () => {
    test('desktop layout', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      const navigator = page.getByTestId('entry-day-view-navigator')
      await expect(navigator).toHaveScreenshot('navigator-desktop.png', {
        threshold: 0.01, // 1% tolerance for anti-aliasing
        maxDiffPixels: 50
      })
    })

    test('mobile layout', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await preparePageForVRT(page)

      const navigator = page.getByTestId('entry-day-view-navigator')
      await expect(navigator).toHaveScreenshot('navigator-mobile.png', {
        threshold: 0.01,
        maxDiffPixels: 50
      })
    })

    test('previous button focused', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      const previousButton = page.getByRole('button', {
        name: /previous day/i
      })
      await previousButton.focus()

      const navigator = page.getByTestId('entry-day-view-navigator')
      await expect(navigator).toHaveScreenshot(
        'navigator-previous-focused.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50
        }
      )
    })

    test('next button focused', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      const nextButton = page.getByRole('button', { name: /next day/i })
      await nextButton.focus()

      const navigator = page.getByTestId('entry-day-view-navigator')
      await expect(navigator).toHaveScreenshot('navigator-next-focused.png', {
        threshold: 0.01,
        maxDiffPixels: 50
      })
    })
  })

  test.describe('SharedEntryCard', () => {
    test('normal state desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Create test entry
      await createEntry(page, 'Test entry for visual regression')

      const entryCard = page.getByTestId('entry-card').first()
      await expect(entryCard).toHaveScreenshot(
        'entry-card-normal-desktop.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50,
          mask: [entryCard.getByTestId('created-at')] // Hide timestamps
        }
      )
    })

    test('normal state mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await preparePageForVRT(page)

      // Create test entry
      await createEntry(page, 'Test entry for visual regression')

      const entryCard = page.getByTestId('entry-card').first()
      await expect(entryCard).toHaveScreenshot('entry-card-normal-mobile.png', {
        threshold: 0.01,
        maxDiffPixels: 50,
        mask: [entryCard.getByTestId('created-at')]
      })
    })

    test('hover state desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Create test entry
      await createEntry(page, 'Test entry for visual regression')

      const entryCard = page.getByTestId('entry-card').first()
      await entryCard.hover()

      await expect(entryCard).toHaveScreenshot('entry-card-hover-desktop.png', {
        threshold: 0.01,
        maxDiffPixels: 50,
        mask: [entryCard.getByTestId('created-at')]
      })
    })

    test('with edited indicator', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Create and edit entry to trigger edited indicator
      const entry = await createEntry(page, 'Test entry for visual regression')
      // Force click edit button (hover-reveal pattern on desktop)
      await entry.getByRole('button', { name: /edit/i }).click({ force: true })

      // Wait for editor to appear
      await expect(page.getByTestId('entry-editor')).toBeVisible()

      // Modify content
      await page.getByLabel('Content').last().fill('Modified content')
      await page.getByRole('button', { name: /save/i }).click()

      // Wait for card to reappear with edited indicator
      await expect(page.getByTestId('entry-editor')).not.toBeVisible()
      const editedCard = page.getByTestId('entry-card').first()
      await expect(editedCard.getByText(/edited/i)).toBeVisible()

      await expect(editedCard).toHaveScreenshot('entry-card-edited.png', {
        threshold: 0.01,
        maxDiffPixels: 50,
        mask: [editedCard.getByTestId('created-at')]
      })
    })

    test('multiple cards', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Create multiple entries
      await createEntry(page, 'First entry')
      await createEntry(page, 'Second entry')
      await createEntry(page, 'Third entry')

      const entryList = page.getByTestId('entry-list')
      await expect(entryList).toHaveScreenshot('entry-cards-multiple.png', {
        threshold: 0.01,
        maxDiffPixels: 100,
        mask: [page.getByTestId('created-at')]
      })
    })
  })

  test.describe('EntryDayViewCreateForm', () => {
    test('empty state desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      const createForm = page.getByTestId('create-form')
      await expect(createForm).toHaveScreenshot(
        'create-form-empty-desktop.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50
        }
      )
    })

    test('empty state mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await preparePageForVRT(page)

      const createForm = page.getByTestId('create-form')
      await expect(createForm).toHaveScreenshot(
        'create-form-empty-mobile.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50
        }
      )
    })

    test('filled state desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Fill textarea
      await page.getByLabel('Content').fill('Some test content')

      const createForm = page.getByTestId('create-form')
      await expect(createForm).toHaveScreenshot(
        'create-form-filled-desktop.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50
        }
      )
    })

    test('textarea focused', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Focus textarea
      await page.getByLabel('Content').focus()

      const createForm = page.getByTestId('create-form')
      await expect(createForm).toHaveScreenshot(
        'create-form-textarea-focused.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50
        }
      )
    })

    test('save button disabled', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      const saveButton = page.getByRole('button', { name: /new entry/i })
      await expect(saveButton).toBeDisabled()

      await expect(saveButton).toHaveScreenshot('save-button-disabled.png', {
        threshold: 0.01,
        maxDiffPixels: 25
      })
    })

    test('save button enabled', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Fill textarea to enable button
      await page.getByLabel('Content').fill('Some content')

      const saveButton = page.getByRole('button', { name: /new entry/i })
      await expect(saveButton).toBeEnabled()

      await expect(saveButton).toHaveScreenshot('save-button-enabled.png', {
        threshold: 0.01,
        maxDiffPixels: 25
      })
    })
  })

  test.describe('EntryDayViewEntryEditor', () => {
    test('editing state desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Create entry and enter edit mode
      const entry = await createEntry(page, 'Test entry to edit')
      // Force click edit button (hover-reveal pattern on desktop)
      await entry.getByRole('button', { name: /edit/i }).click({ force: true })

      const editor = page.getByTestId('entry-editor')
      await expect(editor).toBeVisible()

      await expect(editor).toHaveScreenshot(
        'entry-editor-editing-desktop.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50
        }
      )
    })

    test('editing state mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await preparePageForVRT(page)

      // Create entry and enter edit mode
      const entry = await createEntry(page, 'Test entry to edit')
      await entry.getByRole('button', { name: /edit/i }).click()

      const editor = page.getByTestId('entry-editor')
      await expect(editor).toBeVisible()

      await expect(editor).toHaveScreenshot('entry-editor-editing-mobile.png', {
        threshold: 0.01,
        maxDiffPixels: 50
      })
    })

    test('textarea focused', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Create entry and enter edit mode
      const entry = await createEntry(page, 'Test entry to edit')
      // Force click edit button (hover-reveal pattern on desktop)
      await entry.getByRole('button', { name: /edit/i }).click({ force: true })

      // Wait for editor to appear
      await expect(page.getByTestId('entry-editor')).toBeVisible()

      // Focus textarea in editor (use last() to get editor textarea, not create form)
      const textarea = page.getByLabel('Content').last()
      await textarea.focus()

      const editor = page.getByTestId('entry-editor')
      await expect(editor).toHaveScreenshot(
        'entry-editor-textarea-focused.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50
        }
      )
    })

    test('date input focused', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Create entry and enter edit mode
      const entry = await createEntry(page, 'Test entry to edit')
      // Force click edit button (hover-reveal pattern on desktop)
      await entry.getByRole('button', { name: /edit/i }).click({ force: true })

      // Focus date input
      const dateInput = page.getByLabel('Assigned Day')
      await dateInput.focus()

      const editor = page.getByTestId('entry-editor')
      await expect(editor).toHaveScreenshot('entry-editor-date-focused.png', {
        threshold: 0.01,
        maxDiffPixels: 50
      })
    })
  })

  test.describe('EntryDayViewDatePicker', () => {
    test('dialog open - desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Open date picker via keyboard shortcut
      await page.locator('body').click({ position: { x: 10, y: 10 } })
      await page.keyboard.press('g')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      await expect(dialog).toHaveScreenshot('date-picker-desktop.png', {
        threshold: 0.01,
        maxDiffPixels: 50
      })
    })

    test('dialog open - mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await preparePageForVRT(page)

      // Open date picker via button
      const dateTrigger = page.getByRole('button', { name: /jump to date/i })
      await dateTrigger.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      await expect(dialog).toHaveScreenshot('date-picker-mobile.png', {
        threshold: 0.01,
        maxDiffPixels: 50
      })
    })

    test('validation error state', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      // Open date picker
      await page.locator('body').click({ position: { x: 10, y: 10 } })
      await page.keyboard.press('g')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Clear the date input and submit to trigger validation error
      const dateInput = dialog.locator('input[type="date"]')
      await dateInput.fill('')
      await dialog.getByRole('button', { name: /go/i }).click()

      // Wait for error message
      await expect(
        dialog.getByText(/valid date in YYYY-MM-DD format/i)
      ).toBeVisible()

      await expect(dialog).toHaveScreenshot(
        'date-picker-validation-error.png',
        {
          threshold: 0.01,
          maxDiffPixels: 50
        }
      )
    })
  })

  test.describe('Empty State', () => {
    test('desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await preparePageForVRT(page)

      const emptyState = page.getByTestId('empty-state')
      await expect(emptyState).toBeVisible()

      await expect(emptyState).toHaveScreenshot('empty-state-desktop.png', {
        threshold: 0.01,
        maxDiffPixels: 50
      })
    })

    test('mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await preparePageForVRT(page)

      const emptyState = page.getByTestId('empty-state')
      await expect(emptyState).toBeVisible()

      await expect(emptyState).toHaveScreenshot('empty-state-mobile.png', {
        threshold: 0.01,
        maxDiffPixels: 50
      })
    })
  })
})

/**
 * Layout Visual Tests (Page-Level)
 *
 * Selective page-level tests to verify overall layout integrity.
 * Only used for critical breakpoint verification and layout relationships.
 */
test.describe('Visual Regression: Layouts', () => {
  test('day view layout - mobile (375x667)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await preparePageForVRT(page)

    // Create some entries for layout verification
    await createEntry(page, 'First entry')
    await createEntry(page, 'Second entry')

    await expect(page).toHaveScreenshot('day-view-layout-mobile.png', {
      fullPage: true,
      threshold: 0.02, // 2% tolerance for page-level
      maxDiffPixels: 500,
      mask: [page.getByTestId('created-at')]
    })
  })

  test('day view layout - tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet)
    await preparePageForVRT(page)

    // Create some entries for layout verification
    await createEntry(page, 'First entry')
    await createEntry(page, 'Second entry')

    await expect(page).toHaveScreenshot('day-view-layout-tablet.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500,
      mask: [page.getByTestId('created-at')]
    })
  })

  test('day view layout - desktop (1280x800)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await preparePageForVRT(page)

    // Create some entries for layout verification
    await createEntry(page, 'First entry')
    await createEntry(page, 'Second entry')

    await expect(page).toHaveScreenshot('day-view-layout-desktop.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500,
      mask: [page.getByTestId('created-at')]
    })
  })

  test('day view with many entries - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await preparePageForVRT(page)

    // Create many entries to test scrolling layout
    for (let i = 1; i <= 10; i++) {
      await createEntry(page, `Entry ${i.toString()}`)
    }

    await expect(page).toHaveScreenshot('day-view-many-entries-desktop.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500,
      mask: [page.getByTestId('created-at')]
    })
  })

  test('day view with no entries - mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await preparePageForVRT(page)

    await expect(page).toHaveScreenshot('day-view-empty-mobile.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500
    })
  })

  test('day view with no entries - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await preparePageForVRT(page)

    await expect(page).toHaveScreenshot('day-view-empty-desktop.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500
    })
  })
})

/**
 * Settings Page Visual Tests
 *
 * Test settings page components and responsive layout.
 */
async function prepareSettingsForVRT(page: Page): Promise<void> {
  await page.goto('/settings', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({
    timeout: TIMEOUTS.long
  })
  await page.mouse.move(0, 0)
}

test.describe('Visual Regression: Settings Page', () => {
  test('settings page - desktop layout', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await disableAnimations(page)
    await prepareSettingsForVRT(page)

    await expect(page).toHaveScreenshot('settings-page-desktop.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500,
      mask: [page.getByText(/v\d+\.\d+/)] // Mask version number
    })
  })

  test('settings page - mobile layout', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await disableAnimations(page)
    await prepareSettingsForVRT(page)

    await expect(page).toHaveScreenshot('settings-page-mobile.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500,
      mask: [page.getByText(/v\d+\.\d+/)]
    })
  })

  test('settings page - dark theme', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await disableAnimations(page)
    await prepareSettingsForVRT(page)

    // Toggle dark mode
    const themeSwitch = page.getByRole('switch', { name: /dark mode/i })
    await themeSwitch.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await expect(page).toHaveScreenshot('settings-page-dark-desktop.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500,
      mask: [page.getByText(/v\d+\.\d+/)]
    })
  })
})
