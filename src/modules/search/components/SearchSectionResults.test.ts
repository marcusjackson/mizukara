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
    isCapped: boolean
    hasSubmitted: boolean
  }> = {}
) {
  return render(SearchSectionResults, {
    props: {
      entries: [],
      isLoading: false,
      isCapped: false,
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

  describe('cap notice', () => {
    const manyEntries = (count: number): Entry[] =>
      Array.from({ length: count }, (_, i) =>
        makeEntry({ id: `e${String(i)}` })
      )

    it('tells the reader more matches may exist when a capped list is full', () => {
      renderResults({
        hasSubmitted: true,
        isCapped: true,
        entries: manyEntries(20)
      })

      expect(screen.getByTestId('cap-notice')).toHaveTextContent(
        'Show all results'
      )
      expect(screen.getAllByTestId('search-result-card')).toHaveLength(20)
    })

    it('shows no notice for a capped list that is not full', () => {
      renderResults({
        hasSubmitted: true,
        isCapped: true,
        entries: manyEntries(19)
      })

      expect(screen.queryByTestId('cap-notice')).not.toBeInTheDocument()
    })

    it('shows no notice when "Show all results" is on', () => {
      renderResults({
        hasSubmitted: true,
        isCapped: false,
        entries: manyEntries(25)
      })

      expect(screen.queryByTestId('cap-notice')).not.toBeInTheDocument()
    })
  })

  it('prioritizes the loading state over the empty states', () => {
    renderResults({ isLoading: true, hasSubmitted: true, entries: [] })

    expect(screen.getByTestId('results-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-no-results')).not.toBeInTheDocument()
  })
})
