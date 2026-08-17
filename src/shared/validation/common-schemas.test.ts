/**
 * Tests for Common Validation Schemas
 */

import { describe, expect, it } from 'vitest'

import { optionalString } from './common-schemas'

describe('optionalString', () => {
  it('accepts string within max length', () => {
    const schema = optionalString(10)
    const result = schema.safeParse('hello')
    expect(result.success).toBe(true)
  })

  it('accepts empty string', () => {
    const schema = optionalString(10)
    const result = schema.safeParse('')
    expect(result.success).toBe(true)
  })

  it('rejects string exceeding max length', () => {
    const schema = optionalString(5)
    const result = schema.safeParse('hello world')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Max 5 characters')
    }
  })
})
