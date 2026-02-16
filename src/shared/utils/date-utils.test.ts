import { describe, expect, it } from 'vitest'

import {
  addDays,
  formatDateISO,
  formatDateLong,
  formatDateMedium,
  formatDateShort,
  formatTimestampShort,
  getToday,
  isValidISODate,
  parseISODate,
  subtractDays
} from './date-utils'

describe('date-utils', () => {
  describe('formatDateISO', () => {
    it('returns YYYY-MM-DD format', () => {
      const date = new Date(2026, 0, 15) // January 15, 2026
      expect(formatDateISO(date)).toBe('2026-01-15')
    })

    it('handles single digit months and days', () => {
      const date = new Date(2026, 0, 5) // January 5, 2026
      expect(formatDateISO(date)).toBe('2026-01-05')
    })
  })

  describe('formatDateLong', () => {
    it('returns full date string', () => {
      const date = new Date(2026, 0, 15) // January 15, 2026
      expect(formatDateLong(date)).toBe('Thursday, January 15, 2026')
    })

    it('accepts string input', () => {
      expect(formatDateLong('2026-01-15')).toBe('Thursday, January 15, 2026')
    })
  })

  describe('formatDateShort', () => {
    it('returns short date string', () => {
      const date = new Date(2026, 0, 15) // January 15, 2026
      expect(formatDateShort(date)).toBe('Jan 15')
    })

    it('accepts string input', () => {
      expect(formatDateShort('2026-01-15')).toBe('Jan 15')
    })
  })

  describe('formatDateMedium', () => {
    it('returns medium date string', () => {
      const date = new Date(2026, 0, 15) // January 15, 2026
      expect(formatDateMedium(date)).toBe('Thu, Jan 15, 2026')
    })

    it('accepts string input', () => {
      expect(formatDateMedium('2026-01-15')).toBe('Thu, Jan 15, 2026')
    })
  })

  describe('formatTimestampShort', () => {
    it('returns short timestamp string', () => {
      // February 10, 2026, 2:30 PM
      const timestamp = new Date(2026, 1, 10, 14, 30).getTime()
      expect(formatTimestampShort(timestamp)).toBe('Feb 10, 2026, 2:30 PM')
    })

    it('handles morning times', () => {
      // January 15, 2026, 9:05 AM
      const timestamp = new Date(2026, 0, 15, 9, 5).getTime()
      expect(formatTimestampShort(timestamp)).toBe('Jan 15, 2026, 9:05 AM')
    })

    it('handles midnight', () => {
      // December 31, 2025, 12:00 AM
      const timestamp = new Date(2025, 11, 31, 0, 0).getTime()
      expect(formatTimestampShort(timestamp)).toBe('Dec 31, 2025, 12:00 AM')
    })

    it('handles noon', () => {
      // June 15, 2026, 12:00 PM
      const timestamp = new Date(2026, 5, 15, 12, 0).getTime()
      expect(formatTimestampShort(timestamp)).toBe('Jun 15, 2026, 12:00 PM')
    })
  })

  describe('addDays', () => {
    it('adds days correctly', () => {
      expect(addDays('2026-01-15', 1)).toBe('2026-01-16')
      expect(addDays('2026-01-15', 7)).toBe('2026-01-22')
    })

    it('handles month boundaries', () => {
      expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    })

    it('handles year boundaries', () => {
      expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    })

    it('accepts Date input', () => {
      const date = new Date(2026, 0, 15)
      expect(addDays(date, 1)).toBe('2026-01-16')
    })
  })

  describe('subtractDays', () => {
    it('subtracts days correctly', () => {
      expect(subtractDays('2026-01-15', 1)).toBe('2026-01-14')
      expect(subtractDays('2026-01-15', 7)).toBe('2026-01-08')
    })

    it('handles month boundaries', () => {
      expect(subtractDays('2026-02-01', 1)).toBe('2026-01-31')
    })

    it('handles year boundaries', () => {
      expect(subtractDays('2026-01-01', 1)).toBe('2025-12-31')
    })

    it('accepts Date input', () => {
      const date = new Date(2026, 0, 15)
      expect(subtractDays(date, 1)).toBe('2026-01-14')
    })
  })

  describe('getToday', () => {
    it('returns current date as ISO string', () => {
      const today = new Date()
      const expected = formatDateISO(today)
      expect(getToday()).toBe(expected)
    })
  })

  describe('isValidISODate', () => {
    it('validates correct format', () => {
      expect(isValidISODate('2026-01-15')).toBe(true)
      expect(isValidISODate('2026-12-31')).toBe(true)
    })

    it('rejects incorrect format', () => {
      expect(isValidISODate('2026-1-15')).toBe(false) // single digit month
      expect(isValidISODate('2026-01-5')).toBe(false) // single digit day
      expect(isValidISODate('26-01-15')).toBe(false) // 2-digit year
    })

    it('rejects invalid dates', () => {
      expect(isValidISODate('2026-13-01')).toBe(false) // month > 12
      expect(isValidISODate('2026-02-31')).toBe(false) // Feb 31st
      expect(isValidISODate('2026-00-01')).toBe(false) // month 0
    })

    it('rejects dates outside reasonable range', () => {
      expect(isValidISODate('1899-12-31')).toBe(false) // before 1900
      expect(isValidISODate('2101-01-01')).toBe(false) // after 2100
      expect(isValidISODate('9999-01-01')).toBe(false) // far future
    })

    it('accepts dates within reasonable range', () => {
      expect(isValidISODate('1900-01-01')).toBe(true) // start of range
      expect(isValidISODate('2100-12-31')).toBe(true) // end of range
      expect(isValidISODate('2026-02-11')).toBe(true) // current era
      expect(isValidISODate('2026-02-28')).toBe(true)
    })

    it('rejects other invalid formats', () => {
      expect(isValidISODate('2026-13-15')).toBe(false) // invalid month
      expect(isValidISODate('2026-01-32')).toBe(false) // invalid day
      expect(isValidISODate('26-01-15')).toBe(false) // short year
      expect(isValidISODate('2026/01/15')).toBe(false) // wrong separator
      expect(isValidISODate('2026-01-15T00:00:00')).toBe(false) // with time
      expect(isValidISODate('')).toBe(false) // empty
      expect(isValidISODate('not-a-date')).toBe(false) // invalid
    })
  })

  describe('parseISODate', () => {
    it('converts string to Date object', () => {
      const date = parseISODate('2026-01-15')
      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(0) // January is 0
      expect(date.getDate()).toBe(15)
    })

    it('handles different dates', () => {
      const date = parseISODate('2025-12-31')
      expect(date.getFullYear()).toBe(2025)
      expect(date.getMonth()).toBe(11) // December is 11
      expect(date.getDate()).toBe(31)
    })
  })
})
