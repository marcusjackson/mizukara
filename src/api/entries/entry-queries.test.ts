/**
 * Tests for entry query functions
 */

import { TEST_DATES } from '@test/constants/dates'
import { createTestDatabaseForEntries, seedEntry } from '@test/helpers/database'
import { describe, expect, it } from 'vitest'

import { findByDay, findById } from './entry-queries'

import type { Database } from 'sql.js'

describe('entry-queries', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForEntries()

    // Seed test data
    seedEntry(db, {
      id: 'entry-1',
      content: 'First entry',
      assignedDay: TEST_DATES.DEFAULT,
      orderPosition: 0
    })
    seedEntry(db, {
      id: 'entry-2',
      content: 'Second entry',
      assignedDay: TEST_DATES.DEFAULT,
      orderPosition: 1
    })
    seedEntry(db, {
      id: 'entry-3',
      content: 'Third entry',
      assignedDay: TEST_DATES.NEXT_DAY,
      orderPosition: 0
    })
    seedEntry(db, {
      id: 'entry-4',
      content: 'Deleted entry',
      assignedDay: TEST_DATES.DEFAULT,
      orderPosition: 2,
      isDeleted: true
    })
  })

  describe('findByDay', () => {
    it('returns entries for correct day only', () => {
      const result = findByDay(db, TEST_DATES.DEFAULT)

      expect(result).toHaveLength(2)
      expect(result[0]!.id).toBe('entry-1')
      expect(result[1]!.id).toBe('entry-2')
    })

    it('excludes soft-deleted entries', () => {
      const result = findByDay(db, TEST_DATES.DEFAULT)

      expect(result).toHaveLength(2)
      expect(result.some((entry) => entry.id === 'entry-4')).toBe(false)
    })

    it('orders by order_position then created_at', () => {
      const result = findByDay(db, TEST_DATES.DEFAULT)

      expect(result[0]!.orderPosition).toBeLessThanOrEqual(
        result[1]!.orderPosition
      )
      if (result[0]!.orderPosition === result[1]!.orderPosition) {
        expect(result[0]!.createdAt).toBeLessThanOrEqual(result[1]!.createdAt)
      }
    })

    it('returns empty array for day with no entries', () => {
      const result = findByDay(db, TEST_DATES.THIRD_DAY)

      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('returns entry when exists', () => {
      const result = findById(db, 'entry-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('entry-1')
      expect(result?.content).toBe('First entry')
    })

    it('returns null when entry not found', () => {
      const result = findById(db, 'non-existent')

      expect(result).toBeNull()
    })

    it('excludes soft-deleted entries', () => {
      const result = findById(db, 'entry-4')

      expect(result).toBeNull()
    })
  })
})
