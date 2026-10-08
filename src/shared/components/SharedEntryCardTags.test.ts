/**
 * Tests for SharedEntryCardTags component
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import SharedEntryCardTags from './SharedEntryCardTags.vue'

import type { Tag } from '@/shared/types/tag-types'

const createTag = (id: string, name: string): Tag => ({
  id,
  name,
  createdAt: 1_000_000,
  updatedAt: 1_000_000,
  isDeleted: false
})

describe('SharedEntryCardTags', () => {
  it('renders one chip per tag, in the given order', () => {
    render(SharedEntryCardTags, {
      props: { tags: [createTag('t1', 'work'), createTag('t2', 'ideas')] }
    })

    const chips = screen.getByTestId('entry-tags').children
    expect(Array.from(chips).map((chip) => chip.textContent.trim())).toEqual([
      'work',
      'ideas'
    ])
  })

  it('renders no chips for an empty tag list', () => {
    render(SharedEntryCardTags, { props: { tags: [] } })

    expect(screen.getByTestId('entry-tags').children).toHaveLength(0)
  })
})
