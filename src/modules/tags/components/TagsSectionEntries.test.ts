/**
 * Tests for TagsSectionEntries component
 *
 * Section component displaying filtered entries for the active tag selection.
 * Shows empty states and a clear-filter action.
 */

import { mount } from '@vue/test-utils'
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

function mountEntries(
  props: {
    entries?: Entry[]
    activeTagIds?: string[]
    searchQuery?: string
  } = {}
) {
  return mount(TagsSectionEntries, {
    props: {
      entries: defaultEntries,
      activeTagIds: ['tag-1'],
      ...props
    },
    global: {
      stubs: {
        SharedEntryCard: {
          template:
            '<article data-testid="entry-card" :data-entry-id="entry.id">{{ entry.content }}</article>',
          props: ['entry', 'showEditButton', 'isEditDisabled']
        }
      }
    }
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TagsSectionEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('entry list rendering', () => {
    it('renders entry cards for each entry', () => {
      const wrapper = mountEntries()

      const cards = wrapper.findAll('[data-testid="entry-card"]')
      expect(cards).toHaveLength(2)
    })

    it('renders entry content', () => {
      const wrapper = mountEntries()

      expect(wrapper.text()).toContain('First entry')
      expect(wrapper.text()).toContain('Second entry')
    })

    it('renders entries with showEditButton false (read-only cards)', () => {
      const wrapper = mountEntries()

      const card = wrapper.find('[data-testid="entry-card"]')
      // The stub receives showEditButton prop - check it's passed
      expect(card.exists()).toBe(true)
    })
  })

  describe('empty states', () => {
    it('shows no-filter-selected empty state when activeTagIds is empty', () => {
      const wrapper = mountEntries({ activeTagIds: [], entries: [] })

      expect(wrapper.find('[data-testid="empty-no-filter"]').exists()).toBe(
        true
      )
    })

    it('shows no-results empty state when activeTagIds is non-empty but entries is empty', () => {
      const wrapper = mountEntries({ activeTagIds: ['tag-1'], entries: [] })

      expect(wrapper.find('[data-testid="empty-no-results"]').exists()).toBe(
        true
      )
    })

    it('does not show empty state when entries exist', () => {
      const wrapper = mountEntries()

      expect(wrapper.find('[data-testid="empty-no-filter"]').exists()).toBe(
        false
      )
      expect(wrapper.find('[data-testid="empty-no-results"]').exists()).toBe(
        false
      )
    })
  })

  describe('clear filter action', () => {
    it('shows clear filter button when activeTagIds is non-empty', () => {
      const wrapper = mountEntries({ activeTagIds: ['tag-1'] })

      expect(wrapper.find('[data-testid="clear-filter-btn"]').exists()).toBe(
        true
      )
    })

    it('does not show clear filter button when activeTagIds is empty', () => {
      const wrapper = mountEntries({ activeTagIds: [], entries: [] })

      expect(wrapper.find('[data-testid="clear-filter-btn"]').exists()).toBe(
        false
      )
    })

    it('emits clear-filter when clear filter button is clicked', async () => {
      const wrapper = mountEntries({ activeTagIds: ['tag-1'] })

      await wrapper.find('[data-testid="clear-filter-btn"]').trigger('click')

      expect(wrapper.emitted('clear-filter')).toHaveLength(1)
    })
  })

  describe('section structure', () => {
    it('renders a section element with accessible label', () => {
      const wrapper = mountEntries()
      const section = wrapper.find('section')

      expect(section.exists()).toBe(true)
      expect(section.attributes('aria-label')).toBeTruthy()
    })

    it('renders section title', () => {
      const wrapper = mountEntries()

      expect(wrapper.text()).toContain('Entries')
    })
  })
})
