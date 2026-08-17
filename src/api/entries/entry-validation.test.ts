/**
 * Tests for entry-validation
 *
 * Validates input validation logic for entry mutations.
 */

import { describe, expect, it } from 'vitest'

import { RepositoryError } from '@/api/types'

import { EntryValidationError, validateEntryInput } from './entry-validation'

describe('EntryValidationError', () => {
  it('has correct name', () => {
    const error = new EntryValidationError('content', 'Some message')

    expect(error.name).toBe('EntryValidationError')
  })

  it('stores field name', () => {
    const error = new EntryValidationError('assignedDay', 'Some message')

    expect(error.field).toBe('assignedDay')
  })

  it('formats message with field name', () => {
    const error = new EntryValidationError('content', 'Some message')

    expect(error.message).toBe('content: Some message')
  })

  it('is an instance of Error', () => {
    const error = new EntryValidationError('content', 'Some message')

    expect(error).toBeInstanceOf(Error)
  })

  it('is an instance of RepositoryError', () => {
    const error = new EntryValidationError('content', 'Some message')

    expect(error).toBeInstanceOf(RepositoryError)
  })

  it('has correct operation and entity from RepositoryError', () => {
    const error = new EntryValidationError('assignedDay', 'Invalid format')

    expect(error.operation).toBe('validate')
    expect(error.entity).toBe('Entry')
  })
})

describe('validateEntryInput', () => {
  describe('content validation', () => {
    it('accepts non-empty string content', () => {
      expect(() => {
        validateEntryInput({ content: 'Valid content' })
      }).not.toThrow()
    })

    it('throws EntryValidationError for empty content', () => {
      expect(() => {
        validateEntryInput({ content: '' })
      }).toThrow(EntryValidationError)
    })

    it('throws EntryValidationError for whitespace-only content', () => {
      expect(() => {
        validateEntryInput({ content: '   ' })
      }).toThrow(EntryValidationError)
    })

    it('throws TypeError for non-string content', () => {
      expect(() => {
        validateEntryInput({ content: 123 as unknown as string })
      }).toThrow(TypeError)
    })

    it('skips content validation when content is undefined', () => {
      expect(() => {
        validateEntryInput({})
      }).not.toThrow()
      expect(() => {
        validateEntryInput({ assignedDay: '2026-02-18' })
      }).not.toThrow()
    })
  })

  describe('assignedDay validation', () => {
    it('accepts valid ISO date format', () => {
      expect(() => {
        validateEntryInput({ assignedDay: '2026-02-18' })
      }).not.toThrow()
    })

    it('throws EntryValidationError for invalid date format', () => {
      expect(() => {
        validateEntryInput({ assignedDay: 'not-a-date' })
      }).toThrow(EntryValidationError)
    })

    it('throws EntryValidationError for partial date', () => {
      expect(() => {
        validateEntryInput({ assignedDay: '2026-02' })
      }).toThrow(EntryValidationError)
    })

    it('skips date validation when assignedDay is undefined', () => {
      expect(() => {
        validateEntryInput({ content: 'Valid content' })
      }).not.toThrow()
    })
  })

  describe('combined validation', () => {
    it('accepts valid content and date together', () => {
      expect(() => {
        validateEntryInput({
          content: 'Valid content',
          assignedDay: '2026-02-18'
        })
      }).not.toThrow()
    })

    it('accepts empty object without throwing', () => {
      expect(() => {
        validateEntryInput({})
      }).not.toThrow()
    })
  })
})
