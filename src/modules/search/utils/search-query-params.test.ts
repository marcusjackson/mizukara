import { describe, expect, it } from 'vitest'

import { toArrayParam, toStringParam } from './search-query-params'

describe('toStringParam', () => {
  it('returns the value, the first of several, or an empty string', () => {
    expect(toStringParam('tea')).toBe('tea')
    expect(toStringParam(['a', 'b'])).toBe('a')
    expect(toStringParam(undefined)).toBe('')
    expect(toStringParam(null)).toBe('')
  })
})

describe('toArrayParam', () => {
  it('wraps a single value and keeps repeated ones', () => {
    expect(toArrayParam('a')).toEqual(['a'])
    expect(toArrayParam(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('drops empty and null entries and handles absence', () => {
    expect(toArrayParam(['a', '', null])).toEqual(['a'])
    expect(toArrayParam(undefined)).toEqual([])
    expect(toArrayParam('')).toEqual([])
  })
})
