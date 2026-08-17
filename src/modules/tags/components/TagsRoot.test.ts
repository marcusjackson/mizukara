/**
 * Tests for TagsRoot component
 *
 * Root component for the tags page. Orchestrates tag list fetching,
 * active filter state, and delegates mutations.
 */

import { reactive, ref } from 'vue'

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TagsRoot from './TagsRoot.vue'

import type { Entry } from '@/shared/types/entry-types'
import type { TagWithCount } from '@/shared/types/tag-types'

// ---------------------------------------------------------------------------
// Mock vue-router (reactive so computed derived from route.query updates)
// ---------------------------------------------------------------------------

const mockRoute = reactive<{ query: Record<string, string | string[]> }>({
  query: {}
})

const mockRouter = {
  replace: vi.fn((location: { query?: Record<string, unknown> }) => {
    mockRoute.query = (location.query ?? {}) as Record<
      string,
      string | string[]
    >
  })
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter
}))

// ---------------------------------------------------------------------------
// Mock composables
// ---------------------------------------------------------------------------

const mockFetchTags = vi.fn().mockResolvedValue(undefined)
const mockFetchEntriesByTags = vi.fn().mockResolvedValue(undefined)
const mockRenameTag = vi.fn().mockResolvedValue(true)
const mockDeleteTag = vi.fn().mockResolvedValue(true)

const mockTags = ref<TagWithCount[]>([])
const mockFilteredEntries = ref<Entry[]>([])
const mockTagOptions = ref([])
const mockIsLoading = ref(false)

vi.mock('../composables/use-tags', () => ({
  useTags: () => ({
    tags: mockTags,
    filteredEntries: mockFilteredEntries,
    tagOptions: mockTagOptions,
    isLoading: mockIsLoading,
    fetchTags: mockFetchTags,
    fetchEntriesByTags: mockFetchEntriesByTags
  })
}))

vi.mock('../composables/use-tag-mutations', () => ({
  useTagMutations: () => ({
    createTag: vi.fn(),
    renameTag: mockRenameTag,
    deleteTag: mockDeleteTag
  })
}))
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rekaUiStubs = {
  DialogRoot: {
    template: '<div v-if="open"><slot /></div>',
    props: ['open'],
    emits: ['update:open']
  },
  DialogPortal: { template: '<div><slot /></div>' },
  DialogOverlay: { template: '<div />' },
  DialogContent: {
    template: '<div role="dialog"><slot /></div>'
  },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogClose: { template: '<button aria-label="Close"><slot /></button>' }
}

