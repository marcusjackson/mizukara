/**
 * Date Utility Functions
 *
 * Provides date formatting, arithmetic, and validation using native JavaScript Date API.
 * All dates use local timezone (no UTC conversion).
 */

/**
 * Format date as ISO string (YYYY-MM-DD)
 *
 * @param date - Date object to format
 * @returns ISO date string in YYYY-MM-DD format
 *
 * @example
 * formatDateISO(new Date(2026, 0, 15)) // '2026-01-15'
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${String(year)}-${month}-${day}`
}

/**
 * Parse ISO date string to Date object
 *
 * @param dateString - ISO date string in YYYY-MM-DD format
 * @returns Date object set to midnight local time
 *
 * @example
 * const date = parseISODate('2026-01-15')
 * console.log(date.getFullYear()) // 2026
 * console.log(date.getMonth()) // 0 (January)
 * console.log(date.getDate()) // 15
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00')
}

/**
 * Format date as long string (e.g., "Thursday, January 15, 2026")
 *
 * @param date - Date object or ISO string to format
 * @returns Long format date string with weekday, month, day, and year
 *
 * @example
 * formatDateLong('2026-01-15') // 'Thursday, January 15, 2026'
 * formatDateLong(new Date(2026, 0, 15)) // 'Thursday, January 15, 2026'
 */
export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? parseISODate(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format date as medium string (e.g., "Mon, Feb 9, 2026")
 *
 * @param date - Date object or ISO string to format
 * @returns Medium format date string with abbreviated weekday, month, day, and year
 *
 * @example
 * formatDateMedium('2026-02-09') // 'Mon, Feb 9, 2026'
 */
export function formatDateMedium(date: string | Date): string {
  const d = typeof date === 'string' ? parseISODate(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format date as short string (e.g., "Jan 15")
 *
 * @param date - Date object or ISO string to format
 * @returns Short format date string with abbreviated month and day
 *
 * @example
 * formatDateShort('2026-01-15') // 'Jan 15'
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISODate(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Add days to a date
 *
 * @param date - Date object or ISO string
 * @param days - Number of days to add (can be negative)
 * @returns New date as ISO string (YYYY-MM-DD)
 *
 * @example
 * addDays('2026-01-15', 7) // '2026-01-22'
 * addDays('2026-01-15', -7) // '2026-01-08'
 */
export function addDays(date: string | Date, days: number): string {
  const d = typeof date === 'string' ? parseISODate(date) : new Date(date)
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return formatDateISO(result)
}

/**
 * Subtract days from a date
 *
 * @param date - Date object or ISO string
 * @param days - Number of days to subtract
 * @returns New date as ISO string (YYYY-MM-DD)
 *
 * @example
 * subtractDays('2026-01-15', 7) // '2026-01-08'
 */
export function subtractDays(date: string | Date, days: number): string {
  return addDays(date, -days)
}

/**
 * Get today's date as ISO string
 *
 * @returns Current date in YYYY-MM-DD format (local timezone)
 *
 * @example
 * getToday() // '2026-02-11' (if run on Feb 11, 2026)
 */
export function getToday(): string {
  return formatDateISO(new Date())
}

/**
 * Validate ISO date string format (YYYY-MM-DD)
 *
 * Checks both format and validity (e.g., rejects 2026-02-31).
 * Validates date is within reasonable range (1900-2100).
 *
 * @param dateString - String to validate
 * @returns true if valid ISO date format and date exists, false otherwise
 *
 * @example
 * isValidISODate('2026-01-15') // true
 * isValidISODate('2026-1-15')  // false (single digit month)
 * isValidISODate('2026-13-01') // false (invalid month)
 * isValidISODate('2026-02-31') // false (February doesn't have 31 days)
 * isValidISODate('9999-01-01') // false (year out of range)
 */
export function isValidISODate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) {
    return false
  }

  const date = new Date(dateString + 'T00:00:00')
  if (Number.isNaN(date.getTime())) {
    return false
  }

  // Check if the parsed date matches the input
  const parts = dateString.split('-')
  if (parts.length !== 3) {
    return false
  }
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  // Validate reasonable date range
  if (year < 1900 || year > 2100) {
    return false
  }

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * Add months to a "YYYY-MM" month string
 *
 * @param month - Month string in YYYY-MM format
 * @param months - Number of months to add (can be negative)
 * @returns New month as a YYYY-MM string
 *
 * @example
 * addMonths('2026-01', 1)  // '2026-02'
 * addMonths('2026-01', -1) // '2025-12'
 */
export function addMonths(month: string, months: number): string {
  const { month: monthNum, year } = parseMonthString(month)
  const result = new Date(year, monthNum - 1 + months, 1)
  const resultYear = String(result.getFullYear())
  const resultMonth = String(result.getMonth() + 1).padStart(2, '0')
  return `${resultYear}-${resultMonth}`
}

/**
 * Format a "YYYY-MM" month string as a long month/year label
 *
 * @param month - Month string in YYYY-MM format
 * @returns Formatted label (e.g. "February 2026")
 *
 * @example
 * formatMonthYear('2026-02') // 'February 2026'
 */
export function formatMonthYear(month: string): string {
  const { month: monthNum, year } = parseMonthString(month)
  const date = new Date(year, monthNum - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Parse a "YYYY-MM" month string into its numeric year and 1-indexed month.
 * A missing or non-numeric segment falls back to 0 (year) or 1 (month) —
 * callers that accept untrusted input (e.g. a URL param) should validate
 * with isValidMonthString first rather than relying on this fallback.
 */
export function parseMonthString(month: string): {
  year: number
  month: number
} {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthNum = Number(monthStr)
  return {
    year: Number.isNaN(year) ? 0 : year,
    month: Number.isNaN(monthNum) ? 1 : monthNum
  }
}

/**
 * Validate a "YYYY-MM" month string (zero-padded, month 01-12)
 *
 * @param month - String to validate
 * @returns true if the string is a well-formed, zero-padded YYYY-MM month
 *
 * @example
 * isValidMonthString('2026-02') // true
 * isValidMonthString('2026-2')  // false (not zero-padded)
 * isValidMonthString('2026-13') // false (month out of range)
 */
export function isValidMonthString(month: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(month)) return false
  const monthNum = Number(month.slice(5, 7))
  return monthNum >= 1 && monthNum <= 12
}

/**
 * Build a month's calendar grid as weeks of ISO date strings
 *
 * Each week is a 7-element array running Sunday through Saturday. Cells
 * outside the given month (padding at the start/end of the grid) are `null`.
 *
 * @param year - Full year (e.g. 2026)
 * @param month - Month number, 1-indexed (1 = January)
 * @returns Array of weeks, each a 7-element array of ISO date strings or null
 *
 * @example
 * getMonthGrid(2026, 2)
 * // [[null, null, null, null, null, null, '2026-02-01'], ['2026-02-02', ...], ...]
 */
export function getMonthGrid(year: number, month: number): (string | null)[][] {
  const firstOfMonth = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leadingBlanks = firstOfMonth.getDay()

  const cells: (string | null)[] = Array.from(
    { length: leadingBlanks },
    () => null
  )

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(formatDateISO(new Date(year, month - 1, day)))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return weeks
}

/**
 * Format timestamp as short string (e.g., "Feb 10, 2026, 2:30 PM")
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Short format timestamp string with month, day, year, hour, and minute
 *
 * @example
 * formatTimestampShort(1707592200000) // 'Feb 10, 2026, 2:30 PM'
 */
export function formatTimestampShort(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
