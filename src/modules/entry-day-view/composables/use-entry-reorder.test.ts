import { ref, shallowRef } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateOrderPosition } from '@/api/entries/entry-mutations'

import { useDatabase } from '@/shared/composables/use-database'

import { useEntryReorder } from './use-entry-reorder'

import type { Entry } from '@/shared/types/entry-types'

// Mock the database composable
vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: vi.fn()
}))

// Mock entry mutations
vi.mock('@/api/entries/entry-mutations', () => ({
  updateOrderPosition: vi.fn()
}))

describe('useEntryReorder', () => {
  const mockDbInstance = {
    run: vi.fn(),
    exec: vi.fn(),
    close: vi.fn(),
    export: vi.fn()
  }
  const mockOnRefetch = vi.fn()

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
    vi.mocked(updateOrderPosition).mockImplementation((_db, id, position) => ({
      id,
      content: 'Test content',
      createdAt: 1234567890,
      updatedAt: 1234567890,
      assignedDay: '2026-02-11',
      orderPosition: position,
      isDeleted: false
    }))
  })

  describe('moveEntryUp', () => {
    it('swaps positions correctly when moving up', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 },
        { id: 'entry3', orderPosition: 2 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryUp('entry2', entries)

      expect(result.success).toBe(true)
      expect(vi.mocked(updateOrderPosition)).toHaveBeenCalledWith(
        mockDbInstance,
        'entry2',
        0
      )
      expect(vi.mocked(updateOrderPosition)).toHaveBeenCalledWith(
        mockDbInstance,
        'entry1',
        1
      )
      expect(mockOnRefetch).toHaveBeenCalled()
    })

    it('returns at-boundary when entry at index 0', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryUp('entry1', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('at-boundary')
      }
      expect(vi.mocked(updateOrderPosition)).not.toHaveBeenCalled()
      expect(mockOnRefetch).not.toHaveBeenCalled()
    })

    it('returns not-found when entry does not exist', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryUp('nonexistent', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('not-found')
      }
      expect(vi.mocked(updateOrderPosition)).not.toHaveBeenCalled()
      expect(mockOnRefetch).not.toHaveBeenCalled()
    })
  })

  describe('moveEntryDown', () => {
    it('swaps positions correctly when moving down', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 },
        { id: 'entry3', orderPosition: 2 }
      ] as Entry[]

      const { moveEntryDown } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryDown('entry2', entries)

      expect(result.success).toBe(true)
      expect(vi.mocked(updateOrderPosition)).toHaveBeenCalledWith(
        mockDbInstance,
        'entry2',
        2
      )
      expect(vi.mocked(updateOrderPosition)).toHaveBeenCalledWith(
        mockDbInstance,
        'entry3',
        1
      )
      expect(mockOnRefetch).toHaveBeenCalled()
    })

    it('returns at-boundary when entry at last index', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryDown } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryDown('entry2', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('at-boundary')
      }
      expect(vi.mocked(updateOrderPosition)).not.toHaveBeenCalled()
      expect(mockOnRefetch).not.toHaveBeenCalled()
    })

    it('returns not-found when entry does not exist', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryDown } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryDown('nonexistent', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('not-found')
      }
      expect(vi.mocked(updateOrderPosition)).not.toHaveBeenCalled()
      expect(mockOnRefetch).not.toHaveBeenCalled()
    })
  })

  describe('canMoveUp', () => {
    it('returns correct boundary checks', () => {
      const entries = [
        { id: 'entry1' },
        { id: 'entry2' },
        { id: 'entry3' }
      ] as Entry[]

      const { canMoveUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      expect(canMoveUp('entry1', entries)).toBe(false) // index 0
      expect(canMoveUp('entry2', entries)).toBe(true) // index 1
      expect(canMoveUp('entry3', entries)).toBe(true) // index 2
    })
  })

  describe('canMoveDown', () => {
    it('returns correct boundary checks', () => {
      const entries = [
        { id: 'entry1' },
        { id: 'entry2' },
        { id: 'entry3' }
      ] as Entry[]

      const { canMoveDown } = useEntryReorder({ onRefetch: mockOnRefetch })

      expect(canMoveDown('entry1', entries)).toBe(true) // index 0
      expect(canMoveDown('entry2', entries)).toBe(true) // index 1
      expect(canMoveDown('entry3', entries)).toBe(false) // index 2 (last)
    })
  })

  describe('updateOrderPosition calls', () => {
    it('calls updateOrderPosition with correct parameters', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryUp('entry2', entries)

      expect(result.success).toBe(true)
      expect(vi.mocked(updateOrderPosition)).toHaveBeenCalledWith(
        mockDbInstance,
        'entry2',
        0
      )
      expect(vi.mocked(updateOrderPosition)).toHaveBeenCalledWith(
        mockDbInstance,
        'entry1',
        1
      )
    })
  })

  describe('onRefetch callback', () => {
    it('invokes onRefetch callback after successful swap', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryUp('entry2', entries)

      expect(result.success).toBe(true)
      expect(mockOnRefetch).toHaveBeenCalled()
    })
  })

  describe('entry not found', () => {
    it('handles entry not found gracefully', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryUp('nonexistent', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('not-found')
      }
      expect(vi.mocked(updateOrderPosition)).not.toHaveBeenCalled()
      expect(mockOnRefetch).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('resets isReordering flag when updateOrderPosition throws', () => {
      vi.mocked(updateOrderPosition).mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { isReordering, moveEntryUp } = useEntryReorder({
        onRefetch: mockOnRefetch
      })

      const result = moveEntryUp('entry2', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('error')
        if (result.reason === 'error') {
          expect(result.error).toBeInstanceOf(Error)
          expect(result.error.message).toBe('Database error')
        }
      }
      expect(isReordering.value).toBe(false)
    })

    it('calls onRefetch even when updateOrderPosition throws', () => {
      vi.mocked(updateOrderPosition).mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      moveEntryUp('entry2', entries)

      expect(mockOnRefetch).toHaveBeenCalled()
    })

    it('returns no-database when database is not initialized', () => {
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

      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryUp('entry2', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('no-database')
      }
      expect(vi.mocked(updateOrderPosition)).not.toHaveBeenCalled()
    })

    it('returns in-progress when reorder already in progress', () => {
      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 },
        { id: 'entry3', orderPosition: 2 }
      ] as Entry[]

      const { isReordering, moveEntryUp } = useEntryReorder({
        onRefetch: mockOnRefetch
      })

      // Manually set isReordering to true to simulate in-progress state
      isReordering.value = true

      // Try to start reorder while one is already in progress
      const result = moveEntryUp('entry2', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('in-progress')
      }
      expect(vi.mocked(updateOrderPosition)).not.toHaveBeenCalled()
    })

    it('converts non-Error exceptions to Error objects', () => {
      // Define a custom error class that is not an instance of Error to test the conversion logic.
      // This ensures the composable properly handles exceptions that aren't Error objects.
      class CustomError {
        constructor(public message: string) {}
        toString() {
          return this.message
        }
      }

      vi.mocked(updateOrderPosition).mockImplementationOnce(() => {
        // Throw a non-Error object to verify that the composable converts it to an Error.
        // ESLint normally requires throwing only Error objects, but this test needs to throw
        // a non-Error to validate the error conversion behavior.
        throw new CustomError('string error') // eslint-disable-line @typescript-eslint/only-throw-error
      })

      const entries = [
        { id: 'entry1', orderPosition: 0 },
        { id: 'entry2', orderPosition: 1 }
      ] as Entry[]

      const { moveEntryUp } = useEntryReorder({ onRefetch: mockOnRefetch })

      const result = moveEntryUp('entry2', entries)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.reason).toBe('error')
        if (result.reason === 'error') {
          expect(result.error).toBeInstanceOf(Error)
          expect(result.error.message).toBe('string error')
        }
      }
    })
  })
})
