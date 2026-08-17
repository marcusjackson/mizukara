/**
 * Tests for validation-errors constants
 */

import { describe, expect, it } from 'vitest'

import {
  DATE_VALIDATION_CONSTRAINTS,
  ENTRY_VALIDATION_ERRORS
} from './validation-errors'

describe('ENTRY_VALIDATION_ERRORS', () => {
  it('has a content empty error message', () => {
    expect(ENTRY_VALIDATION_ERRORS.CONTENT_EMPTY).toBe(
      'Please enter some content for your entry'
    )
  })

  it('has a content type error message', () => {
    expect(ENTRY_VALIDATION_ERRORS.CONTENT_TYPE).toBe(
      'Content must be a string'
    )
  })

  it('has a date format error message', () => {
    expect(ENTRY_VALIDATION_ERRORS.DATE_FORMAT).toBe(
      'Please enter a valid date in YYYY-MM-DD format'
    )
  })
})

describe('DATE_VALIDATION_CONSTRAINTS', () => {
  it('has valid year range', () => {
    expect(DATE_VALIDATION_CONSTRAINTS.MIN_YEAR).toBe(1900)
    expect(DATE_VALIDATION_CONSTRAINTS.MAX_YEAR).toBe(2100)
    expect(DATE_VALIDATION_CONSTRAINTS.MIN_YEAR).toBeLessThan(
      DATE_VALIDATION_CONSTRAINTS.MAX_YEAR
    )
  })

  it('has valid month range', () => {
    expect(DATE_VALIDATION_CONSTRAINTS.MIN_MONTH).toBe(1)
    expect(DATE_VALIDATION_CONSTRAINTS.MAX_MONTH).toBe(12)
  })

  it('has valid day range', () => {
    expect(DATE_VALIDATION_CONSTRAINTS.MIN_DAY).toBe(1)
    expect(DATE_VALIDATION_CONSTRAINTS.MAX_DAY).toBe(31)
  })
})
