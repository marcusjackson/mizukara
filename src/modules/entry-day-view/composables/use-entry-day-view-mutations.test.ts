/**
 * Tests for use-entry-day-view-mutations composable
 *
 * Wraps entry create/update operations with automatic refetch.
 * Critical to data integrity in the entry day view.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// =============================================================================
// Mocks
// =============================================================================

const mockDatabase = {}

const { mockShowError } = vi.hoisted(() => ({ mockShowError: vi.fn() }))

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({ error: mockShowError })
}))

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: () => ({
    database: { value: mockDatabase }
  })
}))

const { mockCreateEntry, mockUpdateEntry } = vi.hoisted(() => ({
  mockCreateEntry: vi.fn(),
  mockUpdateEntry: vi.fn()
}))

vi.mock('@/api/entries/entry-mutations', () => ({
  createEntry: mockCreateEntry,
  updateEntry: mockUpdateEntry
}))

// Import after mocks
import { useEntryDayViewMutations } from './use-entry-day-view-mutations'

import type {
  CreateEntryInput,
  UpdateEntryInput
} from '@/shared/types/entry-types'

// =============================================================================
// Tests
// =============================================================================

describe('useEntryDayViewMutations', () => {
  const createMutations = (onRefetch = vi.fn().mockResolvedValue(undefined)) =>
    useEntryDayViewMutations({ onRefetch })

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateEntry.mockReset()
    mockUpdateEntry.mockReset()
  })

  describe('failures', () => {
    it('shows an error toast and resolves false when createEntry throws', async () => {
      mockCreateEntry.mockImplementation(() => {
        throw new Error('content: too long')
      })
      const onRefetch = vi.fn().mockResolvedValue(undefined)
      const { createNewEntry } = createMutations(onRefetch)

      const result = await createNewEntry({
        content: 'x',
        assignedDay: '2026-02-10'
      })

      expect(result).toBe(false)
      expect(mockShowError).toHaveBeenCalledWith('content: too long')
      expect(onRefetch).not.toHaveBeenCalled()
    })

    it('shows an error toast and resolves false when updateEntry throws', async () => {
      mockUpdateEntry.mockImplementation(() => {
        throw new Error('write failed')
      })
      const { updateExistingEntry } = createMutations()

      const result = await updateExistingEntry('entry-uuid', { content: 'x' })

      expect(result).toBe(false)
      expect(mockShowError).toHaveBeenCalledWith('write failed')
    })

    it('shows an error toast when the refetch fails', async () => {
      const onRefetch = vi.fn().mockRejectedValue(new Error('refetch failed'))
      const { createNewEntry } = createMutations(onRefetch)

      const result = await createNewEntry({
        content: 'x',
        assignedDay: '2026-02-10'
      })

      expect(result).toBe(false)
      expect(mockShowError).toHaveBeenCalledWith('refetch failed')
    })

    it('resolves true when the mutation and refetch succeed', async () => {
      const { createNewEntry } = createMutations()

      await expect(
        createNewEntry({ content: 'x', assignedDay: '2026-02-10' })
      ).resolves.toBe(true)
      expect(mockShowError).not.toHaveBeenCalled()
    })
  })

  describe('createNewEntry', () => {
    it('calls createEntry with database and input data', async () => {
      const onRefetch = vi.fn().mockResolvedValue(undefined)
      const { createNewEntry } = createMutations(onRefetch)

      const input: CreateEntryInput = {
        content: 'New entry',
        assignedDay: '2026-02-10'
      }

      await createNewEntry(input)

      expect(mockCreateEntry).toHaveBeenCalledWith(mockDatabase, input)
    })

    it('calls onRefetch after successful creation', async () => {
      const onRefetch = vi.fn().mockResolvedValue(undefined)
      const { createNewEntry } = createMutations(onRefetch)

      await createNewEntry({ content: 'Entry', assignedDay: '2026-02-10' })

      expect(onRefetch).toHaveBeenCalledOnce()
    })

    it('calls onRefetch after createEntry executes', async () => {
      const callOrder: string[] = []
      mockCreateEntry.mockImplementation(() => callOrder.push('create'))
      const onRefetch = vi.fn().mockImplementation(() => {
        callOrder.push('refetch')
        return Promise.resolve()
      })
      const { createNewEntry } = createMutations(onRefetch)

      await createNewEntry({ content: 'Entry', assignedDay: '2026-02-10' })

      expect(callOrder).toEqual(['create', 'refetch'])
    })
  })

  describe('updateExistingEntry', () => {
    it('calls updateEntry with database, entryId and update data', async () => {
      const { updateExistingEntry } = createMutations()

      const updateData: UpdateEntryInput = {
        content: 'Updated content',
        assignedDay: '2026-02-11'
      }

      await updateExistingEntry('entry-uuid', updateData)

      expect(mockUpdateEntry).toHaveBeenCalledWith(
        mockDatabase,
        'entry-uuid',
        updateData
      )
    })

    it('calls onRefetch after successful update', async () => {
      const onRefetch = vi.fn().mockResolvedValue(undefined)
      const { updateExistingEntry } = createMutations(onRefetch)

      await updateExistingEntry('entry-uuid', {
        content: 'Updated',
        assignedDay: '2026-02-11'
      })

      expect(onRefetch).toHaveBeenCalledOnce()
    })

    it('calls onRefetch after updateEntry executes', async () => {
      const callOrder: string[] = []
      mockUpdateEntry.mockImplementation(() => callOrder.push('update'))
      const onRefetch = vi.fn().mockImplementation(() => {
        callOrder.push('refetch')
        return Promise.resolve()
      })
      const { updateExistingEntry } = createMutations(onRefetch)

      await updateExistingEntry('entry-uuid', {
        content: 'Updated',
        assignedDay: '2026-02-11'
      })

      expect(callOrder).toEqual(['update', 'refetch'])
    })
  })
})