function mountRoot() {
  return mount(TagsRoot, {
    global: {
      stubs: {
        TagsSectionBrowse: {
          template: `
            <div data-testid="section-browse">
              <button data-testid="trigger-toggle" @click="$emit('toggle-tag', 'tag-1')" />
              <button data-testid="trigger-rename" @click="$emit('rename-tag', 'tag-1', 'New Name')" />
              <button data-testid="trigger-delete" @click="$emit('delete-tag', 'tag-1')" />
            </div>
          `,
          emits: ['toggle-tag', 'rename-tag', 'delete-tag'],
          props: ['tags', 'activeTagIds']
        },
        TagsSectionEntries: {
          template:
            '<div data-testid="section-entries"><button data-testid="trigger-clear" @click="$emit(\'clear-filter\')" /></div>',
          emits: ['clear-filter'],
          props: ['entries', 'activeTagIds', 'searchQuery']
        },
        ...rekaUiStubs
      }
    }
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TagsRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchTags.mockResolvedValue(undefined)
    mockFetchEntriesByTags.mockResolvedValue(undefined)
    mockTags.value = []
    mockFilteredEntries.value = []
    mockIsLoading.value = false
    mockRoute.query = {}
    mockRouter.replace.mockImplementation(
      (location: { query?: Record<string, unknown> }) => {
        mockRoute.query = (location.query ?? {}) as Record<
          string,
          string | string[]
        >
      }
    )
  })

  describe('initial mount', () => {
    it('renders browse and entries sections', async () => {
      const wrapper = mountRoot()
      await flushPromises()

      expect(wrapper.find('[data-testid="section-browse"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="section-entries"]').exists()).toBe(
        true
      )
    })

    it('fetches tags on mount', async () => {
      mountRoot()
      await flushPromises()

      expect(mockFetchTags).toHaveBeenCalledTimes(1)
    })

    it('renders main element for page landmark', () => {
      const wrapper = mountRoot()

      expect(wrapper.find('main').exists()).toBe(true)
    })
  })

  describe('active tag filter', () => {
    it('adds tag to activeTagIds when toggle-tag is emitted (select)', async () => {
      const wrapper = mountRoot()
      await flushPromises()

      await wrapper.find('[data-testid="trigger-toggle"]').trigger('click')
      await flushPromises()

      // fetchEntriesByTags should be called with the new active tag
      expect(mockFetchEntriesByTags).toHaveBeenCalledWith(['tag-1'])
    })

    it('removes tag from activeTagIds when toggle-tag is emitted again (deselect)', async () => {
      const wrapper = mountRoot()
      await flushPromises()
      vi.clearAllMocks()

      // Select
      await wrapper.find('[data-testid="trigger-toggle"]').trigger('click')
      await flushPromises()
      // Deselect
      await wrapper.find('[data-testid="trigger-toggle"]').trigger('click')
      await flushPromises()

      expect(mockFetchEntriesByTags).toHaveBeenLastCalledWith([])
    })

    it('clears activeTagIds when clear-filter is emitted from entries section', async () => {
      const wrapper = mountRoot()
      await flushPromises()

      // Select a tag first
      await wrapper.find('[data-testid="trigger-toggle"]').trigger('click')
      await flushPromises()
      vi.clearAllMocks()

      // Clear filter
      await wrapper.find('[data-testid="trigger-clear"]').trigger('click')
      await flushPromises()

      expect(mockFetchEntriesByTags).toHaveBeenLastCalledWith([])
    })

    it('syncs activeTagIds to URL when tag is toggled', async () => {
      mountRoot()
      await flushPromises()

      await mountRoot().find('[data-testid="trigger-toggle"]').trigger('click')
      await flushPromises()

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({ query: { tags: ['tag-1'] } })
      )
    })

    it('reads initial tag filter from URL query parameter on mount', async () => {
      mockRoute.query = { tags: ['tag-1'] }

      mountRoot()
      await flushPromises()

      expect(mockFetchEntriesByTags).toHaveBeenCalledWith(['tag-1'])
    })
  })

  describe('tag mutations', () => {
    it('calls renameTag when rename-tag is emitted from browse section', async () => {
      const wrapper = mountRoot()
      await flushPromises()

      await wrapper.find('[data-testid="trigger-rename"]').trigger('click')
      await flushPromises()

      expect(mockRenameTag).toHaveBeenCalledWith('tag-1', 'New Name')
    })

    it('calls deleteTag when delete-tag is emitted from browse section', async () => {
      const wrapper = mountRoot()
      await flushPromises()
      vi.clearAllMocks()

      await wrapper.find('[data-testid="trigger-delete"]').trigger('click')
      await flushPromises()

      expect(mockDeleteTag).toHaveBeenCalledWith('tag-1')
    })

    it('removes deleted tag from activeTagIds when delete succeeds', async () => {
      // Seed URL with tag-1 active
      mockRoute.query = { tags: ['tag-1'] }

      const wrapper = mountRoot()
      await flushPromises()

      // deleteTag mock returns true (success)
      mockDeleteTag.mockResolvedValueOnce(true)

      await wrapper.find('[data-testid="trigger-delete"]').trigger('click')
      await flushPromises()

      // tag-1 should be removed from the active filter (router.replace called with no tags)
      expect(mockRouter.replace).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: {} })
      )
    })

    it('does not modify activeTagIds when delete fails', async () => {
      // Seed URL with tag-1 active
      mockRoute.query = { tags: ['tag-1'] }

      const wrapper = mountRoot()
      await flushPromises()
      vi.clearAllMocks()

      // deleteTag mock returns false (failure)
      mockDeleteTag.mockResolvedValueOnce(false)

      await wrapper.find('[data-testid="trigger-delete"]').trigger('click')
      await flushPromises()

      // fetchTags should not be called on failure
      expect(mockFetchTags).not.toHaveBeenCalled()
      // URL should not be modified
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('does not refetch tags when rename fails', async () => {
      const wrapper = mountRoot()
      await flushPromises()
      vi.clearAllMocks()

      // renameTag returns false (failure)
      mockRenameTag.mockResolvedValueOnce(false)

      await wrapper.find('[data-testid="trigger-rename"]').trigger('click')
      await flushPromises()

      expect(mockFetchTags).not.toHaveBeenCalled()
    })
  })
})
