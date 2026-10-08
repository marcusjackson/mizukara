/**
 * Tests for SearchPage component
 *
 * Thin page wrapper for the /search route: it mounts the search module root
 * and the shared toast host and owns no UI of its own. Both children are
 * stubbed so this stays a wiring test.
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/modules/search/components/SearchRoot.vue', () => ({
  default: {
    name: 'SearchRoot',
    template: '<div data-testid="search-root"></div>'
  }
}))

vi.mock('@/shared/components', () => ({
  SharedToast: {
    name: 'SharedToast',
    template: '<div data-testid="shared-toast"></div>'
  }
}))

import SearchPage from './SearchPage.vue'

describe('SearchPage', () => {
  it('renders the search module root', () => {
    render(SearchPage)

    expect(screen.getByTestId('search-root')).toBeInTheDocument()
  })

  it('renders the shared toast host alongside it', () => {
    render(SearchPage)

    expect(screen.getByTestId('shared-toast')).toBeInTheDocument()
  })
})
