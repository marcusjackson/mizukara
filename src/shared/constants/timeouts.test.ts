/**
 * Tests for timeouts constants
 */

import { describe, expect, it } from 'vitest'

import { TIMEOUTS } from './timeouts'

describe('TIMEOUTS', () => {
  it('defines a toast duration', () => {
    expect(typeof TIMEOUTS.TOAST_DURATION).toBe('number')
    expect(TIMEOUTS.TOAST_DURATION).toBeGreaterThan(0)
  })

  it('defines a default debounce delay', () => {
    expect(typeof TIMEOUTS.DEBOUNCE_DEFAULT).toBe('number')
    expect(TIMEOUTS.DEBOUNCE_DEFAULT).toBeGreaterThan(0)
  })

  it('defines a navigation debounce delay', () => {
    expect(typeof TIMEOUTS.NAVIGATION_DEBOUNCE).toBe('number')
    expect(TIMEOUTS.NAVIGATION_DEBOUNCE).toBeGreaterThan(0)
  })

  it('defines a form submit debounce delay', () => {
    expect(typeof TIMEOUTS.FORM_SUBMIT_DEBOUNCE).toBe('number')
    expect(TIMEOUTS.FORM_SUBMIT_DEBOUNCE).toBeGreaterThan(0)
  })

  it('toast duration is 2000ms', () => {
    expect(TIMEOUTS.TOAST_DURATION).toBe(2000)
  })
})
