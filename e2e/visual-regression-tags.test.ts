/**
 * Visual Regression Tests — Tags Feature
 *
 * Tests visual consistency for all tags-related UI components:
 * - TagsSectionBrowse: empty, with tags, active filter
 * - TagsSectionEntries: no filter, with results, no results
 * - SharedEntryCard with tag chips
 * - EntryDayViewEntryEditor with BaseTagInput (empty and with chips)
 * - Full tags page layouts (desktop and mobile)
 *
 * Strategy:
 * - PRIMARY: Element-level screenshots (isolate component changes)
 * - SECONDARY: Page-level screenshots (layout verification only)
 * - Stability: Animations disabled by top-level beforeEach, fonts awaited,
 *   timestamps masked, cursor hidden
 *
 * Each test gets a fresh Playwright browser context, so no explicit
 * database reset is required between tests.
 *
 * See .github/instructions/vrt-testing.instructions.md for complete guidelines
 */

import { expect, test } from '@playwright/test'

import { VIEWPORTS } from './helpers/test-constants'
import { createEntry, saveEntryEdit } from './helpers/test-utils'

import type { Page } from '@playwright/test'

/**
 * Fixed test date for consistency (avoids date-dependent failures).
 */
const TEST_DATE = '2026-02-14'

// =============================================================================
// Shared helpers
// =============================================================================

/**
 * Disable CSS animations and transitions to prevent flaky screenshots.
 */
async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  })
}

/**
 * Navigate to /tags and wait until the page heading is visible.
 */
