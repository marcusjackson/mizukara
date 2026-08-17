/**
 * Route Paths
 *
 * Centralized route path constants for the application.
 * All route paths should be imported from here to ensure consistency
 * and make path changes easier to manage.
 */

/**
 * Application Routes
 */
export const ROUTES = {
  HOME: '/',
  ENTRY_DAY: '/entries/:date?',
  SETTINGS: '/settings',
  TAGS: '/tags'
} as const

/**
 * Builds the URL path for the entry day view for a given date.
 *
 * @param date - ISO 8601 date string (YYYY-MM-DD)
 * @returns URL path string for the entry day view route
 * @example buildEntryDayRoute('2026-02-10') // '/entries/2026-02-10'
 */
export function buildEntryDayRoute(date: string): string {
  return `/entries/${date}`
}

/**
 * Build the document title for a given page title.
 *
 * Extracted as a pure function so it can be unit-tested independently of the
 * router lifecycle hook.
 *
 * @param pageTitle - The page-specific title from route meta, or undefined
 * @returns Full document title string
 * @example buildPageTitle('Settings') // 'Settings | Mizukara'
 * @example buildPageTitle(undefined) // 'Mizukara'
 */
export function buildPageTitle(pageTitle: string | undefined): string {
  return pageTitle ? `${pageTitle} | Mizukara` : 'Mizukara'
}
