/**
 * Tests for SearchRoot component
 *
 * Root component for the search page. Owns URL-synced applied filters
 * (?q=&tags=&all=), stages local edits, and re-queries only on submit or
 * on an external URL change (e.g. back/forward navigation).
 */

import { reactive, ref } from 'vue'

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SearchRoot from './SearchRoot.vue'

import type { Entry } from '@/shared/types/entry-types'

// ---------------------------------------------------------------------------
// Mock vue-router (reactive so computed derived from route.query updates)
// ---------------------------------------------------------------------------

const mockRoute = reactive<{
  query: Record<string, string | string[]>
}>({ query: {} })

const mockRouter = {
  replace: vi.fn((location: { query?: Record<string, unknown> }) => {
    mockRoute.query = (location.query ?? {}) as Record<
      string,
      string | string[]
    >
  }),
  back: vi.fn(),
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: "<a :href=\"typeof to === 'string' ? to : ''\"><slot /></a>"
  }
}))

// ---------------------------------------------------------------------------
// Mock composables
// ---------------------------------------------------------------------------

const mockRunSearch = vi.fn().mockResolvedValue(undefined)
const mockRunDayCounts = vi.fn().mockResolvedValue(undefined)
const mockFetchTagOptions = vi.fn().mockResolvedValue(undefined)

const mockEntries = ref<Entry[]>([])
const mockDayCounts = ref([])
const mockIsLoading = ref(false)
const mockIsLoadingDayCounts = ref(false)
const mockTagOptions = ref([])

vi.mock('../composables/use-search', () => ({
  useSearch: () => ({
    entries: mockEntries,
    dayCounts: mockDayCounts,
    isLoading: mockIsLoading,
    isLoadingDayCounts: mockIsLoadingDayCounts,
    runSearch: mockRunSearch,
    runDayCounts: mockRunDayCounts
  })
}))

