/**
 * Tests for TagsSectionEntries component
 *
 * Section component displaying filtered entries for the active tag selection.
 * Shows empty states and a clear-filter action.
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TagsSectionEntries from './TagsSectionEntries.vue'

import type { Entry } from '@/shared/types/entry-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: 'entry-1',
  content: 'Test content',
  createdAt: 1_000_000,
  updatedAt: 1_000_000,
  assignedDay: '2026-02-28',
  orderPosition: 0,
  isDeleted: false,
  ...overrides
})

const defaultEntries: Entry[] = [
  createEntry({ id: 'entry-1', content: 'First entry' }),
  createEntry({ id: 'entry-2', content: 'Second entry' })
]

function renderEntries(
  props: {
    entries?: Entry[]
    activeTagIds?: string[]
    searchQuery?: string
  } = {}
) {
  return render(TagsSectionEntries, {
    props: {
      entries: defaultEntries,
      activeTagIds: ['tag-1'],
      ...props
    },
    global: {
      stubs: {
        SharedEntryCard: {
          template: '<article>{{ entry.content }}</article>',
          props: ['entry', 'showEditButton', 'isEditDisabled']
        }
      }
    }
  })
}

const NO_FILTER_TEXT = 'Select a tag to filter entries.'
const NO_RESULTS_TEXT = 'No entries found for the selected tags.'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TagsSectionEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('entry list rendering', () => {
    it('renders entry cards for each entry', () => {
      renderEntries()

      expect(screen.getAllByRole('article')).toHaveLength(2)
    })

    it('renders entry content', () => {
      renderEntries()

      expect(screen.getByText('First entry')).toBeInTheDocument()
      expect(screen.getByText('Second entry')).toBeInTheDocument()
    })
  })

  describe('empty states', () => {
    it('shows no-filter-selected empty state when activeTagIds is empty', () => {
      renderEntries({ activeTagIds: [], entries: [] })

      expect(screen.getByText(NO_FILTER_TEXT)).toBeInTheDocument()
    })

    it('shows no-results empty state when activeTagIds is non-empty but entries is empty', () => {
      renderEntries({ activeTagIds: ['tag-1'], entries: [] })

      expect(screen.getByText(NO_RESULTS_TEXT)).toBeInTheDocument()
    })

    it('does not show empty state when entries exist', () => {
      renderEntries()

      expect(screen.queryByText(NO_FILTER_TEXT)).toBeNull()
      expect(screen.queryByText(NO_RESULTS_TEXT)).toBeNull()
    })
  })

  describe('clear filter action', () => {
    it('shows clear filter button when activeTagIds is non-empty', () => {
      renderEntries({ activeTagIds: ['tag-1'] })

      expect(
        screen.getByRole('button', { name: 'Clear filter' })
      ).toBeInTheDocument()
    })

    it('does not show clear filter button when activeTagIds is empty', () => {
      renderEntries({ activeTagIds: [], entries: [] })

      expect(screen.queryByRole('button', { name: 'Clear filter' })).toBeNull()
    })

    it('emits clear-filter when clear filter button is clicked', async () => {
      const { emitted } = renderEntries({ activeTagIds: ['tag-1'] })

      await userEvent.click(
        screen.getByRole('button', { name: 'Clear filter' })
      )

      expect(emitted('clear-filter')).toHaveLength(1)
    })
  })

  describe('section structure', () => {
    it('renders a labelled region', () => {
      renderEntries()

      expect(
        screen.getByRole('region', { name: 'Filtered entries' })
      ).toBeInTheDocument()
    })

    it('renders section title', () => {
      renderEntries()

      expect(
        screen.getByRole('heading', { name: 'Entries' })
      ).toBeInTheDocument()
    })
  })
})
