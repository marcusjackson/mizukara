/**
 * Tests for entry mutation functions
 */

import { TEST_DATES } from '@test/constants/dates'
import { createTestDatabaseForEntries, seedEntry } from '@test/helpers/database'
import { describe, expect, it } from 'vitest'

import {
  createEntry,
  softDeleteEntry,
  updateEntry,
  updateOrderPosition
} from './entry-mutations'
import { EntryValidationError } from './entry-validation'

import type { Entry } from '@/shared/types/entry-types'
import type { Database } from 'sql.js'

describe('entry-mutations', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForEntries()
  })

  describe('createEntry', () => {
    it('generates valid UUID', () => {
      const entry = createEntry(db, {
        content: 'Test content',
        assignedDay: TEST_DATES.DEFAULT
      })

      expect(entry.id).toHaveLength(36)
      expect(entry.id).toMatch(/^[0-9a-f-]+$/i)
    })

    it('sets timestamps correctly', () => {
      const before = Date.now()
      const entry = createEntry(db, {
        content: 'Test content',
        assignedDay: TEST_DATES.DEFAULT
      })
      const after = Date.now()

      expect(entry.createdAt).toBeGreaterThanOrEqual(before)
      expect(entry.createdAt).toBeLessThanOrEqual(after)
      expect(entry.updatedAt).toBe(entry.createdAt)
    })

    it('calculates order_position as 0 for first entry in day', () => {
      const entry = createEntry(db, {
        content: 'First entry',
        assignedDay: TEST_DATES.DEFAULT
      })

      expect(entry.orderPosition).toBe(0)
    })

    it('calculates order_position as max+1 for subsequent entries', () => {
      // First entry
      createEntry(db, {
        content: 'First entry',
        assignedDay: TEST_DATES.DEFAULT
      })

      // Second entry
      const secondEntry = createEntry(db, {
        content: 'Second entry',
        assignedDay: TEST_DATES.DEFAULT
      })

      expect(secondEntry.orderPosition).toBe(1)
    })

    it('calculates order_position independently per day', () => {
      // Entry in day 1
      createEntry(db, {
        content: 'Day 1 entry',
        assignedDay: TEST_DATES.DEFAULT
      })

      // Entry in day 2
      const day2Entry = createEntry(db, {
        content: 'Day 2 entry',
        assignedDay: TEST_DATES.NEXT_DAY
      })

      expect(day2Entry.orderPosition).toBe(0)
    })
  })

  describe('updateEntry', () => {
    let existingEntry: Entry

    beforeEach(() => {
      existingEntry = seedEntry(db, {
        content: 'Original content',
        assignedDay: TEST_DATES.DEFAULT
      })
    })

    it('preserves created_at, updates updated_at', () => {
      const originalCreatedAt = existingEntry.createdAt
      const beforeUpdate = Date.now()

      const updated = updateEntry(db, existingEntry.id, {
        content: 'Updated content'
      })

      const afterUpdate = Date.now()

      expect(updated.createdAt).toBe(originalCreatedAt)
      expect(updated.updatedAt).toBeGreaterThanOrEqual(beforeUpdate)
      expect(updated.updatedAt).toBeLessThanOrEqual(afterUpdate)
      expect(updated.updatedAt).not.toBe(originalCreatedAt)
    })

    it('accepts partial input', () => {
      const updated = updateEntry(db, existingEntry.id, {
        content: 'Updated content'
      })

      expect(updated.content).toBe('Updated content')
      expect(updated.assignedDay).toBe(TEST_DATES.DEFAULT) // unchanged
    })

    it('updates content when provided', () => {
      const updated = updateEntry(db, existingEntry.id, {
        content: 'New content'
      })

      expect(updated.content).toBe('New content')
    })

    it('updates assigned_day when provided', () => {
      const updated = updateEntry(db, existingEntry.id, {
        assignedDay: TEST_DATES.NEXT_DAY
      })

      expect(updated.assignedDay).toBe(TEST_DATES.NEXT_DAY)
    })

    it('updates order_position when provided', () => {
      const updated = updateEntry(db, existingEntry.id, {
        orderPosition: 5
      })

      expect(updated.orderPosition).toBe(5)
    })
  })

  describe('updateOrderPosition', () => {
    let existingEntry: Entry

    beforeEach(() => {
      existingEntry = seedEntry(db, {
        content: 'Test entry',
        assignedDay: TEST_DATES.DEFAULT
      })
    })

    it('updates only order_position field', () => {
      const original = existingEntry
      const beforeUpdate = Date.now()

      const updated = updateOrderPosition(db, existingEntry.id, 10)

      expect(updated.id).toBe(original.id)
      expect(updated.content).toBe(original.content)
      expect(updated.assignedDay).toBe(original.assignedDay)
      expect(updated.createdAt).toBe(original.createdAt)
      expect(updated.orderPosition).toBe(10)
      expect(updated.updatedAt).toBeGreaterThanOrEqual(beforeUpdate)
    })
  })

  describe('softDeleteEntry', () => {
    let existingEntry: Entry

    beforeEach(() => {
      existingEntry = seedEntry(db, {
        content: 'Test entry',
        assignedDay: TEST_DATES.DEFAULT
      })
    })

    it('sets is_deleted flag and updated_at', () => {
      const beforeDelete = Date.now()

      const deleted = softDeleteEntry(db, existingEntry.id)

      expect(deleted.isDeleted).toBe(true)
      expect(deleted.updatedAt).toBeGreaterThanOrEqual(beforeDelete)
    })

    it('preserves other fields', () => {
      const deleted = softDeleteEntry(db, existingEntry.id)

      expect(deleted.id).toBe(existingEntry.id)
      expect(deleted.content).toBe(existingEntry.content)
      expect(deleted.assignedDay).toBe(existingEntry.assignedDay)
      expect(deleted.createdAt).toBe(existingEntry.createdAt)
      expect(deleted.orderPosition).toBe(existingEntry.orderPosition)
    })
  })

  describe('input validation', () => {
    describe('createEntry', () => {
      it('throws error for empty content', () => {
        expect(() => {
          createEntry(db, {
            content: '',
            assignedDay: TEST_DATES.DEFAULT
          })
        }).toThrow(EntryValidationError)
        expect(() => {
          createEntry(db, {
            content: '',
            assignedDay: TEST_DATES.DEFAULT
          })
        }).toThrow('content:')
      })

      it('throws error for whitespace-only content', () => {
        expect(() => {
          createEntry(db, {
            content: '   ',
            assignedDay: TEST_DATES.DEFAULT
          })
        }).toThrow(EntryValidationError)
      })

      it('throws error for invalid date format', () => {
        expect(() => {
          createEntry(db, {
            content: 'Valid content',
            assignedDay: '2022-1-1'
          })
        }).toThrow(EntryValidationError)
      })

      it('throws error for invalid date (month)', () => {
        expect(() => {
          createEntry(db, {
            content: 'Valid content',
            assignedDay: '2022-13-01'
          })
        }).toThrow(EntryValidationError)
      })

      it('throws error for invalid date (day)', () => {
        expect(() => {
          createEntry(db, {
            content: 'Valid content',
            assignedDay: '2022-01-32'
          })
        }).toThrow(EntryValidationError)
      })
    })

    describe('updateEntry', () => {
      let existingEntry: Entry

      beforeEach(() => {
        existingEntry = seedEntry(db, {
          content: 'Original content',
          assignedDay: '2022-01-01'
        })
      })

      it('throws error for empty content update', () => {
        expect(() => {
          updateEntry(db, existingEntry.id, {
            content: ''
          })
        }).toThrow(EntryValidationError)
      })

      it('throws error for invalid date format update', () => {
        expect(() => {
          updateEntry(db, existingEntry.id, {
            assignedDay: '2022/01/01'
          })
        }).toThrow(EntryValidationError)
      })

      it('accepts valid partial updates', () => {
        const updated = updateEntry(db, existingEntry.id, {
          content: 'New content'
        })

        expect(updated.content).toBe('New content')
      })
    })
  })
})
