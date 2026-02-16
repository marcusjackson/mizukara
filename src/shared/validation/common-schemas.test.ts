/**
 * Tests for Common Validation Schemas
 */

import { describe, expect, it } from 'vitest'

import { optionalString, singleCharacterSchema } from './common-schemas'

describe('singleCharacterSchema', () => {
  it('accepts a single kanji character', () => {
    const result = singleCharacterSchema.safeParse('水')
    expect(result.success).toBe(true)
  })

  it('accepts a single hiragana character', () => {
    const result = singleCharacterSchema.safeParse('あ')
    expect(result.success).toBe(true)
  })

  it('accepts a single katakana character', () => {
    const result = singleCharacterSchema.safeParse('ア')
    expect(result.success).toBe(true)
  })

  it('accepts a complex kanji with surrogate pairs', () => {
    const result = singleCharacterSchema.safeParse('𠀋')
    expect(result.success).toBe(true)
  })

  it('rejects empty string', () => {
    const result = singleCharacterSchema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Please enter a character')
    }
  })

  it('rejects multiple characters', () => {
    const result = singleCharacterSchema.safeParse('水火')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Please enter only one character'
      )
    }
  })

  it('trims whitespace before validation', () => {
    const result = singleCharacterSchema.safeParse(' 水 ')
    expect(result.success).toBe(true)
  })

  it('rejects whitespace-only input', () => {
    const result = singleCharacterSchema.safeParse('   ')
    expect(result.success).toBe(false)
  })
})

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
