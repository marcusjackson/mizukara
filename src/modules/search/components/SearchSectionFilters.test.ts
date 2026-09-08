/**
 * Tests for SearchSectionFilters component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import SearchSectionFilters from './SearchSectionFilters.vue'

import type { TagInputOption } from '@/shared/types/tag-types'

const testOptions: TagInputOption[] = [
  { label: 'Work', value: 'tag-work' },
  { label: 'Personal', value: 'tag-personal' }
]

function renderFilters(
  props: Partial<{
    query: string
    tagIds: string[]
    showAll: boolean
    tagOptions: TagInputOption[]
    view: 'list' | 'calendar'
  }> = {}
) {
  return render(SearchSectionFilters, {
    props: {
      query: '',
      tagIds: [],
      showAll: false,
      tagOptions: testOptions,
      view: 'list',
      ...props
    }
  })
}

describe('SearchSectionFilters', () => {
  it('renders the search text input', () => {
    renderFilters()

    expect(screen.getByLabelText(/search text/i)).toBeInTheDocument()
  })

  it('renders the tag filter combobox', () => {
    renderFilters()

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders the show-all-results toggle', () => {
    renderFilters()

    expect(screen.getByText(/show all results/i)).toBeInTheDocument()
  })

  it('renders the Search submit button', () => {
    renderFilters()

    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('emits submit when the Search button is clicked', async () => {
    const user = userEvent.setup()
    const result = renderFilters()

    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(result.emitted()['submit']).toBeTruthy()
  })

  it('emits submit when Enter is pressed in the text field', async () => {
    const user = userEvent.setup()
    const result = renderFilters()

    await user.type(screen.getByLabelText(/search text/i), 'coffee{Enter}')

    expect(result.emitted()['submit']).toBeTruthy()
  })

  it('does not emit submit merely from typing (no live search)', async () => {
    const user = userEvent.setup()
    const result = renderFilters()

    await user.type(screen.getByLabelText(/search text/i), 'coffee')

    expect(result.emitted()['submit']).toBeFalsy()
  })

  it('stages text input via update:query without emitting submit', async () => {
    const user = userEvent.setup()
    const result = renderFilters()

    await user.type(screen.getByLabelText(/search text/i), 'x')

    expect(result.emitted()['update:query']).toBeTruthy()
    expect(result.emitted()['submit']).toBeFalsy()
  })

  it('stages the show-all toggle via update:showAll', async () => {
    const user = userEvent.setup()
    const result = renderFilters()

    await user.click(screen.getByRole('switch'))

    expect(result.emitted()['update:showAll']).toBeTruthy()
    expect(result.emitted()['update:showAll']?.[0]).toEqual([true])
  })

  describe('view toggle', () => {
    it('marks the current view button as pressed', () => {
      renderFilters({ view: 'calendar' })

      expect(screen.getByRole('button', { name: /^list$/i })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
      expect(
        screen.getByRole('button', { name: /^calendar$/i })
      ).toHaveAttribute('aria-pressed', 'true')
    })

    it('emits update:view immediately when a view button is clicked', async () => {
      const user = userEvent.setup()
      const result = renderFilters({ view: 'list' })

      await user.click(screen.getByRole('button', { name: /^calendar$/i }))

      expect(result.emitted()['update:view']?.[0]).toEqual(['calendar'])
      expect(result.emitted()['submit']).toBeFalsy()
    })
  })
})
