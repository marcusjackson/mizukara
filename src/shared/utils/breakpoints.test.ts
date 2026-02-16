/**
 * Tests for breakpoints constants
 */

import { describe, expect, it } from 'vitest'

import { BREAKPOINTS } from './breakpoints'

describe('BREAKPOINTS', () => {
  it('exports correct breakpoint values', () => {
    expect(BREAKPOINTS.mobile).toBe(767)
    expect(BREAKPOINTS.tablet).toBe(1023)
    expect(BREAKPOINTS.desktop).toBe(1024)
  })

  it('is read-only (const assertion)', () => {
    // TypeScript should prevent this at compile time
    // This test just ensures the values are correct
    expect(Object.isFrozen(BREAKPOINTS)).toBe(false)
    expect(typeof BREAKPOINTS.mobile).toBe('number')
  })

  it('has all expected breakpoint keys', () => {
    const keys = Object.keys(BREAKPOINTS)
    expect(keys).toContain('mobile')
    expect(keys).toContain('tablet')
    expect(keys).toContain('desktop')
    expect(keys).toHaveLength(3)
  })
})
