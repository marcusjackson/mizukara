/**
 * Helpers for reading the search page's URL query parameters.
 */

import type { LocationQueryValue } from 'vue-router'

type QueryParam = LocationQueryValue | LocationQueryValue[] | undefined

/** First value of a query parameter, or '' when it is absent. */
export function toStringParam(param: QueryParam): string {
  const value = Array.isArray(param) ? param[0] : param
  return value ?? ''
}

/** All non-empty values of a query parameter (repeated or single). */
export function toArrayParam(param: QueryParam): string[] {
  if (!param) return []
  const values = Array.isArray(param) ? param : [param]
  return values.filter((v): v is string => Boolean(v))
}
