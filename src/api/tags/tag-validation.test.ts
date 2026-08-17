import { describe, expect, it } from 'vitest'

import { TagNotFoundError, TagValidationError } from './tag-validation'

describe('TagValidationError', () => {
  it('should be an instance of Error', () => {
    const error = new TagValidationError('Tag name is empty')

    expect(error).toBeInstanceOf(Error)
  })

  it('should be an instance of TagValidationError', () => {
    const error = new TagValidationError('Tag name is empty')

    expect(error).toBeInstanceOf(TagValidationError)
  })

  it('should carry the provided message', () => {
    const message = 'A tag with this name already exists'
    const error = new TagValidationError(message)

    expect(error.message).toBe(message)
  })

  it('should have name set to "TagValidationError" for instanceof-style checks', () => {
    const error = new TagValidationError('duplicate tag name')

    expect(error.name).toBe('TagValidationError')
  })

  it('should be catchable as a TagValidationError via instanceof', () => {
    let caught: unknown

    try {
      throw new TagValidationError('invalid input')
    } catch (e) {
      caught = e
    }

    expect(caught instanceof TagValidationError).toBe(true)
    expect(caught instanceof Error).toBe(true)
  })
})

describe('TagNotFoundError', () => {
  it('should be an instance of Error', () => {
    const error = new TagNotFoundError('abc-123')

    expect(error).toBeInstanceOf(Error)
  })

  it('should be an instance of TagNotFoundError', () => {
    const error = new TagNotFoundError('abc-123')

    expect(error).toBeInstanceOf(TagNotFoundError)
  })

  it('should carry the offending tag id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440001'
    const error = new TagNotFoundError(id)

    expect(error.tagId).toBe(id)
  })

  it('should have name set to "TagNotFoundError" for instanceof-style checks', () => {
    const error = new TagNotFoundError('abc-123')

    expect(error.name).toBe('TagNotFoundError')
  })

  it('should include the tag id in the error message', () => {
    const id = '550e8400-e29b-41d4-a716-446655440001'
    const error = new TagNotFoundError(id)

    expect(error.message).toContain(id)
  })

  it('should be catchable as a TagNotFoundError via instanceof', () => {
    const id = '550e8400-e29b-41d4-a716-446655440001'
    let caught: unknown

    try {
      throw new TagNotFoundError(id)
    } catch (e) {
      caught = e
    }

    expect(caught instanceof TagNotFoundError).toBe(true)
    expect(caught instanceof Error).toBe(true)
  })
})
