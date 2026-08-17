/**
 * Tests for entry-editor-schema.ts
 */

import { describe, expect, it } from 'vitest'

import {
  type EntryEditorFormData,
  entryEditorSchema
} from './entry-editor-schema'

describe('entryEditorSchema', () => {
  it('should validate valid form data', () => {
    const validData: EntryEditorFormData = {
      content: 'This is a valid entry content',
      assignedDay: '2026-02-11'
    }

    const result = entryEditorSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validData)
    }
  })

  it('should reject empty content', () => {
    const invalidData = {
      content: '',
      assignedDay: '2026-02-11'
    }

    const result = entryEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0]!.message).toBe(
        'Please enter some content for your entry'
      )
    }
  })

  it('should reject content over max length', () => {
    const longContent = 'a'.repeat(10001)
    const invalidData = {
      content: longContent,
      assignedDay: '2026-02-11'
    }

    const result = entryEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0]!.message).toBe(
        'Must be no more than 10000 characters'
      )
    }
  })

  it('should reject invalid date format', () => {
    const invalidData = {
      content: 'Valid content',
      assignedDay: 'invalid-date'
    }

    const result = entryEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0]!.message).toBe(
        'Must be a valid date (YYYY-MM-DD)'
      )
    }
  })

  it('should reject invalid date values', () => {
    const invalidData = {
      content: 'Valid content',
      assignedDay: '2024-02-30' // Invalid date (February 30th doesn't exist)
    }

    const result = entryEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0]!.message).toBe(
        'Must be a valid date (YYYY-MM-DD)'
      )
    }
  })

  it('should accept minimum valid content', () => {
    const validData: EntryEditorFormData = {
      content: 'a',
      assignedDay: '2026-02-11'
    }

    const result = entryEditorSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should accept maximum valid content', () => {
    const maxContent = 'a'.repeat(10000)
    const validData: EntryEditorFormData = {
      content: maxContent,
      assignedDay: '2026-02-11'
    }

    const result = entryEditorSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
