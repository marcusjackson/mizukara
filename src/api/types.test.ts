/**
 * Tests for API layer types and error classes
 */

import { describe, expect, it } from 'vitest'

import {
  CreateError,
  DeleteError,
  EntityNotFoundError,
  RepositoryError,
  UpdateError
} from './types'

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

describe('CreateError', () => {
  it('creates error for entity creation failure', () => {
    const error = new CreateError('Entry')

    expect(error.message).toBe('Failed to create Entry')
    expect(error.operation).toBe('create')
    expect(error.entity).toBe('Entry')
    expect(error.name).toBe('CreateError')
    expect(error).toBeInstanceOf(RepositoryError)
  })

  it('stores cause when provided', () => {
    const cause = new Error('DB constraint violation')
    const error = new CreateError('Entry', cause)

    expect(error.cause).toBe(cause)
  })
})

describe('UpdateError', () => {
  it('creates error with string UUID id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    const error = new UpdateError('Entry', id)

    expect(error.message).toBe(`Failed to update Entry with id ${id}`)
    expect(error.operation).toBe('update')
    expect(error.entity).toBe('Entry')
    expect(error.name).toBe('UpdateError')
    expect(error).toBeInstanceOf(RepositoryError)
  })

  it('stores cause when provided', () => {
    const cause = new TypeError('Invalid field')
    const id = 'entry-uuid-123'
    const error = new UpdateError('Entry', id, cause)

    expect(error.cause).toBe(cause)
  })
})

describe('DeleteError', () => {
  it('creates error with string UUID id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    const error = new DeleteError('Entry', id)

    expect(error.message).toBe(`Failed to delete Entry with id ${id}`)
    expect(error.operation).toBe('delete')
    expect(error.entity).toBe('Entry')
    expect(error.name).toBe('DeleteError')
    expect(error).toBeInstanceOf(RepositoryError)
  })

  it('stores cause when provided', () => {
    const cause = new Error('FK constraint')
    const id = 'entry-uuid-456'
    const error = new DeleteError('Entry', id, cause)

    expect(error.cause).toBe(cause)
  })
})
