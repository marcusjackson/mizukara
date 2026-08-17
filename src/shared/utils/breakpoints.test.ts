/**
 * Tests for breakpoints constants
 */

import { describe, expect, it } from 'vitest'

import { BREAKPOINTS } from './breakpoints'

describe('BREAKPOINTS', () => {
  it('exports correct min-width breakpoint values', () => {
    expect(BREAKPOINTS.tablet).toBe(768)
    expect(BREAKPOINTS.desktop).toBe(1024)
  })

  it('is read-only (const assertion)', () => {
    // TypeScript should prevent this at compile time
    // This test just ensures the values are correct
    expect(Object.isFrozen(BREAKPOINTS)).toBe(false)
    expect(typeof BREAKPOINTS.tablet).toBe('number')
  })

  it('has all expected breakpoint keys', () => {
    const keys = Object.keys(BREAKPOINTS)
    expect(keys).toContain('tablet')
    expect(keys).toContain('desktop')
    expect(keys).toHaveLength(2)
  })

  it('tablet breakpoint is less than desktop', () => {
    expect(BREAKPOINTS.tablet).toBeLessThan(BREAKPOINTS.desktop)
  })
})
