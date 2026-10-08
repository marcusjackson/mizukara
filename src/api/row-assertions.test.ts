import { describe, expect, it } from 'vitest'

import { assertNumber, assertString } from './row-assertions'

describe('assertString', () => {
  it('returns a string unchanged', () => {
    expect(assertString('work', 'name', 'rowToTag')).toBe('work')
  })

  it('names the mapper, the column and the actual type when it is not a string', () => {
    expect(() => assertString(5, 'name', 'rowToTag')).toThrow(
      'rowToTag: column "name" expected string, got number'
    )
  })
})

describe('assertNumber', () => {
  it('returns a number unchanged', () => {
    expect(assertNumber(0, 'created_at', 'rowToTag')).toBe(0)
  })

  it('names the mapper, the column and the actual type when it is not a number', () => {
    expect(() => assertNumber(null, 'created_at', 'rowToTag')).toThrow(
      'rowToTag: column "created_at" expected number, got object'
    )
  })
})
