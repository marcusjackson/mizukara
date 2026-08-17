/**
 * Tests for seedEntry test helper
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { createTestDatabaseForEntries, seedEntry } from './seeders'

import type { Database } from 'sql.js'

describe('seedEntry', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForEntries()
  })

  describe('defaults', () => {
    it('creates entry with default content and date', () => {
      const entry = seedEntry(db)
      expect(entry.content).toBe('Test entry content')
      expect(entry.assignedDay).toBe('2022-01-01')
      expect(entry.isDeleted).toBe(false)
    })

    it('generates a UUID for id', () => {
      const entry = seedEntry(db)
      expect(entry.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })
  })

  describe('orderPosition auto-increment', () => {
    it('starts at 0 for first entry on a day', () => {
      const entry = seedEntry(db, { assignedDay: '2022-03-01' })
      expect(entry.orderPosition).toBe(0)
    })

    it('increments orderPosition for subsequent entries on the same day', () => {
      const first = seedEntry(db, { assignedDay: '2022-03-01' })
      const second = seedEntry(db, { assignedDay: '2022-03-01' })
      const third = seedEntry(db, { assignedDay: '2022-03-01' })

      expect(first.orderPosition).toBe(0)
      expect(second.orderPosition).toBe(1)
      expect(third.orderPosition).toBe(2)
    })

    it('resets position counter per day', () => {
      seedEntry(db, { assignedDay: '2022-03-01' })
      seedEntry(db, { assignedDay: '2022-03-01' })
      const differentDay = seedEntry(db, { assignedDay: '2022-03-02' })

      expect(differentDay.orderPosition).toBe(0)
    })

    it('allows explicit orderPosition override', () => {
      const entry = seedEntry(db, { orderPosition: 42 })
      expect(entry.orderPosition).toBe(42)
    })

    it('does not count soft-deleted entries towards auto-increment', () => {
      seedEntry(db, { assignedDay: '2022-03-01', isDeleted: true })
      const active = seedEntry(db, { assignedDay: '2022-03-01' })

      expect(active.orderPosition).toBe(0)
    })
  })

  describe('timestamp control', () => {
    it('uses current time for timestamps by default', () => {
      const before = Date.now()
      const entry = seedEntry(db)
      const after = Date.now()

      expect(entry.createdAt).toBeGreaterThanOrEqual(before)
      expect(entry.createdAt).toBeLessThanOrEqual(after)
      expect(entry.updatedAt).toBeGreaterThanOrEqual(before)
      expect(entry.updatedAt).toBeLessThanOrEqual(after)
    })

    it('allows overriding createdAt', () => {
      const timestamp = 1640000000000
      const entry = seedEntry(db, { createdAt: timestamp })
      expect(entry.createdAt).toBe(timestamp)
    })

    it('allows overriding updatedAt', () => {
      const timestamp = 1640000000000
      const entry = seedEntry(db, { updatedAt: timestamp })
      expect(entry.updatedAt).toBe(timestamp)
    })

    it('allows overriding both timestamps independently', () => {
      const created = 1600000000000
      const updated = 1700000000000
      const entry = seedEntry(db, { createdAt: created, updatedAt: updated })
      expect(entry.createdAt).toBe(created)
      expect(entry.updatedAt).toBe(updated)
    })
  })

  describe('date validation', () => {
    it('accepts valid YYYY-MM-DD dates', () => {
      expect(() => seedEntry(db, { assignedDay: '2022-01-01' })).not.toThrow()
      expect(() => seedEntry(db, { assignedDay: '2022-12-31' })).not.toThrow()
      expect(() => seedEntry(db, { assignedDay: '2026-02-18' })).not.toThrow()
    })

    it('rejects invalid month values', () => {
      expect(() => seedEntry(db, { assignedDay: '2022-00-01' })).toThrow()
      expect(() => seedEntry(db, { assignedDay: '2022-13-01' })).toThrow()
    })

    it('rejects invalid day values', () => {
      expect(() => seedEntry(db, { assignedDay: '2022-01-00' })).toThrow()
      expect(() => seedEntry(db, { assignedDay: '2022-01-32' })).toThrow()
    })

    it('rejects impossible dates like 9999-99-99', () => {
      expect(() => seedEntry(db, { assignedDay: '9999-99-99' })).toThrow()
    })

    it('rejects calendar-impossible dates like 2022-02-30', () => {
      expect(() => seedEntry(db, { assignedDay: '2022-02-30' })).toThrow(
        /valid YYYY-MM-DD date/
      )
    })

    it('rejects non-ISO formats', () => {
      expect(() => seedEntry(db, { assignedDay: '01/01/2022' })).toThrow()
      expect(() => seedEntry(db, { assignedDay: '2022/01/01' })).toThrow()
    })
  })

  describe('content validation', () => {
    it('rejects empty content', () => {
      expect(() => seedEntry(db, { content: '' })).toThrow()
      expect(() => seedEntry(db, { content: '   ' })).toThrow()
    })
  })

  describe('isDeleted', () => {
    it('creates non-deleted entry by default', () => {
      const entry = seedEntry(db)
      expect(entry.isDeleted).toBe(false)
    })

    it('creates soft-deleted entry when isDeleted is true', () => {
      const entry = seedEntry(db, { isDeleted: true })
      expect(entry.isDeleted).toBe(true)
    })
  })
})
