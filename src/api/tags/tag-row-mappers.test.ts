/**
 * Tests for tag row mapper functions
 */

import { describe, expect, it } from 'vitest'

import { rowToTag } from './tag-row-mappers'

describe('rowToTag', () => {
  it('maps column values to Tag properties in correct order', () => {
    const row = ['tag-id', 'work', 1700000000, 1700000001, 0]

    const result = rowToTag(row)

    expect(result).toEqual({
      id: 'tag-id',
      name: 'work',
      createdAt: 1700000000,
      updatedAt: 1700000001,
      isDeleted: false
    })
  })

  it('converts is_deleted 0 to false', () => {
    const row = ['id', 'name', 0, 0, 0]

    const result = rowToTag(row)

    expect(result.isDeleted).toBe(false)
  })

  it('converts is_deleted 1 to true', () => {
    const row = ['id', 'name', 0, 0, 1]

    const result = rowToTag(row)

    expect(result.isDeleted).toBe(true)
  })

  it('preserves id and name as strings', () => {
    const row = ['abc-123', 'My Tag', 0, 0, 0]

    const result = rowToTag(row)

    expect(result.id).toBe('abc-123')
    expect(result.name).toBe('My Tag')
  })
})
