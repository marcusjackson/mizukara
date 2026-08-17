import { describe, expect, it } from 'vitest'

import type {
  AssignTagInput,
  CreateTagInput,
  EntryTag,
  Tag,
  TagInputOption,
  TagWithCount
} from './tag-types'

describe('Tag Types', () => {
  it('should define Tag interface', () => {
    const tag: Tag = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'travel',
      createdAt: 1740700800000,
      updatedAt: 1740700800000,
      isDeleted: false
    }

    expect(tag.id).toBe('550e8400-e29b-41d4-a716-446655440001')
    expect(tag.name).toBe('travel')
    expect(tag.createdAt).toBe(1740700800000)
    expect(tag.updatedAt).toBe(1740700800000)
    expect(tag.isDeleted).toBe(false)
  })

  it('should define TagWithCount interface', () => {
    const tagWithCount: TagWithCount = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'work',
      createdAt: 1740700800000,
      updatedAt: 1740700800000,
      isDeleted: false,
      entryCount: 5
    }

    expect(tagWithCount.entryCount).toBe(5)
    expect(tagWithCount.name).toBe('work')
  })

  it('should allow TagWithCount with zero entryCount', () => {
    const tagWithCount: TagWithCount = {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'unused',
      createdAt: 1740700800000,
      updatedAt: 1740700800000,
      isDeleted: false,
      entryCount: 0
    }

    expect(tagWithCount.entryCount).toBe(0)
  })

  it('should define EntryTag interface', () => {
    const entryTag: EntryTag = {
      id: '550e8400-e29b-41d4-a716-446655440004',
      entryId: '550e8400-e29b-41d4-a716-446655440005',
      tagId: '550e8400-e29b-41d4-a716-446655440001',
      createdAt: 1740700800000,
      updatedAt: 1740700800000,
      isDeleted: false
    }

    expect(entryTag.entryId).toBe('550e8400-e29b-41d4-a716-446655440005')
    expect(entryTag.tagId).toBe('550e8400-e29b-41d4-a716-446655440001')
    expect(entryTag.isDeleted).toBe(false)
  })

  it('should define CreateTagInput interface', () => {
    const input: CreateTagInput = {
      name: 'ideas'
    }

    expect(input.name).toBe('ideas')
  })

  it('should define AssignTagInput interface', () => {
    const input: AssignTagInput = {
      entryId: '550e8400-e29b-41d4-a716-446655440005',
      tagId: '550e8400-e29b-41d4-a716-446655440001'
    }

    expect(input.entryId).toBe('550e8400-e29b-41d4-a716-446655440005')
    expect(input.tagId).toBe('550e8400-e29b-41d4-a716-446655440001')
  })

  it('should define TagInputOption interface', () => {
    const option: TagInputOption = {
      value: '550e8400-e29b-41d4-a716-446655440001',
      label: 'travel'
    }

    expect(option.value).toBe('550e8400-e29b-41d4-a716-446655440001')
    expect(option.label).toBe('travel')
  })
})