vi.mock('../composables/use-search-tag-options', () => ({
  useSearchTagOptions: () => ({
    tagOptions: mockTagOptions,
    fetchTagOptions: mockFetchTagOptions
  })
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// mockRoute is a module-level reactive object shared across every test in
// this file. An unmounted wrapper's watchers keep firing on later mutations
// of mockRoute.query, so every mount is tracked here and torn down in
// afterEach to avoid cross-test call-count contamination.
const mountedWrappers: ReturnType<typeof mount>[] = []

function mountRoot() {
  const wrapper = mount(SearchRoot, {
    global: {
      stubs: {
        SearchSectionFilters: {
          name: 'SearchSectionFilters',
          template: `
            <div data-testid="section-filters">
              <input
                data-testid="trigger-query"
                :value="query"
                @input="$emit('update:query', $event.target.value)"
              />
              <button data-testid="trigger-submit" @click="$emit('submit')" />
              <button
                data-testid="trigger-view-calendar"
                @click="$emit('update:view', 'calendar')"
              />
            </div>
          `,
          emits: [
            'submit',
            'update:query',
            'update:tagIds',
            'update:showAll',
            'update:view'
          ],
          props: ['query', 'tagIds', 'showAll', 'tagOptions', 'view']
        },
        SearchSectionResults: {
          template: '<div data-testid="section-results" />',
          props: ['entries', 'isLoading', 'isCapped', 'hasSubmitted']
        },
        SearchSectionCalendar: {
          template: '<div data-testid="section-calendar" />',
          props: ['dayCounts', 'isLoading', 'month']
        }
      }
    }
  })
  mountedWrappers.push(wrapper)
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRunSearch.mockResolvedValue(undefined)
    mockRunDayCounts.mockResolvedValue(undefined)
    mockFetchTagOptions.mockResolvedValue(undefined)
    mockEntries.value = []
    mockDayCounts.value = []
    mockIsLoading.value = false
    mockIsLoadingDayCounts.value = false
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

  afterEach(() => {
    for (const wrapper of mountedWrappers.splice(0)) {
      wrapper.unmount()
    }
  })

  describe('header navigation', () => {
    it('renders a back button and a tags link', () => {
      const wrapper = mountRoot()

      expect(wrapper.find('[aria-label="Back"]').exists()).toBe(true)
      expect(wrapper.find('a[href="/tags"]').exists()).toBe(true)
    })

    it('falls back to pushing the home route when there is no in-app history to go back to', async () => {
      // jsdom starts each test with a fresh, state-less history entry.
      const wrapper = mountRoot()

      await wrapper.find('[aria-label="Back"]').trigger('click')

      expect(mockRouter.push).toHaveBeenCalledWith('/')
      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('goes back through history when the previous entry was reached in-app', async () => {
      // vue-router's history mode writes { back, current, forward } onto
      // history.state on every in-app navigation; simulate having arrived
      // here from the entry day view.
      globalThis.history.replaceState(
        { back: '/entries', current: '/search' },
        ''
      )
      const wrapper = mountRoot()

      await wrapper.find('[aria-label="Back"]').trigger('click')

      expect(mockRouter.back).toHaveBeenCalledTimes(1)
      expect(mockRouter.push).not.toHaveBeenCalled()

      globalThis.history.replaceState(null, '')
    })
  })

  describe('initial mount', () => {
    it('renders filters and results sections', () => {
      const wrapper = mountRoot()

      expect(wrapper.find('[data-testid="section-filters"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="section-results"]').exists()).toBe(
        true
      )
    })

    it('fetches tag options on mount', async () => {
      mountRoot()
      await flushPromises()

      expect(mockFetchTagOptions).toHaveBeenCalledTimes(1)
    })

    it('renders main element for page landmark', () => {
      const wrapper = mountRoot()

      expect(wrapper.find('main').exists()).toBe(true)
    })

    it('does not query when the URL has no filters', async () => {
      mountRoot()
      await flushPromises()

      expect(mockRunSearch).toHaveBeenCalledWith(
        { query: '', tagIds: [] },
        true
      )
    })
  })

  describe('URL-seeded filters', () => {
    it('runs a search immediately when the URL already has a query param', async () => {
      mockRoute.query = { q: 'coffee' }

      mountRoot()
      await flushPromises()

      expect(mockRunSearch).toHaveBeenCalledWith(
        { query: 'coffee', tagIds: [] },
        true
      )
    })

    it('runs a search immediately when the URL already has tag params', async () => {
      mockRoute.query = { tags: ['tag-1', 'tag-2'] }

      mountRoot()
      await flushPromises()

      expect(mockRunSearch).toHaveBeenCalledWith(
        { query: '', tagIds: ['tag-1', 'tag-2'] },
        true
      )
    })

    it('passes capped:false when ?all=true is present', async () => {
      mockRoute.query = { q: 'coffee', all: 'true' }

      mountRoot()
      await flushPromises()

      expect(mockRunSearch).toHaveBeenCalledWith(
        { query: 'coffee', tagIds: [] },
        false
      )
    })
  })

  describe('submit', () => {
    it('writes the search text to the URL on submit', async () => {
      const wrapper = mountRoot()
      await flushPromises()

      await wrapper.find('[data-testid="trigger-query"]').setValue('sunset')
      await wrapper.find('[data-testid="trigger-submit"]').trigger('click')
      await flushPromises()

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({ query: { q: 'sunset' } })
      )
    })

    it('omits q from the URL when the staged query is blank', async () => {
      mockRoute.query = { q: 'old' }
      const wrapper = mountRoot()
      await flushPromises()

      await wrapper.find('[data-testid="trigger-query"]').setValue('   ')
      await wrapper.find('[data-testid="trigger-submit"]').trigger('click')
      await flushPromises()

      expect(mockRouter.replace).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: {} })
      )
    })
  })

  describe('view and calendar', () => {
    it('renders the list section and not the calendar by default', () => {
      const wrapper = mountRoot()

      expect(wrapper.find('[data-testid="section-results"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="section-calendar"]').exists()).toBe(
        false
      )
    })

    it('does not query day counts while list view is active', async () => {
      mountRoot()
      await flushPromises()

      expect(mockRunDayCounts).not.toHaveBeenCalled()
    })

    it('renders the calendar section and queries day counts when ?view=calendar', async () => {
      mockRoute.query = { view: 'calendar' }

      const wrapper = mountRoot()
      await flushPromises()

      expect(wrapper.find('[data-testid="section-calendar"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="section-results"]').exists()).toBe(
        false
      )
      expect(mockRunDayCounts).toHaveBeenCalledWith(
        { query: '', tagIds: [] },
        expect.stringMatching(/^\d{4}-\d{2}$/)
      )
    })

    it('scopes day counts to the ?month= param when present', async () => {
      mockRoute.query = { view: 'calendar', month: '2022-06' }

      mountRoot()
      await flushPromises()

      expect(mockRunDayCounts).toHaveBeenCalledWith(
        { query: '', tagIds: [] },
        '2022-06'
      )
    })

    it('switches to calendar view immediately when the filters emit update:view', async () => {
      const wrapper = mountRoot()
      await flushPromises()

      await wrapper
        .find('[data-testid="trigger-view-calendar"]')
        .trigger('click')
      await flushPromises()

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({ query: { view: 'calendar' } })
      )
    })

    it('keeps unsubmitted filter edits when the view changes', async () => {
      mockRoute.query = { q: 'coffee' }
      const wrapper = mountRoot()
      await flushPromises()

      await wrapper.find('[data-testid="trigger-query"]').setValue('tea')
      await wrapper
        .find('[data-testid="trigger-view-calendar"]')
        .trigger('click')
      await flushPromises()

      expect(
        (
          wrapper.find('[data-testid="trigger-query"]')
            .element as HTMLInputElement
        ).value
      ).toBe('tea')
    })

    it('does not run the unbounded list search while calendar view is active', async () => {
      mockRoute.query = { view: 'calendar', q: 'coffee' }

      mountRoot()
      await flushPromises()

      expect(mockRunSearch).not.toHaveBeenCalled()
    })

    it('runs the list search again after switching back from calendar to list', async () => {
      mockRoute.query = { view: 'calendar', q: 'coffee' }
      mountRoot()
      await flushPromises()
      expect(mockRunSearch).not.toHaveBeenCalled()

      mockRoute.query = { q: 'coffee' }
      await flushPromises()

      expect(mockRunSearch).toHaveBeenCalledWith(
        { query: 'coffee', tagIds: [] },
        true
      )
    })

    it('falls back to the current month when ?month= is malformed', async () => {
      mockRoute.query = { view: 'calendar', month: '2022-2' }

      mountRoot()
      await flushPromises()

      expect(mockRunDayCounts).toHaveBeenCalledWith(
        { query: '', tagIds: [] },
        expect.stringMatching(/^\d{4}-\d{2}$/)
      )
      expect(mockRunDayCounts).not.toHaveBeenCalledWith(
        expect.anything(),
        '2022-2'
      )
    })
  })
})
