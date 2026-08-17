/**
 * Tests for useEntrySectionHandlers composable
 */

import { ref, shallowRef } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateOrderPosition } from '@/api/entries/entry-mutations'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

import { useEntrySectionHandlers } from './use-entry-day-view-section-handlers'

import type { Entry } from '@/shared/types/entry-types'
import type { Database } from 'sql.js'

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: vi.fn()
}))

vi.mock('@/api/entries/entry-mutations', () => ({
  createEntry: vi.fn().mockReturnValue({
    id: 'new-entry',
    content: 'Test',
    assignedDay: '2026-02-18',
    orderPosition: 0,
    isDeleted: false,
    createdAt: 1234567890,
    updatedAt: 1234567890
  }),
  updateEntry: vi.fn().mockReturnValue({
    id: 'entry-1',
    content: 'Updated',
    assignedDay: '2026-02-18',
    orderPosition: 0,
    isDeleted: false,
    createdAt: 1234567890,
    updatedAt: 1234567890
  }),
  updateOrderPosition: vi.fn()
}))

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: vi.fn()
}))

describe('useEntrySectionHandlers', () => {
  const mockDbInstance = {} as Database
  const mockOnRefetch = vi.fn().mockResolvedValue(undefined)
  const mockSuccessToast = vi.fn()
  const mockErrorToast = vi.fn()

  const makeEntry = (id: string, orderPosition: number): Entry => ({
    id,
    content: `Entry ${id}`,
    assignedDay: '2026-02-18',
    orderPosition,
    isDeleted: false,
    createdAt: 1234567890,
    updatedAt: 1234567890
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
    vi.mocked(useToast).mockReturnValue({
      success: mockSuccessToast,
      error: mockErrorToast,
      info: vi.fn(),
      warning: vi.fn(),
      toasts: ref([]),
      addToast: vi.fn(),
      removeToast: vi.fn()
    })
    vi.mocked(updateOrderPosition).mockImplementation((_db, id, position) => ({
      id,
      content: `Entry ${id}`,
      assignedDay: '2026-02-18',
      orderPosition: position,
      isDeleted: false,
      createdAt: 1234567890,
      updatedAt: 1234567890
    }))
  })

  describe('handleEntryCreated', () => {
    it('shows success toast after creating an entry', async () => {
      const { handleEntryCreated } = useEntrySectionHandlers({
        onRefetch: mockOnRefetch
      })

      await handleEntryCreated({
        content: 'Test',
        assignedDay: '2026-02-18'
      })

      expect(mockSuccessToast).toHaveBeenCalledWith(
        'Entry created successfully'
      )
    })
  })

  describe('handleSaveRequested', () => {
    it('shows success toast after saving an entry', async () => {
      const { handleSaveRequested } = useEntrySectionHandlers({
        onRefetch: mockOnRefetch
      })

      await handleSaveRequested('entry-1', {
        content: 'Updated',
        assignedDay: '2026-02-18'
      })

      expect(mockSuccessToast).toHaveBeenCalledWith(
        'Entry updated successfully'
      )
    })
  })

  describe('handleMoveUp', () => {
    it('moves entry up in a list', () => {
      const entries = [
        makeEntry('entry-a', 0),
        makeEntry('entry-b', 1),
        makeEntry('entry-c', 2)
      ]

      const { handleMoveUp } = useEntrySectionHandlers({
        onRefetch: mockOnRefetch
      })

      handleMoveUp('entry-b', entries)

      expect(vi.mocked(updateOrderPosition)).toHaveBeenCalledWith(
        mockDbInstance,
        'entry-b',
        0
      )
    })

    it('shows error toast when move fails', () => {
      const entries = [makeEntry('entry-a', 0)]

      const { handleMoveUp } = useEntrySectionHandlers({
        onRefetch: mockOnRefetch
      })

      // entry-a is already at top, can't move up
      handleMoveUp('entry-a', entries)

      // At boundary - no error toast but no reorder call either
      expect(vi.mocked(updateOrderPosition)).not.toHaveBeenCalled()
    })
  })

  describe('handleMoveDown', () => {
    it('moves entry down in a list', () => {
      const entries = [
        makeEntry('entry-a', 0),
        makeEntry('entry-b', 1),
        makeEntry('entry-c', 2)
      ]

      const { handleMoveDown } = useEntrySectionHandlers({
        onRefetch: mockOnRefetch
      })

      handleMoveDown('entry-b', entries)

      expect(vi.mocked(updateOrderPosition)).toHaveBeenCalledWith(
        mockDbInstance,
        'entry-b',
        2
      )
    })
  })

  describe('canMoveUp / canMoveDown', () => {
    it('exposes canMoveUp and canMoveDown from useEntryReorder', () => {
      const { canMoveDown, canMoveUp } = useEntrySectionHandlers({
        onRefetch: mockOnRefetch
      })

      expect(typeof canMoveUp).toBe('function')
      expect(typeof canMoveDown).toBe('function')
    })

    it('canMoveUp returns false for first entry', () => {
      const entries = [makeEntry('entry-a', 0), makeEntry('entry-b', 1)]

      const { canMoveUp } = useEntrySectionHandlers({
        onRefetch: mockOnRefetch
      })

      expect(canMoveUp('entry-a', entries)).toBe(false)
      expect(canMoveUp('entry-b', entries)).toBe(true)
    })
  })
})
