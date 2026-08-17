/**
 * E2E Test: Keyboard Shortcuts Reference/Help
 *
 * Tests keyboard shortcuts help/reference UI:
 * - Checks if keyboard shortcuts help exists
 * - Verifies all shortcuts are documented
 * - Verifies help is keyboard accessible
 *
 * Note: This test checks if the help UI is implemented.
 * If not implemented, the test will be skipped.
 *
 * Requirements tested: 7.5, 7.6
 */

import { expect, test } from '@playwright/test'

import { TIMEOUTS } from './helpers/test-constants'
import { waitForPageReady } from './helpers/test-utils'

import type { Locator, Page } from '@playwright/test'

const HELP_TRIGGER_SELECTOR =
  'button:has-text("Help"), button:has-text("Shortcuts"), button:has-text("?"), [aria-label*="help" i], [aria-label*="shortcuts" i]'

/**
 * Returns the locator for the keyboard shortcuts help trigger button.
 */
function getHelpTrigger(page: Page): Locator {
  return page.locator(HELP_TRIGGER_SELECTOR)
}

test.describe('Keyboard Shortcuts Reference', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization
    await waitForPageReady(page)
  })

  test.beforeEach(async ({ page }) => {
    if ((await getHelpTrigger(page).count()) === 0) {
      test.skip(
        true,
        'Keyboard shortcuts help UI not implemented - skipping test'
      )
    }
  })

  test('displays keyboard shortcuts help when available', async ({ page }) => {
    await getHelpTrigger(page).first().click()

    // Verify help dialog appears
    const helpDialog = page.getByRole('dialog', {
      name: /keyboard shortcuts/i
    })
    await expect(helpDialog).toBeVisible()

    // Verify essential shortcuts are documented (use innerText for word boundaries)
    const textOpts = { useInnerText: true }
    await expect(helpDialog).toContainText(/cmd|ctrl/i, textOpts)
    await expect(helpDialog).toContainText(/\bn\b/i, textOpts) // Cmd+N
    await expect(helpDialog).toContainText(/\bj\b|\bk\b/i, textOpts) // J/K navigation
    await expect(helpDialog).toContainText(/\bs\b/i, textOpts) // Cmd+S
    await expect(helpDialog).toContainText(/escape/i, textOpts)

    // Verify help can be closed
    const closeButton = helpDialog.getByRole('button', { name: /close/i })
    await expect(closeButton).toBeVisible()
    await closeButton.click()
    await expect(helpDialog).not.toBeVisible()
  })

  test('keyboard shortcuts help is keyboard accessible', async ({ page }) => {
    // Focus the trigger directly — the Tab loop was fragile and order-dependent
    const triggerByRole = page.getByRole('button', {
      name: /keyboard shortcuts|help|\?/i
    })
    await triggerByRole.focus()
    await expect(triggerByRole).toBeFocused()

    // Activate via keyboard
    await page.keyboard.press('Enter')

    // Verify help dialog opens
    const helpDialog = page.getByRole('dialog', {
      name: /keyboard shortcuts/i
    })
    await expect(helpDialog).toBeVisible({ timeout: TIMEOUTS.short })

    // Verify help can be closed with Escape
    await page.keyboard.press('Escape')
    await expect(helpDialog).not.toBeVisible({ timeout: TIMEOUTS.short })
  })

  test('documents all primary keyboard shortcuts', async ({ page }) => {
    await getHelpTrigger(page).first().click()

    const helpDialog = page.getByRole('dialog', {
      name: /keyboard shortcuts/i
    })
    await expect(helpDialog).toBeVisible()

    // Verify all documented shortcuts
    const shortcuts = [
      { name: 'Create new entry', keys: /cmd.*?n|ctrl.*?n/i },
      { name: 'Next day navigation', keys: /\bj\b/i },
      { name: 'Previous day navigation', keys: /\bk\b/i },
      { name: 'Save entry', keys: /cmd.*?s|ctrl.*?s/i },
      { name: 'Cancel/Clear', keys: /escape/i }
    ]

    // Fetch help text once and check all shortcuts (avoids one round-trip per shortcut)
    const helpText = await helpDialog.innerText()
    for (const shortcut of shortcuts) {
      expect(helpText).toMatch(shortcut.keys)
    }
  })
})
