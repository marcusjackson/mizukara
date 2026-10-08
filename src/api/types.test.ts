/**
 * Tests for API layer types and error classes
 */

import { describe, expect, it } from 'vitest'

import { EntityNotFoundError, RepositoryError } from './types'

describe('RepositoryError', () => {
  it('creates error with correct properties', () => {
    const error = new RepositoryError('Something failed', 'get', 'Entry')

    expect(error.message).toBe('Something failed')
    expect(error.operation).toBe('get')
    expect(error.entity).toBe('Entry')
    expect(error.name).toBe('RepositoryError')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RepositoryError)
  })

  it('stores cause when provided', () => {
    const cause = new Error('Underlying DB error')
    const error = new RepositoryError('Wrapped error', 'create', 'Entry', cause)

    expect(error.cause).toBe(cause)
  })
})

describe('EntityNotFoundError', () => {
  it('creates error with string UUID id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    const error = new EntityNotFoundError('Entry', id)

    expect(error.message).toBe(`Entry with id ${id} not found`)
    expect(error.operation).toBe('get')
    expect(error.entity).toBe('Entry')
    expect(error.name).toBe('EntityNotFoundError')
    expect(error).toBeInstanceOf(RepositoryError)
    expect(error).toBeInstanceOf(EntityNotFoundError)
  })

  it('accepts short string ids', () => {
    const error = new EntityNotFoundError('Tag', 'tag-abc-123')

    expect(error.message).toBe('Tag with id tag-abc-123 not found')
  })
})
