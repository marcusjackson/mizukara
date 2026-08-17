/**
 * Tests for entry-create-form-schema
 */

import { describe, expect, it } from 'vitest'

import {
  type EntryCreateFormData,
  entryCreateFormSchema
} from './entry-create-form-schema'

describe('entryCreateFormSchema', () => {
  it('accepts valid data', () => {
    const result = entryCreateFormSchema.safeParse({
      content: 'Had a great day'
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('Had a great day')
    }
  })

  it('rejects empty content', () => {
    const result = entryCreateFormSchema.safeParse({
      content: ''
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toBeDefined()
      expect(result.error.issues.length).toBeGreaterThan(0)
      expect(result.error.issues[0]!.message).toBe(
        'Please enter some content for your entry'
      )
    }
  })

  it('rejects content too long', () => {
    const longContent = 'a'.repeat(10001)
    const result = entryCreateFormSchema.safeParse({
      content: longContent
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toBeDefined()
      expect(result.error.issues.length).toBeGreaterThan(0)
      expect(result.error.issues[0]!.message).toBe(
        'Must be no more than 10000 characters'
      )
    }
  })

  it('accepts minimum valid content', () => {
    const result = entryCreateFormSchema.safeParse({
      content: 'a'
    })
    expect(result.success).toBe(true)
  })

  it('accepts maximum valid content', () => {
    const maxContent = 'a'.repeat(10000)
    const result = entryCreateFormSchema.safeParse({
      content: maxContent
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-string content', () => {
    const result = entryCreateFormSchema.safeParse({
      content: 123
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing content field', () => {
    const result = entryCreateFormSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('EntryCreateFormData type', () => {
  it('infers correct type', () => {
    const data: EntryCreateFormData = {
      content: 'Test content'
    }
    expect(data.content).toBe('Test content')
  })
})
