/**
 * E2E Test: Tags Feature
 *
 * Tests the full tags workflow:
 * 12.1 - Tag creation and persistence via the entry editor
 * 12.2 - Tag removal via the entry editor
 * 12.3 - Tag browsing and multi-tag filtering on the tags page
 * 12.4 - Tag rename and delete from the browse view
 *
 * Requirements tested: 1.3, 1.4, 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { expect, test } from '@playwright/test'

import {
  createEntry,
  getEntryEditor,
  isMobileViewport,
  saveEntryEdit,
  startEditingEntry,
  waitForPageReady
} from './helpers/test-utils'

// =============================================================================
// Helpers
// =============================================================================

/**
 * Wait for the /tags page to be fully loaded.
 */
async function waitForTagsPageReady(
  page: Parameters<typeof waitForPageReady>[0]
): Promise<void> {
  await expect(
    page.getByRole('heading', { name: 'Tags', level: 1 })
  ).toBeVisible({
    timeout: 10000
  })
}

/**
 * Add a tag to the currently open entry editor by typing its name and
 * selecting the inline "Create '…'" option.
 */
async function addTagViaEditor(
  page: Parameters<typeof waitForPageReady>[0],
  tagName: string
): Promise<void> {
  const editor = getEntryEditor(page)
  const tagCombobox = editor.getByRole('combobox')
  // Use pressSequentially to trigger per-keystroke events that Reka UI's
  // ComboboxInput relies on to update the internal search term.
  await tagCombobox.click()
  await tagCombobox.pressSequentially(tagName)
  // Synthetic create option is rendered in a portal outside the editor.
  // Wait for it to become visible before clicking.
  await expect(page.getByText(`Create '${tagName}'`)).toBeVisible()
  await page.getByText(`Create '${tagName}'`).click()
  // Verify chip is now visible in the editor
  await expect(editor.getByTestId('tag-chips')).toContainText(tagName)
}

// =============================================================================
// 12.1 — Tag creation and persistence via the entry editor
// =============================================================================

test.describe('Tag creation via entry editor (12.1)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('creates a tag via the entry editor and chip appears', async ({
    page
  }) => {
    const entryCard = await createEntry(page, 'Entry for tag creation test')
    await startEditingEntry(entryCard, isMobileViewport(page))

    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    // Type a new tag name into the combobox
    const tagCombobox = editor.getByRole('combobox')
    await tagCombobox.fill('WorkE2E')

    // The synthetic create option should appear
    await expect(page.getByText("Create 'WorkE2E'")).toBeVisible()

    // Click the create option
    await page.getByText("Create 'WorkE2E'").click()

    // Chip should appear in the editor
    await expect(editor.getByTestId('tag-chips')).toContainText('WorkE2E')
  })

  test('tag chip persists after saving and reopening the entry editor', async ({
    page
  }) => {
    test.slow() // Multiple editor open/close cycles

    const entryCard = await createEntry(
      page,
      'Entry to test tag persistence E2E'
    )

    // Open editor and add a tag
    await startEditingEntry(entryCard, isMobileViewport(page))
    await addTagViaEditor(page, 'PersistTagE2E')

    // Save the entry
    await saveEntryEdit(page)

    // Tags should be visible on the entry card after save
    const card = page.getByTestId('entry-card').filter({
      hasText: 'Entry to test tag persistence E2E'
    })
    await expect(card.getByTestId('entry-tags')).toContainText('PersistTagE2E')

    // Reopen the editor
    await startEditingEntry(card, isMobileViewport(page))
    const editor = getEntryEditor(page)
    await expect(editor).toBeVisible()

    // Chip should still be present
    await expect(editor.getByTestId('tag-chips')).toContainText('PersistTagE2E')
  })
})

// =============================================================================
// 12.2 — Tag removal via the entry editor
// =============================================================================

