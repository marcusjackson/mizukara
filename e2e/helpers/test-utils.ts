/**
 * E2E Test Utilities
 *
 * Reusable helper functions for E2E tests.
 * Reduces duplication and ensures consistent test patterns.
 */

import { expect } from '@playwright/test'

import type { Locator, Page } from '@playwright/test'

/**
 * Wait for page to be fully loaded and ready for interaction
 * @param page - Playwright page object
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await expect(page.getByTestId('create-form')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('error-container')).not.toBeVisible()
}

/**
 * Create an entry with given content
 * @param page - Playwright page object
 * @param content - Entry content text
 * @returns Locator for the created entry card
 */
export async function createEntry(
  page: Page,
  content: string
): Promise<Locator> {
  await page.getByLabel('Content').fill(content)
  await page.getByRole('button', { name: 'New Entry' }).click()

  const entry = page.getByTestId('entry-card').filter({ hasText: content })
  await expect(entry).toBeVisible()
  return entry
}

/**
 * Navigate to a specific day using navigation buttons
 * @param page - Playwright page object
 * @param direction - Direction to navigate ('next' or 'previous')
 */
export async function navigateToDay(
  page: Page,
  direction: 'next' | 'previous'
): Promise<void> {
  const currentUrl = page.url()
  const button = page.getByRole('button', { name: new RegExp(direction, 'i') })
  await button.click()
  await expect(page).not.toHaveURL(currentUrl)
}

/**
 * Start editing an entry
 * @param entryCard - Locator for the entry card
 * @param isMobile - Whether viewport is mobile size (skip hover)
 */
export async function startEditingEntry(
  entryCard: Locator,
  isMobile = false
): Promise<void> {
  if (!isMobile) {
    await entryCard.hover()
  }
  const editButton = entryCard.getByRole('button', { name: /edit entry/i })
  await editButton.click()
}

/**
 * Check if viewport is mobile size
 * @param page - Playwright page object
 * @returns true if viewport width is less than 768px
 */
export function isMobileViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1024) < 768
}

/**
 * Get entry editor locator
 * @param page - Playwright page object
 * @returns Locator for the entry editor
 */
export function getEntryEditor(page: Page): Locator {
  return page.getByTestId('entry-editor')
}

/**
 * Get entry editor textarea
 * @param page - Playwright page object
 * @returns Locator for the editor textarea
 */
export function getEditorTextarea(page: Page): Locator {
  return getEntryEditor(page).getByPlaceholder(/enter your thoughts/i)
}

/**
 * Save entry from editor
 * @param page - Playwright page object
 */
export async function saveEntryEdit(page: Page): Promise<void> {
  const saveButton = getEntryEditor(page).getByRole('button', { name: 'Save' })
  await saveButton.click()
  await expect(getEntryEditor(page)).not.toBeVisible()
}

/**
 * Cancel entry edit
 * @param page - Playwright page object
 */
export async function cancelEntryEdit(page: Page): Promise<void> {
  const cancelButton = getEntryEditor(page).getByRole('button', {
    name: 'Cancel'
  })
  await cancelButton.click()
  await expect(getEntryEditor(page)).not.toBeVisible()
}

/**
 * Get relative date in YYYY-MM-DD format (local timezone)
 * @param daysOffset - Number of days to offset from today (negative for past)
 * @returns ISO date string (YYYY-MM-DD) in local timezone
 */
export function getRelativeDate(daysOffset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  // Use local time components, not UTC (toISOString converts to UTC)
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDate(): string {
  return getRelativeDate(-1)
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export function getTomorrowDate(): string {
  return getRelativeDate(1)
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return getRelativeDate(0)
}

/**
 * Navigate directly to a specific date
 * @param page - Playwright page object
 * @param targetDate - Target date in YYYY-MM-DD format
 */
export async function navigateToDate(
  page: Page,
  targetDate: string
): Promise<void> {
  await page.goto(`/entries/${targetDate}`, { waitUntil: 'networkidle' })
  await waitForPageReady(page)
}
