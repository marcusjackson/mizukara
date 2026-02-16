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
  RECORD_LIST: '/records',
  RECORD_DETAIL: '/records/:id',
  SETTINGS: '/settings',
  COMING_SOON: '/coming-soon'
} as const

/**
 * Helper to build a route with parameters
 * @example buildRoute(ROUTES.RECORD_DETAIL, { id: '123' }) // '/records/123'
 */
export function buildRoute(
  path: string,
  params: Record<string, string | number>
): string {
  let result = path
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value))
  }
  return result
}