test.describe('Tag removal via entry editor (12.2)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('removes a tag chip and it is gone after save and reopen', async ({
    page
  }) => {
    test.slow() // Two open/save/reopen cycles

    const entryCard = await createEntry(page, 'Entry to remove tag from E2E')

    // Add a tag first
    await startEditingEntry(entryCard, isMobileViewport(page))
    await addTagViaEditor(page, 'RemoveMeTagE2E')
    await saveEntryEdit(page)

    // Reopen and remove the chip
    const card = page.getByTestId('entry-card').filter({
      hasText: 'Entry to remove tag from E2E'
    })
    await startEditingEntry(card, isMobileViewport(page))
    const editor = getEntryEditor(page)
    await expect(editor.getByTestId('tag-chips')).toContainText(
      'RemoveMeTagE2E'
    )

    // Click the chip's remove button
    await page.getByRole('button', { name: 'Remove RemoveMeTagE2E' }).click()

    // Chip should be gone from the editor
    await expect(editor.getByTestId('tag-chips')).not.toBeVisible()

    // Save the entry
    await saveEntryEdit(page)

    // Entry card tags area should no longer show the tag
    await expect(card.getByTestId('entry-tags')).not.toBeVisible()

    // Reopen editor — chip should still be absent
    await startEditingEntry(card, isMobileViewport(page))
    await expect(
      getEntryEditor(page).getByTestId('tag-chips')
    ).not.toBeVisible()
  })
})

// =============================================================================
// 12.3 — Tag browsing and multi-tag filtering
// =============================================================================

test.describe('Tag browsing and multi-tag filtering (12.3)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('filters entries by single and multiple tags, then clears filter', async ({
    page
  }) => {
    test.slow() // Setup requires creating entries and tags

    // Create two entries
    const entry1 = await createEntry(page, 'FilterEntry1 E2E (alpha only)')
    await createEntry(page, 'FilterEntry2 E2E (alpha and beta)')

    // Entry 1 gets only TagAlphaE2E
    await startEditingEntry(entry1, isMobileViewport(page))
    await addTagViaEditor(page, 'TagAlphaE2E')
    await saveEntryEdit(page)

    // Entry 2 gets TagAlphaE2E (existing) and TagBetaE2E (new to create)
    const card2 = page
      .getByTestId('entry-card')
      .filter({ hasText: 'FilterEntry2 E2E (alpha and beta)' })
    await startEditingEntry(card2, isMobileViewport(page))

    const editor = getEntryEditor(page)
    const combobox = editor.getByRole('combobox')

    // TagAlphaE2E already exists — select from the dropdown list
    await combobox.click()
    await combobox.pressSequentially('TagAlphaE2E')
    await expect(
      page.getByRole('option', { name: 'TagAlphaE2E' })
    ).toBeVisible()
    await page.getByRole('option', { name: 'TagAlphaE2E' }).click()
    await expect(editor.getByTestId('tag-chips')).toContainText('TagAlphaE2E')

    // TagBetaE2E is new — create it inline
    await combobox.click()
    await combobox.pressSequentially('TagBetaE2E')
    await expect(page.getByText("Create 'TagBetaE2E'")).toBeVisible()
    await page.getByText("Create 'TagBetaE2E'").click()
    await expect(editor.getByTestId('tag-chips')).toContainText('TagBetaE2E')
    await saveEntryEdit(page)

    // Navigate to /tags
    await page.goto('/tags', { waitUntil: 'networkidle' })
    await waitForTagsPageReady(page)

    // Both tags should be listed
    await expect(
      page.getByRole('button', { name: 'Select TagAlphaE2E' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Select TagBetaE2E' })
    ).toBeVisible()

    // Initial state: no filter active
    await expect(page.getByTestId('empty-no-filter')).toBeVisible()

    // Select TagAlphaE2E — both entries should appear
    await page.getByRole('button', { name: 'Select TagAlphaE2E' }).click()
    await expect(page.getByTestId('entry-card')).toHaveCount(2)
    await expect(page.getByTestId('clear-filter-btn')).toBeVisible()

    // Also select TagBetaE2E — only entry 2 should appear (intersection)
    await page.getByRole('button', { name: 'Select TagBetaE2E' }).click()
    await expect(page.getByTestId('entry-card')).toHaveCount(1)
    await expect(
      page.getByTestId('entry-card').getByTestId('entry-content')
    ).toContainText('FilterEntry2 E2E (alpha and beta)')

    // Clear filter — entry list should clear (empty-no-filter shown)
    await page.getByTestId('clear-filter-btn').click()
    await expect(page.getByTestId('empty-no-filter')).toBeVisible()
    await expect(page.getByTestId('entry-card')).toHaveCount(0)
  })
})

