/**
 * Tests for SearchSectionResults component
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import SearchSectionResults from './SearchSectionResults.vue'

import type { Entry } from '@/shared/types/entry-types'

const routerLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to']
}

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry-1',
    content: 'Test entry content',
    createdAt: 1000,
    updatedAt: 1000,
    assignedDay: '2026-02-28',
    orderPosition: 0,
    isDeleted: false,
    ...overrides
  }
}

function renderResults(
  props: Partial<{
    entries: Entry[]
    isLoading: boolean
    hasSubmitted: boolean
  }> = {}
) {
  return render(SearchSectionResults, {
    props: {
      entries: [],
      isLoading: false,
      hasSubmitted: false,
      ...props
    },
    global: { stubs: { RouterLink: routerLinkStub } }
  })
}

describe('SearchSectionResults', () => {
  it('shows a loading spinner while isLoading is true', () => {
    renderResults({ isLoading: true })

    expect(screen.getByTestId('results-loading')).toBeInTheDocument()
  })

  it('shows a prompt to search before any filter has been submitted', () => {
    renderResults({ hasSubmitted: false })

    expect(screen.getByTestId('empty-no-submit')).toBeInTheDocument()
  })

  it('shows a no-results message when submitted with zero matches', () => {
    renderResults({ hasSubmitted: true, entries: [] })

    expect(screen.getByTestId('empty-no-results')).toBeInTheDocument()
  })

  it('renders one card per entry', () => {
    renderResults({
      hasSubmitted: true,
      entries: [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })]
    })

    expect(screen.getAllByTestId('search-result-card')).toHaveLength(2)
  })

  it('prioritizes the loading state over the empty states', () => {
    renderResults({ isLoading: true, hasSubmitted: true, entries: [] })

    expect(screen.getByTestId('results-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-no-results')).not.toBeInTheDocument()
  })
})
