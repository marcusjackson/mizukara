import { describe, expect, it } from 'vitest'

import { rowToEntryTag } from './entry-tag-row-mappers'

describe('rowToEntryTag', () => {
  it('maps a row in column order', () => {
    expect(rowToEntryTag(['et', 'e', 't', 10, 20, 1])).toEqual({
      id: 'et',
      entryId: 'e',
      tagId: 't',
      createdAt: 10,
      updatedAt: 20,
      isDeleted: true
    })
  })

  it('fails at the cell when a column holds the wrong type', () => {
    expect(() => rowToEntryTag(['et', 'e', 7, 10, 20, 0])).toThrow(
      'rowToEntryTag: column "tag_id" expected string, got number'
    )
  })
})
