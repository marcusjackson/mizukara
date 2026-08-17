/**
 * Tests for entry helper functions
 */

import { describe, expect, it } from 'vitest'

import {
  buildColumnMap,
  queryResultToEntries,
  rowToEntry
} from './entry-helpers'

describe('buildColumnMap', () => {
  it('maps column names to indices', () => {
    const cols = buildColumnMap(['id', 'content', 'created_at'])
    expect(cols.get('id')).toBe(0)
    expect(cols.get('content')).toBe(1)
    expect(cols.get('created_at')).toBe(2)
  })

  it('returns an empty map for empty input', () => {
    const cols = buildColumnMap([])
    expect(cols.size).toBe(0)
  })
})

describe('rowToEntry', () => {
  const baseColumns = [
    'id',
    'content',
    'created_at',
    'updated_at',
    'assigned_day',
    'order_position',
    'is_deleted'
  ]

  it('maps row values to Entry using column names', () => {
    const cols = buildColumnMap(baseColumns)
    const row = ['uuid-1', 'Hello World', 1000, 2000, '2022-01-01', 0, 0]
    const entry = rowToEntry(row, cols)

    expect(entry.id).toBe('uuid-1')
    expect(entry.content).toBe('Hello World')
    expect(entry.createdAt).toBe(1000)
    expect(entry.updatedAt).toBe(2000)
    expect(entry.assignedDay).toBe('2022-01-01')
    expect(entry.orderPosition).toBe(0)
    expect(entry.isDeleted).toBe(false)
  })

  it('converts is_deleted 1 to boolean true', () => {
    const cols = buildColumnMap(baseColumns)
    const row = ['uuid-2', 'content', 1000, 2000, '2022-01-01', 0, 1]
    const entry = rowToEntry(row, cols)
    expect(entry.isDeleted).toBe(true)
  })

  it('converts is_deleted 0 to boolean false', () => {
    const cols = buildColumnMap(baseColumns)
    const row = ['uuid-3', 'content', 1000, 2000, '2022-01-01', 0, 0]
    const entry = rowToEntry(row, cols)
    expect(entry.isDeleted).toBe(false)
  })

  it('correctly maps even if column order is unusual', () => {
    // Simulates a query returning columns in a different order
    const unusualColumns = [
      'is_deleted',
      'order_position',
      'assigned_day',
      'updated_at',
      'created_at',
      'content',
      'id'
    ]
    const cols = buildColumnMap(unusualColumns)
    const row = [0, 3, '2022-06-15', 9000, 8000, 'Test', 'uuid-99']
    const entry = rowToEntry(row, cols)

    expect(entry.id).toBe('uuid-99')
    expect(entry.content).toBe('Test')
    expect(entry.createdAt).toBe(8000)
    expect(entry.updatedAt).toBe(9000)
    expect(entry.assignedDay).toBe('2022-06-15')
    expect(entry.orderPosition).toBe(3)
    expect(entry.isDeleted).toBe(false)
  })

  it('throws if a required column is missing from the map', () => {
    const incompleteColumns = ['id', 'content'] // missing required columns
    const cols = buildColumnMap(incompleteColumns)
    const row = ['uuid-4', 'content', 1000, 2000, '2022-01-01', 0, 0]
    expect(() => rowToEntry(row, cols)).toThrow('missing column')
  })

  it('throws TypeError when a string column contains a non-string value', () => {
    const cols = buildColumnMap(baseColumns)
    // Replace 'id' (index 0) with a number to trigger assertString
    const row = [42, 'content', 1000, 2000, '2022-01-01', 0, 0]
    expect(() => rowToEntry(row, cols)).toThrow(TypeError)
    expect(() => rowToEntry(row, cols)).toThrow('expected string')
  })

  it('throws TypeError when a number column contains a string value', () => {
    const cols = buildColumnMap(baseColumns)
    // Replace 'created_at' (index 2) with a string to trigger assertNumber
    const row = ['uuid-5', 'content', 'not-a-number', 2000, '2022-01-01', 0, 0]
    expect(() => rowToEntry(row, cols)).toThrow(TypeError)
    expect(() => rowToEntry(row, cols)).toThrow('expected number')
  })
})

describe('queryResultToEntries', () => {
  it('converts a full QueryExecResult to an array of entries', () => {
    const result = {
      columns: [
        'id',
        'content',
        'created_at',
        'updated_at',
        'assigned_day',
        'order_position',
        'is_deleted'
      ],
      values: [
        ['a', 'First', 100, 200, '2022-01-01', 0, 0],
        ['b', 'Second', 300, 400, '2022-01-01', 1, 0]
      ]
    }

    const entries = queryResultToEntries(result)
    expect(entries).toHaveLength(2)
    expect(entries[0]?.id).toBe('a')
    expect(entries[0]?.content).toBe('First')
    expect(entries[1]?.id).toBe('b')
    expect(entries[1]?.orderPosition).toBe(1)
  })

  it('returns empty array for empty values', () => {
    const result = {
      columns: [
        'id',
        'content',
        'created_at',
        'updated_at',
        'assigned_day',
        'order_position',
        'is_deleted'
      ],
      values: []
    }
    const entries = queryResultToEntries(result)
    expect(entries).toHaveLength(0)
  })
})