// =============================================================================
// 12.4 — Tag rename and delete from the browse view
// =============================================================================

test.describe('Tag rename and delete from browse view (12.4)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('renames a tag and new name is reflected in the tag list', async ({
    page
  }) => {
    test.slow()

    // Create an entry and add a tag
    const entryCard = await createEntry(page, 'Entry for rename test E2E')
    await startEditingEntry(entryCard, isMobileViewport(page))
    await addTagViaEditor(page, 'OldNameTagE2E')
    await saveEntryEdit(page)

    // Navigate to /tags
    await page.goto('/tags', { waitUntil: 'networkidle' })
    await waitForTagsPageReady(page)

    // Click Rename button for the tag
    await page.getByRole('button', { name: 'Rename OldNameTagE2E' }).click()

    // An input should appear — clear it and type the new name
    const renameInput = page.locator('[data-testid^="rename-input"]')
    await renameInput.clear()
    await renameInput.fill('NewNameTagE2E')
    await renameInput.press('Enter')

    // New name should be in the tag list
    await expect(
      page.getByRole('button', { name: 'Select NewNameTagE2E' })
    ).toBeVisible()
    // Old name should be gone
    await expect(
      page.getByRole('button', { name: 'Select OldNameTagE2E' })
    ).not.toBeVisible()
  })

  test('deletes a tag after confirmation and it is removed from the list', async ({
    page
  }) => {
    test.slow()

    // Create an entry and add a tag
    const entryCard = await createEntry(page, 'Entry for delete test E2E')
    await startEditingEntry(entryCard, isMobileViewport(page))
    await addTagViaEditor(page, 'DeleteMeTagE2E')
    await saveEntryEdit(page)

    // Navigate to /tags
    await page.goto('/tags', { waitUntil: 'networkidle' })
    await waitForTagsPageReady(page)

    // Tag should be listed
    await expect(
      page.getByRole('button', { name: 'Select DeleteMeTagE2E' })
    ).toBeVisible()

    // Click Delete button
    await page.getByRole('button', { name: 'Delete DeleteMeTagE2E' }).click()

    // Confirmation dialog should appear
    const deleteDialog = page.getByRole('dialog', { name: /delete tag/i })
    await expect(deleteDialog).toBeVisible()

    // Confirm the deletion (danger variant: button text is "Delete")
    await deleteDialog.getByRole('button', { name: 'Delete' }).click()

    // Tag should be gone from the list
    await expect(
      page.getByRole('button', { name: 'Select DeleteMeTagE2E' })
    ).not.toBeVisible()
  })
})

// =============================================================================
// T-8 — Renaming an active filter tag reflects new name (12.4 extension)
// =============================================================================

test.describe('Rename active filter tag reflects new name (T-8)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('renaming an active filter tag updates the tag label in the browse list', async ({
    page
  }) => {
    test.slow()

    // Create an entry and add a tag
    const entryCard = await createEntry(
      page,
      'Entry for active-filter rename T8'
    )
    await startEditingEntry(entryCard, isMobileViewport(page))
    await addTagViaEditor(page, 'ActiveFilterTagT8')
    await saveEntryEdit(page)

    // Navigate to /tags
    await page.goto('/tags', { waitUntil: 'networkidle' })
    await waitForTagsPageReady(page)

    // Select the tag as active filter
    await page.getByRole('button', { name: 'Select ActiveFilterTagT8' }).click()

    // Entry should appear in the right panel
    await expect(page.getByTestId('entry-card')).toBeVisible()

    // Rename the tag while it is active in the filter
    await page.getByRole('button', { name: 'Rename ActiveFilterTagT8' }).click()
    const renameInput = page.locator('[data-testid^="rename-input"]')
    await renameInput.clear()
    await renameInput.fill('RenamedActiveFilterT8')
    await renameInput.press('Enter')

    // New name appears in browse list
    await expect(
      page.getByRole('button', { name: 'Select RenamedActiveFilterT8' })
    ).toBeVisible()

    // Old name is gone
    await expect(
      page.getByRole('button', { name: 'Select ActiveFilterTagT8' })
    ).not.toBeVisible()

    // The filtered entries are still visible (filter still active, re-fetched)
    await expect(page.getByTestId('entry-card')).toBeVisible()
  })
})