async function prepareTagsPageForVRT(page: Page): Promise<void> {
  await page.goto('/tags', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await expect(
    page.getByRole('heading', { name: 'Tags', level: 1 })
  ).toBeVisible({ timeout: 15000 })
  await page.mouse.move(0, 0)
}

/**
 * Navigate to the fixed-date entries page and wait for it to be ready.
 */
async function goToEntriesPage(page: Page): Promise<void> {
  await page.goto(`/entries/${TEST_DATE}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByTestId('create-form')).toBeVisible({ timeout: 15000 })
  await page.mouse.move(0, 0)
}

/**
 * Add a tag to the currently open entry editor via the combobox create flow.
 * Assumes the entry-editor is already visible.
 */
async function addTagViaEditorForVRT(
  page: Page,
  tagName: string
): Promise<void> {
  const editor = page.getByTestId('entry-editor')
  const combobox = editor.getByRole('combobox')
  await combobox.click()
  await combobox.pressSequentially(tagName)
  await expect(page.getByText(`Create '${tagName}'`)).toBeVisible()
  await page.getByText(`Create '${tagName}'`).click()
  await expect(editor.getByTestId('tag-chips')).toContainText(tagName)
}

/**
 * Create an entry, open its editor, add a named tag, then save.
 * Ends with the entry back in card form on the entries page.
 * Uses force:true to bypass the hover-reveal pattern on desktop.
 */
async function createEntryWithTag(
  page: Page,
  content: string,
  tagName: string
): Promise<void> {
  const entry = await createEntry(page, content)
  await entry
    .getByRole('button', { name: /edit entry/i })
    .click({ force: true })
  await expect(page.getByTestId('entry-editor')).toBeVisible()
  await addTagViaEditorForVRT(page, tagName)
  await saveEntryEdit(page)
}

// =============================================================================
// Setup
// =============================================================================

test.beforeEach(async ({ page }) => {
  await disableAnimations(page)
})

// =============================================================================
// TagsSectionBrowse
// =============================================================================

test.describe('Visual Regression: TagsSectionBrowse', () => {
  test('empty state - no tags - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    // Fresh context → no tags exist → browse shows empty state
    await prepareTagsPageForVRT(page)

    const browse = page.locator('.tags-section-browse')
    await expect(browse).toHaveScreenshot('tags-browse-empty-desktop.png', {
      threshold: 0.01,
      maxDiffPixels: 50
    })
  })

  test('empty state - no tags - mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await prepareTagsPageForVRT(page)

    const browse = page.locator('.tags-section-browse')
    await expect(browse).toHaveScreenshot('tags-browse-empty-mobile.png', {
      threshold: 0.01,
      maxDiffPixels: 50
    })
  })

  test('with tags - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await goToEntriesPage(page)
    await createEntryWithTag(page, 'VRT browse entry', 'VrtBrowseTag')
    await prepareTagsPageForVRT(page)

    const browse = page.locator('.tags-section-browse')
    await expect(browse).toHaveScreenshot('tags-browse-with-tags-desktop.png', {
      threshold: 0.01,
      maxDiffPixels: 50
    })
  })

  test('with tags - mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await goToEntriesPage(page)
    // On mobile the edit button is always visible — no force needed
    await createEntry(page, 'VRT mobile browse entry')
    const entry = page.getByTestId('entry-card').first()
    await entry.getByRole('button', { name: /edit entry/i }).click()
    await expect(page.getByTestId('entry-editor')).toBeVisible()
    await addTagViaEditorForVRT(page, 'VrtMobileBrowseTag')
    await saveEntryEdit(page)
    await prepareTagsPageForVRT(page)

    const browse = page.locator('.tags-section-browse')
    await expect(browse).toHaveScreenshot('tags-browse-with-tags-mobile.png', {
      threshold: 0.01,
      maxDiffPixels: 50
    })
  })

  test('with active selected tag - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await goToEntriesPage(page)
    await createEntryWithTag(page, 'VRT active tag entry', 'VrtActiveTag')
    await prepareTagsPageForVRT(page)

    // Click the tag toggle to highlight it as active
    await page.getByRole('button', { name: 'Select VrtActiveTag' }).click()

    const browse = page.locator('.tags-section-browse')
    await expect(browse).toHaveScreenshot(
      'tags-browse-active-tag-desktop.png',
      { threshold: 0.01, maxDiffPixels: 50 }
    )
  })
})

// =============================================================================
// TagsSectionEntries
// =============================================================================

test.describe('Visual Regression: TagsSectionEntries', () => {
  test('no active filter state', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await prepareTagsPageForVRT(page)

    const entries = page.locator('.tags-section-entries')
    await expect(entries).toHaveScreenshot('tags-entries-no-filter.png', {
      threshold: 0.01,
      maxDiffPixels: 50
    })
  })

  test('with filtered results - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await goToEntriesPage(page)
    await createEntryWithTag(page, 'VRT filtered entry', 'VrtFilterTag')
    await prepareTagsPageForVRT(page)

    await page.getByRole('button', { name: 'Select VrtFilterTag' }).click()
    await expect(page.getByTestId('entry-card')).toBeVisible()

    const entries = page.locator('.tags-section-entries')
    await expect(entries).toHaveScreenshot(
      'tags-entries-with-results-desktop.png',
      {
        threshold: 0.01,
        maxDiffPixels: 100,
        mask: [page.getByTestId('created-at')]
      }
    )
  })

  test('active filter with no matching entries - desktop', async ({ page }) => {
    /**
     * Two entries, each with a distinct tag.
     * Selecting both tags → intersection is empty → empty-no-results state.
     */
    await page.setViewportSize(VIEWPORTS.desktop)
    await goToEntriesPage(page)
    await createEntryWithTag(page, 'VRT no-results entry A', 'VrtNoResultTagX')
    await createEntryWithTag(page, 'VRT no-results entry B', 'VrtNoResultTagY')
    await prepareTagsPageForVRT(page)

    await page.getByRole('button', { name: 'Select VrtNoResultTagX' }).click()
    await page.getByRole('button', { name: 'Select VrtNoResultTagY' }).click()
    await expect(page.getByTestId('empty-no-results')).toBeVisible()

    const entries = page.locator('.tags-section-entries')
    await expect(entries).toHaveScreenshot(
      'tags-entries-no-results-desktop.png',
      { threshold: 0.01, maxDiffPixels: 50 }
    )
  })
})

// =============================================================================
// SharedEntryCard with tag chips
// =============================================================================

test.describe('Visual Regression: Entry card with tags', () => {
  test('entry card with tag chips - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await goToEntriesPage(page)
    await createEntryWithTag(page, 'VRT card tag entry', 'VrtCardTag')

    const entryCard = page.getByTestId('entry-card').first()
    await expect(entryCard.getByTestId('entry-tags')).toBeVisible()

    await expect(entryCard).toHaveScreenshot(
      'entry-card-with-tags-desktop.png',
      {
        threshold: 0.01,
        maxDiffPixels: 50,
        mask: [entryCard.getByTestId('created-at')]
      }
    )
  })
})

// =============================================================================
// EntryDayViewEntryEditor — BaseTagInput states
// =============================================================================

test.describe('Visual Regression: Entry editor tag input', () => {
  test('tag input - empty (no chips) - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await goToEntriesPage(page)
    await createEntry(page, 'VRT editor tags empty')
    const entry = page.getByTestId('entry-card').first()
    await entry
      .getByRole('button', { name: /edit entry/i })
      .click({ force: true })
    await expect(page.getByTestId('entry-editor')).toBeVisible()

    const editor = page.getByTestId('entry-editor')
    await expect(editor).toHaveScreenshot(
      'entry-editor-tag-input-empty-desktop.png',
      { threshold: 0.01, maxDiffPixels: 50 }
    )
  })

  test('tag input - with chips - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await goToEntriesPage(page)
    await createEntry(page, 'VRT editor tags with chips')
    const entry = page.getByTestId('entry-card').first()
    await entry
      .getByRole('button', { name: /edit entry/i })
      .click({ force: true })
    await expect(page.getByTestId('entry-editor')).toBeVisible()
    await addTagViaEditorForVRT(page, 'VrtEditorChipTag')

    const editor = page.getByTestId('entry-editor')
    await expect(editor).toHaveScreenshot(
      'entry-editor-tag-input-with-chip-desktop.png',
      { threshold: 0.01, maxDiffPixels: 50 }
    )
  })

  test('tag input - with chips - mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await goToEntriesPage(page)
    await createEntry(page, 'VRT editor mobile tags with chips')
    const entry = page.getByTestId('entry-card').first()
    await entry.getByRole('button', { name: /edit entry/i }).click()
    await expect(page.getByTestId('entry-editor')).toBeVisible()
    await addTagViaEditorForVRT(page, 'VrtMobileEditorTag')

    const editor = page.getByTestId('entry-editor')
    await expect(editor).toHaveScreenshot(
      'entry-editor-tag-input-with-chip-mobile.png',
      { threshold: 0.01, maxDiffPixels: 50 }
    )
  })
})

// =============================================================================
// Tags page — full layout screenshots
// =============================================================================

test.describe('Visual Regression: Tags page layout', () => {
  test('tags page layout - desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await goToEntriesPage(page)
    await createEntryWithTag(page, 'VRT page layout entry', 'VrtPageLayoutTag')
    await prepareTagsPageForVRT(page)

    await expect(page).toHaveScreenshot('tags-page-layout-desktop.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500
    })
  })

  test('tags page layout - mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await goToEntriesPage(page)
    await createEntry(page, 'VRT mobile page layout entry')
    const entry = page.getByTestId('entry-card').first()
    await entry.getByRole('button', { name: /edit entry/i }).click()
    await expect(page.getByTestId('entry-editor')).toBeVisible()
    await addTagViaEditorForVRT(page, 'VrtMobilePageTag')
    await saveEntryEdit(page)
    await prepareTagsPageForVRT(page)

    await expect(page).toHaveScreenshot('tags-page-layout-mobile.png', {
      fullPage: true,
      threshold: 0.02,
      maxDiffPixels: 500
    })
  })
})
