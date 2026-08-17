/**
 * Tests for useEntryDayViewQueries composable
 */

import { ref, shallowRef } from 'vue'

import { withSetup } from '@test/helpers/with-setup'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { findByDay } from '@/api/entries/entry-queries'
import { findByEntryIds } from '@/api/entry-tags/entry-tag-queries'

import { useDatabase } from '@/shared/composables/use-database'

import { useEntryDayViewQueries } from './use-entry-day-view-queries'

import type { Entry } from '@/shared/types/entry-types'
import type { Database } from 'sql.js'
import type { App } from 'vue'

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: vi.fn()
}))

vi.mock('@/api/entries/entry-queries', () => ({
  findByDay: vi.fn()
}))

vi.mock('@/api/entry-tags/entry-tag-queries', () => ({
  findByEntryIds: vi.fn()
}))

const makeEntry = (id: string): Entry => ({
  id,
  content: `Entry ${id}`,
  assignedDay: '2026-02-18',
  orderPosition: 0,
  isDeleted: false,
  createdAt: 1234567890,
  updatedAt: 1234567890
})

describe('useEntryDayViewQueries', () => {
  const mockDbInstance = {} as Database
  let app: App | undefined

  afterEach(() => {
    app?.unmount()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDatabase).mockReturnValue({
      database: shallowRef(mockDbInstance),
      isInitialized: ref(true),
      isInitializing: ref(false),
      initError: ref(null),
      initialize: vi.fn(),
      persist: vi.fn(),
      exec: vi.fn(),
      run: vi.fn(),
      replaceDatabase: vi.fn()
    })
    vi.mocked(findByEntryIds).mockReturnValue(new Map())
  })

  describe('fetchEntries', () => {
    it('fetches entries for the current date', () => {
      const entries = [makeEntry('1'), makeEntry('2')]
      vi.mocked(findByDay).mockReturnValue(entries)

      const currentDate = ref('2026-02-18')
      let result: ReturnType<typeof useEntryDayViewQueries>
      ;[result, app] = withSetup(() => useEntryDayViewQueries(currentDate))

      result.fetchEntries()

      expect(findByDay).toHaveBeenCalledWith(mockDbInstance, '2026-02-18')
      expect(result.entries.value).toEqual(entries)
    })

    it('sets isLoading to false after fetch completes', () => {
      vi.mocked(findByDay).mockReturnValue([])

      const currentDate = ref('2026-02-18')
      let result: ReturnType<typeof useEntryDayViewQueries>
      ;[result, app] = withSetup(() => useEntryDayViewQueries(currentDate))

      result.fetchEntries()

      expect(result.isLoading.value).toBe(false)
    })

    it('sets error when database is not initialized', () => {
      vi.mocked(useDatabase).mockReturnValue({
        database: shallowRef(null),
        isInitialized: ref(false),
        isInitializing: ref(false),
        initError: ref(null),
        initialize: vi.fn(),
        persist: vi.fn(),
        exec: vi.fn(),
        run: vi.fn(),
        replaceDatabase: vi.fn()
      })

      const currentDate = ref('2026-02-18')
      let result: ReturnType<typeof useEntryDayViewQueries>
      ;[result, app] = withSetup(() => useEntryDayViewQueries(currentDate))

      result.fetchEntries()

      expect(result.error.value).toBeInstanceOf(Error)
      expect(result.error.value?.message).toBe('Database not initialized')
      expect(result.entries.value).toEqual([])
    })

    it('sets error when findByDay throws', () => {
      vi.mocked(findByDay).mockImplementation(() => {
        throw new Error('DB read error')
      })

      const currentDate = ref('2026-02-18')
      let result: ReturnType<typeof useEntryDayViewQueries>
      ;[result, app] = withSetup(() => useEntryDayViewQueries(currentDate))

      result.fetchEntries()

      expect(result.error.value).toBeInstanceOf(Error)
      expect(result.error.value?.message).toBe('DB read error')
      expect(result.entries.value).toEqual([])
    })

    it('uses updated currentDate when called after date change', () => {
      vi.mocked(findByDay).mockReturnValue([])

      const currentDate = ref('2026-02-18')
      let result: ReturnType<typeof useEntryDayViewQueries>
      ;[result, app] = withSetup(() => useEntryDayViewQueries(currentDate))

      currentDate.value = '2026-02-19'
      result.fetchEntries()

      expect(findByDay).toHaveBeenCalledWith(mockDbInstance, '2026-02-19')
    })

    it('populates entryTagsMap after fetch', () => {
      const entries = [makeEntry('entry-1')]
      const tagMap = new Map([
        [
          'entry-1',
          [
            {
              id: 'tag-1',
              name: 'work',
              createdAt: 0,
              updatedAt: 0,
              isDeleted: false
            }
          ]
        ]
      ])
      vi.mocked(findByDay).mockReturnValue(entries)
      vi.mocked(findByEntryIds).mockReturnValue(tagMap)

      const currentDate = ref('2026-02-18')
      let result: ReturnType<typeof useEntryDayViewQueries>
      ;[result, app] = withSetup(() => useEntryDayViewQueries(currentDate))

      result.fetchEntries()

      expect(findByEntryIds).toHaveBeenCalledWith(mockDbInstance, ['entry-1'])
      expect(result.entryTagsMap.value).toEqual(tagMap)
    })
  })

  describe('refetchEntries', () => {
    it('re-fetches entries when called', async () => {
      vi.mocked(findByDay).mockReturnValue([])

      const currentDate = ref('2026-02-18')
      let result: ReturnType<typeof useEntryDayViewQueries>
      ;[result, app] = withSetup(() => useEntryDayViewQueries(currentDate))

      const newEntries = [makeEntry('3')]
      vi.mocked(findByDay).mockReturnValue(newEntries)
      await result.refetchEntries()

      expect(result.entries.value).toEqual(newEntries)
    })

    it('returns a resolved promise', async () => {
      vi.mocked(findByDay).mockReturnValue([])

      const currentDate = ref('2026-02-18')
      let result: ReturnType<typeof useEntryDayViewQueries>
      ;[result, app] = withSetup(() => useEntryDayViewQueries(currentDate))

      await expect(result.refetchEntries()).resolves.toBeUndefined()
    })
  })
})
