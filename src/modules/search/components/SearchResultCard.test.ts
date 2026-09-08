/**
 * Tests for SearchResultCard component
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import SearchResultCard from './SearchResultCard.vue'

import type { Entry } from '@/shared/types/entry-types'

// ---------------------------------------------------------------------------
// Stub RouterLink (avoids needing a real router instance in unit tests)
// ---------------------------------------------------------------------------

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

function renderCard(entry: Entry) {
  return render(SearchResultCard, {
    props: { entry },
    global: { stubs: { RouterLink: routerLinkStub } }
  })
}

describe('SearchResultCard', () => {
  it('renders the formatted assigned day', () => {
    renderCard(makeEntry({ assignedDay: '2026-02-28' }))

    expect(screen.getByTestId('search-result-day')).toHaveTextContent(
      /Feb 28, 2026/
    )
  })

  it('renders a snippet of the content', () => {
    renderCard(makeEntry({ content: 'Short content' }))

    expect(screen.getByTestId('search-result-snippet')).toHaveTextContent(
      'Short content'
    )
  })

  it('truncates long content with an ellipsis', () => {
    const longContent = 'word '.repeat(60).trim()
    renderCard(makeEntry({ content: longContent }))

    const snippetEl = screen.getByTestId('search-result-snippet')
    expect(snippetEl).toHaveTextContent('…')
    expect(snippetEl.textContent.length).toBeLessThan(longContent.length)
  })

  it('links to the entry day route for the assigned day', () => {
    renderCard(makeEntry({ assignedDay: '2026-03-05' }))

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/entries/2026-03-05'
    )
  })
})
