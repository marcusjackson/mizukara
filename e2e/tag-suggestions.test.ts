/**
 * E2E Test: Tag suggestions
 *
 * Runs with no model downloaded, so suggestions come from the word matcher.
 * That is the path every device has, and it needs no network.
 *
 * - A tag named in the entry's own words is offered as a chip, and applying
 *   the chip puts it on the entry.
 * - A run that finds nothing says so on screen, and with no tags at all it
 *   links to the Tags page.
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

type Page = Parameters<typeof waitForPageReady>[0]

/** Put a new tag on the entry in the open editor. */
async function addTagViaEditor(page: Page, tagName: string): Promise<void> {
  const editor = getEntryEditor(page)
  const combobox = editor.getByRole('combobox')
  await combobox.click()
  await combobox.pressSequentially(tagName)
  await expect(page.getByText(`Create '${tagName}'`)).toBeVisible()
  await page.getByText(`Create '${tagName}'`).click()
  await expect(editor.getByTestId('tag-chips')).toContainText(tagName)
}

test.describe('Tag suggestions', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test('with no tags, says so and links to the Tags page', async ({ page }) => {
    const card = await createEntry(page, 'Gardening all afternoon')
    await startEditingEntry(card, isMobileViewport(page))

    const editor = getEntryEditor(page)
    await editor.getByRole('button', { name: 'Suggest tags' }).click()

    await expect(
      editor
        .locator('.entry-editor-tag-suggestions-notice')
        .getByText('you have not created any tags')
    ).toBeVisible()
    await editor.getByRole('link', { name: 'Add some starter tags' }).click()
    await expect(page).toHaveURL(/\/tags$/)
  })

  test('offers a tag named in the entry, and applies it on click', async ({
    page
  }) => {
    test.slow() // Creates a tag, then opens a second editor

    // A tag has to exist before it can be suggested.
    const first = await createEntry(page, 'Seeding a tag called Gardening')
    await startEditingEntry(first, isMobileViewport(page))
    await addTagViaEditor(page, 'Gardening')
    await saveEntryEdit(page)

    const second = await createEntry(page, 'Gardening all afternoon')
    await startEditingEntry(second, isMobileViewport(page))

    const editor = getEntryEditor(page)
    await editor.getByRole('button', { name: 'Suggest tags' }).click()

    const chip = editor.getByRole('button', { name: 'Add Gardening' })
    await expect(chip).toBeVisible()
    await chip.click()

    await expect(editor.getByTestId('tag-chips')).toContainText('Gardening')
    await expect(chip).toBeHidden()
  })

  test('says so on screen when nothing matches', async ({ page }) => {
    test.slow()

    const first = await createEntry(page, 'Seeding a tag called Gardening')
    await startEditingEntry(first, isMobileViewport(page))
    await addTagViaEditor(page, 'Gardening')
    await saveEntryEdit(page)

    const second = await createEntry(page, 'Counting pills and feeling dizzy')
    await startEditingEntry(second, isMobileViewport(page))

    const editor = getEntryEditor(page)
    await editor.getByRole('button', { name: 'Suggest tags' }).click()

    await expect(
      editor
        .locator('.entry-editor-tag-suggestions-notice')
        .getByText('No tags to suggest for this entry.')
    ).toBeVisible()
  })
})
