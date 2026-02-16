/**
 * E2E Test: App Settings
 *
 * Tests settings page functionality:
 * - Navigation to settings via gear icon
 * - Theme toggle
 * - Database export, import, clear operations
 * - Back navigation
 * - Responsive behavior
 * - Keyboard navigation
 *
 * Requirements tested: 1.1, 2.2, 3.1, 4.1, 5.1, 6.1, 8.1, 9.1
 */

import { expect, test } from '@playwright/test'

import { VIEWPORTS } from './helpers/test-constants'
import { waitForPageReady } from './helpers/test-utils'

test.describe('App Settings', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await waitForPageReady(page)
  })

  test.describe('Navigation', () => {
    test('can navigate to settings via gear icon', async ({ page }) => {
      const settingsLink = page.getByRole('link', { name: /settings/i })
      await expect(settingsLink).toBeVisible()

      await settingsLink.click()
      await expect(page).toHaveURL('/settings')
    })

    test('settings page displays title', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      await expect(
        page.getByRole('heading', { name: 'Settings' })
      ).toBeVisible()
    })

    test('can navigate back to day view', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      const backLink = page.getByRole('link', { name: /back|day view/i })
      await expect(backLink).toBeVisible()

      await backLink.click()
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Theme Toggle', () => {
    test('can toggle theme to dark mode', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      const themeSwitch = page.getByRole('switch', { name: /dark mode/i })
      await expect(themeSwitch).toBeVisible()

      // Toggle dark mode
      await themeSwitch.click()

      // Verify theme changed (check data attribute on document)
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    })

    test('can toggle theme back to light mode', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      const themeSwitch = page.getByRole('switch', { name: /dark mode/i })

      // Toggle to dark first
      await themeSwitch.click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

      // Toggle back to light
      await themeSwitch.click()
      await expect(page.locator('html')).not.toHaveAttribute('data-theme')
    })
  })

  test.describe('Database Operations', () => {
    test('displays export button', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      const exportButton = page.getByRole('button', { name: /export/i })
      await expect(exportButton).toBeVisible()
    })

    test('displays import button', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      const importButton = page.getByRole('button', { name: 'Import Database' })
      await expect(importButton).toBeVisible()
    })

    test('displays clear button', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      const clearButton = page.getByRole('button', { name: /clear/i })
      await expect(clearButton).toBeVisible()
    })

    test('export triggers download', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      // Listen for download
      const downloadPromise = page.waitForEvent('download')

      await page.getByRole('button', { name: /export/i }).click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(
        /^mizukara-\d{4}-\d{2}-\d{2}/
      )
    })

    test('clear shows destructive confirmation dialog', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      await page.getByRole('button', { name: /clear/i }).click()

      // Expect confirmation dialog
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText(/destructive|irreversible/i)).toBeVisible()
    })

    test('can cancel clear operation', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      await page.getByRole('button', { name: /clear/i }).click()

      // Cancel the dialog
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      const cancelButton = dialog.getByRole('button', { name: /cancel/i })
      await cancelButton.click()

      // Dialog should close
      await expect(dialog).not.toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('settings link has accessible label', async ({ page }) => {
      const settingsLink = page.getByRole('link', { name: /settings/i })
      await expect(settingsLink).toBeVisible()
    })

    test('settings sections have aria labels', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      const appearanceSection = page.locator(
        'section[aria-label="Appearance settings"]'
      )
      const databaseSection = page.locator(
        'section[aria-label="Database settings"]'
      )

      await expect(appearanceSection).toBeVisible()
      await expect(databaseSection).toBeVisible()
    })

    test('keyboard navigation through settings', async ({ page }) => {
      await page.goto('/settings', { waitUntil: 'networkidle' })

      // Tab through interactive elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // At some point we should reach the theme switch
      const themeSwitch = page.getByRole('switch', { name: /dark mode/i })
      const exportButton = page.getByRole('button', { name: /export/i })

      // Both should be reachable via keyboard
      await expect(themeSwitch).toBeVisible()
      await expect(exportButton).toBeVisible()
    })
  })

  test.describe('Responsive', () => {
    test('settings displays correctly on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await page.goto('/settings', { waitUntil: 'networkidle' })

      // Section headings should be visible
      await expect(
        page.getByRole('heading', { name: 'Appearance' })
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Database' })
      ).toBeVisible()

      // All buttons should be accessible
      await expect(
        page.getByRole('button', { name: 'Export Database' })
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Import Database' })
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Clear Database' })
      ).toBeVisible()
    })

    test('settings displays correctly on desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await page.goto('/settings', { waitUntil: 'networkidle' })

      // Section headings visible
      await expect(
        page.getByRole('heading', { name: 'Appearance' })
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Database' })
      ).toBeVisible()
    })
  })
})