// =============================================================================
// T-9 — Keyboard-only rename flow (12.4 accessibility)
// =============================================================================

test.describe('Keyboard-only rename flow (T-9)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('rename input receives focus automatically when Rename is activated via keyboard', async ({
    page
  }) => {
    test.slow()

    // Create an entry and add a tag
    const entryCard = await createEntry(page, 'Entry for keyboard rename T9')
    await startEditingEntry(entryCard, isMobileViewport(page))
    await addTagViaEditor(page, 'KeyboardRenameTagT9')
    await saveEntryEdit(page)

    // Navigate to /tags
    await page.goto('/tags', { waitUntil: 'networkidle' })
    await waitForTagsPageReady(page)

    // Activate the Rename button via keyboard (click to focus, then Enter = keyboard activation)
    const renameBtn = page.getByRole('button', {
      name: 'Rename KeyboardRenameTagT9'
    })
    await renameBtn.focus()
    await page.keyboard.press('Enter')

    // Rename input should appear and have focus automatically (L-3 auto-focus fix)
    const renameInput = page.locator('[data-testid^="rename-input"]')
    await expect(renameInput).toBeVisible()
    await expect(renameInput).toBeFocused()

    // Type new name and submit with Enter
    await renameInput.fill('KeyboardRenamedT9')
    await page.keyboard.press('Enter')

    // New name should appear in the list
    await expect(
      page.getByRole('button', { name: 'Select KeyboardRenamedT9' })
    ).toBeVisible()
  })
})

// =============================================================================
// T-10 — Zero-count tag appears in tag list (12.3 edge case)
// =============================================================================

test.describe('Zero-count tag appears in tag list (T-10)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('tag with no associated entries shows with count 0 in the tag list', async ({
    page
  }) => {
    test.slow()

    // Create an entry and add a tag
    const entryCard = await createEntry(page, 'Entry for zero-count tag T10')
    await startEditingEntry(entryCard, isMobileViewport(page))
    await addTagViaEditor(page, 'ZeroCountTagT10')
    await saveEntryEdit(page)

    // Navigate to /tags — tag has count 1
    await page.goto('/tags', { waitUntil: 'networkidle' })
    await waitForTagsPageReady(page)
    await expect(
      page.getByRole('button', { name: 'Select ZeroCountTagT10' })
    ).toBeVisible()

    // Go back to entries and remove the tag from the entry
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)

    const card = page
      .getByTestId('entry-card')
      .filter({ hasText: 'Entry for zero-count tag T10' })
    await startEditingEntry(card, isMobileViewport(page))

    // Remove the tag chip from the editor
    const editor = getEntryEditor(page)
    await editor.getByRole('button', { name: 'Remove ZeroCountTagT10' }).click()
    await saveEntryEdit(page)

    // Navigate to /tags — tag should still be listed with count 0
    await page.goto('/tags', { waitUntil: 'networkidle' })
    await waitForTagsPageReady(page)

    // Tag row should still exist
    await expect(
      page.getByRole('button', { name: 'Select ZeroCountTagT10' })
    ).toBeVisible()

    // Count badge (title attribute contains "0 entries") should show 0
    const countBadge = page
      .locator('[data-testid^="tag-row-"]')
      .filter({
        has: page.getByRole('button', { name: 'Select ZeroCountTagT10' })
      })
      .locator('.tag-row__count')
    await expect(countBadge).toContainText('0')
  })
})
