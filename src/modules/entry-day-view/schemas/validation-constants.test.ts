/**
 * Tests for validation-constants
 */

import { describe, expect, it } from 'vitest'

import { CONTENT_VALIDATION, DATE_VALIDATION } from './validation-constants'

describe('CONTENT_VALIDATION', () => {
  it('has a minimum length of 1', () => {
    expect(CONTENT_VALIDATION.MIN_LENGTH).toBe(1)
  })

  it('has a maximum length of 10000', () => {
    expect(CONTENT_VALIDATION.MAX_LENGTH).toBe(10000)
  })

  it('has a required message', () => {
    expect(CONTENT_VALIDATION.messages.required).toBe(
      'Please enter some content for your entry'
    )
  })

  it('has a maxLength message', () => {
    expect(CONTENT_VALIDATION.messages.maxLength).toBe(
      'Must be no more than 10000 characters'
    )
  })
})

describe('DATE_VALIDATION', () => {
  it('has an invalid message', () => {
    expect(DATE_VALIDATION.messages.invalid).toBe(
      'Must be a valid date (YYYY-MM-DD)'
    )
  })
})
