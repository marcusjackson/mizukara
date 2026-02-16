import { describe, expect, it } from 'vitest'

import type { CreateEntryInput, Entry, UpdateEntryInput } from './entry-types'

describe('Entry Types', () => {
  it('should define Entry interface', () => {
    // Type test: ensure Entry interface is defined and has required properties
    const entry: Entry = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Test content',
      createdAt: 1640995200000, // 2022-01-01 00:00:00 UTC
      updatedAt: 1640995200000,
      assignedDay: '2022-01-01',
      orderPosition: 0,
      isDeleted: false
    }

    expect(entry.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(entry.content).toBe('Test content')
    expect(entry.createdAt).toBe(1640995200000)
    expect(entry.updatedAt).toBe(1640995200000)
    expect(entry.assignedDay).toBe('2022-01-01')
    expect(entry.orderPosition).toBe(0)
    expect(entry.isDeleted).toBe(false)
  })

  it('should define CreateEntryInput interface', () => {
    const input: CreateEntryInput = {
      content: 'New entry content',
      assignedDay: '2022-01-01'
    }

    expect(input.content).toBe('New entry content')
    expect(input.assignedDay).toBe('2022-01-01')
  })

  it('should define UpdateEntryInput interface', () => {
    const input: UpdateEntryInput = {
      content: 'Updated content',
      assignedDay: '2022-01-02',
      orderPosition: 1
    }

    expect(input.content).toBe('Updated content')
    expect(input.assignedDay).toBe('2022-01-02')
    expect(input.orderPosition).toBe(1)
  })

  it('should allow partial UpdateEntryInput', () => {
    const partialInput: UpdateEntryInput = {
      content: 'Only content update'
    }

    expect(partialInput.content).toBe('Only content update')
    expect(partialInput.assignedDay).toBeUndefined()
    expect(partialInput.orderPosition).toBeUndefined()
  })
})
