/**
 * Tests for TagsSectionBrowse component
 *
 * Section component rendering the tag list with counts,
 * inline rename, delete confirmation, and active-filter highlighting.
 *
 * Note: Reka UI Dialog uses teleport/portal which has limitations in jsdom.
 * Tests use @vue/test-utils mount with stubbed Reka UI components.
 */

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TagsSectionBrowse from './TagsSectionBrowse.vue'

import type { TagWithCount } from '@/shared/types/tag-types'

// ---------------------------------------------------------------------------
// Reka UI stubs (dialog portals don't work in jsdom)
// ---------------------------------------------------------------------------

const rekaUiStubs = {
  DialogRoot: {
    template: '<div v-if="open"><slot /></div>',
    props: ['open'],
    emits: ['update:open']
  },
  DialogPortal: { template: '<div><slot /></div>' },
  DialogOverlay: { template: '<div class="overlay" />' },
  DialogContent: {
    template: '<div role="dialog" aria-modal="true"><slot /></div>'
  },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogClose: {
    template: '<button aria-label="Close"><slot /></button>'
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createTag = (overrides: Partial<TagWithCount> = {}): TagWithCount => ({
  id: 'tag-1',
  name: 'Work',
  entryCount: 3,
  createdAt: 1_000_000,
  updatedAt: 1_000_000,
  isDeleted: false,
  ...overrides
})

const defaultTags: TagWithCount[] = [
  createTag({ id: 'tag-1', name: 'Work', entryCount: 3 }),
  createTag({ id: 'tag-2', name: 'Personal', entryCount: 0 })
]

function mountBrowse(
  props: { tags?: TagWithCount[]; activeTagIds?: string[] } = {}
) {
  return mount(TagsSectionBrowse, {
    props: {
      tags: defaultTags,
      activeTagIds: [],
      ...props
    },
    global: { stubs: rekaUiStubs }
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TagsSectionBrowse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tag list rendering', () => {
    it('renders all tags by name', () => {
      const wrapper = mountBrowse()

      expect(wrapper.text()).toContain('Work')
      expect(wrapper.text()).toContain('Personal')
    })

    it('renders entry counts', () => {
      const wrapper = mountBrowse()

      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('0')
    })

    it('shows empty state when no tags exist', () => {
      const wrapper = mountBrowse({ tags: [] })

      expect(wrapper.text()).toContain('No tags yet')
    })

    it('applies active modifier to selected tags', () => {
      const wrapper = mountBrowse({ activeTagIds: ['tag-1'] })
      const row = wrapper.find('[data-testid="tag-row-tag-1"]')

      expect(row.classes()).toContain('tag-row--active')
    })

    it('does not apply active modifier to unselected tags', () => {
      const wrapper = mountBrowse({ activeTagIds: ['tag-1'] })
      const row = wrapper.find('[data-testid="tag-row-tag-2"]')

      expect(row.classes()).not.toContain('tag-row--active')
    })
  })

  describe('toggle-tag emission', () => {
    it('emits toggle-tag with the tag ID when toggle button is clicked', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="tag-toggle-tag-1"]').trigger('click')

      expect(wrapper.emitted('toggle-tag')).toEqual([['tag-1']])
    })

    it('emits toggle-tag for second tag', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="tag-toggle-tag-2"]').trigger('click')

      expect(wrapper.emitted('toggle-tag')).toEqual([['tag-2']])
    })
  })

  describe('inline rename', () => {
    it('shows rename input when rename button is clicked', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="rename-btn-tag-1"]').trigger('click')

      expect(wrapper.find('[data-testid="rename-input-tag-1"]').exists()).toBe(
        true
      )
    })

    it('hides tag name text when rename input is shown', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="rename-btn-tag-1"]').trigger('click')

      expect(wrapper.find('[data-testid="tag-name-tag-1"]').exists()).toBe(
        false
      )
    })

    it('emits rename-tag with id and trimmed name on Enter', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="rename-btn-tag-1"]').trigger('click')
      const input = wrapper.find('[data-testid="rename-input-tag-1"]')
      await input.setValue('Updated Work  ')
      await input.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('rename-tag')).toEqual([['tag-1', 'Updated Work']])
    })

    it('does not emit rename-tag when name is blank', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="rename-btn-tag-1"]').trigger('click')
      const input = wrapper.find('[data-testid="rename-input-tag-1"]')
      await input.setValue('   ')
      await input.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('rename-tag')).toBeUndefined()
    })

    it('cancels rename on Escape and restores tag name display', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="rename-btn-tag-1"]').trigger('click')
      await wrapper
        .find('[data-testid="rename-input-tag-1"]')
        .trigger('keydown', { key: 'Escape' })

      expect(wrapper.find('[data-testid="rename-input-tag-1"]').exists()).toBe(
        false
      )
      expect(wrapper.text()).toContain('Work')
    })
  })

  describe('delete with confirmation', () => {
    it('does not show confirmation dialog initially', () => {
      const wrapper = mountBrowse()

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('shows confirmation dialog when delete button is clicked', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="delete-btn-tag-1"]').trigger('click')

      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })

    it('emits delete-tag when confirm button is clicked', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="delete-btn-tag-1"]').trigger('click')
      // Find the confirm button inside the dialog (not the row delete buttons)
      const dialog = wrapper.find('[role="dialog"]')
      const confirmBtn = dialog
        .findAll('button')
        .find((b) => b.text() === 'Delete')
      await confirmBtn!.trigger('click')

      expect(wrapper.emitted('delete-tag')).toEqual([['tag-1']])
    })

    it('closes dialog without emitting delete-tag when cancel is clicked', async () => {
      const wrapper = mountBrowse()

      await wrapper.find('[data-testid="delete-btn-tag-1"]').trigger('click')
      const dialog = wrapper.find('[role="dialog"]')
      const cancelBtn = dialog
        .findAll('button')
        .find((b) => b.text() === 'Cancel')
      await cancelBtn!.trigger('click')

      expect(wrapper.emitted('delete-tag')).toBeUndefined()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('renders a section element with accessible label', () => {
      const wrapper = mountBrowse()
      const section = wrapper.find('section')

      expect(section.exists()).toBe(true)
      expect(section.attributes('aria-label')).toBeTruthy()
    })

    it('all action buttons are present for each tag', () => {
      const wrapper = mountBrowse()

      expect(wrapper.find('[data-testid="rename-btn-tag-1"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="delete-btn-tag-1"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="rename-btn-tag-2"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="delete-btn-tag-2"]').exists()).toBe(
        true
      )
    })
  })
})
