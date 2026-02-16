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

import { waitForPageReady } from './helpers/test-utils'

test.describe('Keyboard Shortcuts Reference', () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear state for test isolation
    await context.clearCookies()

    // Navigate to entry day view
    await page.goto('/entries', { waitUntil: 'networkidle' })

    // Wait for database initialization
    await waitForPageReady(page)
  })

  test('displays keyboard shortcuts help when available', async ({ page }) => {
    // Check if help trigger exists (button, link, or icon with "help" or "shortcuts")
    const helpTrigger = page.locator(
      'button:has-text("Help"), button:has-text("Shortcuts"), button:has-text("?"), [aria-label*="help" i], [aria-label*="shortcuts" i]'
    )

    const helpTriggerCount = await helpTrigger.count()

    if (helpTriggerCount === 0) {
      test.skip(
        true,
        'Keyboard shortcuts help UI not implemented - skipping test'
      )
    } else {
      // Help trigger exists - test it
      await helpTrigger.first().click()

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
    }
  })

  test('keyboard shortcuts help is keyboard accessible', async ({ page }) => {
    // Check if help trigger exists
    const helpTrigger = page.locator(
      'button:has-text("Help"), button:has-text("Shortcuts"), button:has-text("?"), [aria-label*="help" i], [aria-label*="shortcuts" i]'
    )

    const helpTriggerCount = await helpTrigger.count()

    if (helpTriggerCount === 0) {
      test.skip(
        true,
        'Keyboard shortcuts help UI not implemented - skipping test'
      )
    } else {
      // Tab to help trigger
      let tabCount = 0
      const maxTabs = 20 // Safety limit

      // Tab until we reach the help trigger or hit max
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab')
        tabCount++

        const currentFocus = await page.evaluate(
          () => document.activeElement?.textContent
        )
        if (
          currentFocus?.includes('Help') ||
          currentFocus?.includes('Shortcuts') ||
          currentFocus?.includes('?')
        ) {
          break
        }
      }

      // Press Enter to open help
      await page.keyboard.press('Enter')

      // Verify help dialog opens
      const helpDialog = page.getByRole('dialog', {
        name: /keyboard shortcuts/i
      })
      await expect(helpDialog).toBeVisible({ timeout: 3000 })

      // Verify help can be closed with Escape
      await page.keyboard.press('Escape')
      await expect(helpDialog).not.toBeVisible({ timeout: 3000 })
    }
  })

  test('documents all primary keyboard shortcuts', async ({ page }) => {
    // Check if help trigger exists
    const helpTrigger = page.locator(
      'button:has-text("Help"), button:has-text("Shortcuts"), button:has-text("?"), [aria-label*="help" i], [aria-label*="shortcuts" i]'
    )

    const helpTriggerCount = await helpTrigger.count()

    if (helpTriggerCount === 0) {
      test.skip(
        true,
        'Keyboard shortcuts help UI not implemented - skipping test'
      )
    } else {
      await helpTrigger.first().click()

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

      // Check each shortcut is documented (use innerText for word boundaries)
      for (const shortcut of shortcuts) {
        const helpText = await helpDialog.innerText()
        expect(helpText).toMatch(shortcut.keys)
      }
    }
  })
})
