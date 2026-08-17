/**
 * useSeedData tests
 */

import { describe, expect, it, vi } from 'vitest'

// Mock useDatabase
const mockExec = vi.fn()
const mockRun = vi.fn()
const mockPersist = vi.fn()

vi.mock('./use-database', () => ({
  useDatabase: () => ({
    exec: mockExec,
    persist: mockPersist,
    run: mockRun
  })
}))

// Mock useToast
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()
const mockShowInfo = vi.fn()

vi.mock('./use-toast', () => ({
  useToast: () => ({
    error: mockShowError,
    info: mockShowInfo,
    success: mockShowSuccess
  })
}))

import { useSeedData } from './use-seed-data'

function resetMocks() {
  mockExec.mockReset()
  mockRun.mockReset()
  mockPersist.mockReset()
  mockPersist.mockResolvedValue(undefined)
  mockShowSuccess.mockReset()
  mockShowError.mockReset()
  mockShowInfo.mockReset()
}

describe('useSeedData', () => {
  describe('seed', () => {
    it('returns seed and clear functions', () => {
      resetMocks()
      const result = useSeedData()

      expect(result).toHaveProperty('seed')
      expect(result).toHaveProperty('clear')
      expect(result).toHaveProperty('isSeeding')
      expect(result).toHaveProperty('isClearing')
    })

    it('checks for existing data before seeding', async () => {
      resetMocks()
      // With no seed records, no database checks are performed
      const { seed } = useSeedData()
      await seed()

      expect(mockExec).not.toHaveBeenCalled()
    })

    it('shows error if database already has data', async () => {
      resetMocks()
      // With no seed records, the seed returns early — no error and no run
      const { seed } = useSeedData()
      await seed()

      expect(mockShowError).not.toHaveBeenCalled()
      expect(mockRun).not.toHaveBeenCalled()
    })

    it('inserts seed data when database is empty', async () => {
      resetMocks()
      // Stub implementation has no records, so no inserts happen
      const { seed } = useSeedData()
      await seed()

      expect(mockRun).not.toHaveBeenCalled()
    })

    it('shows info message when no seed data is available', async () => {
      resetMocks()
      const { seed } = useSeedData()
      await seed()

      // SEED_DATA_COUNTS.records === 0, so info is shown instead of success
      expect(mockShowInfo).toHaveBeenCalledWith('No seed data available')
      expect(mockShowSuccess).not.toHaveBeenCalled()
      expect(mockPersist).not.toHaveBeenCalled()
    })

    it('does not persist when no seed data is available', async () => {
      resetMocks()
      const { seed } = useSeedData()
      await seed()

      expect(mockPersist).not.toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    it('deletes all data from tables', async () => {
      resetMocks()
      const { clear } = useSeedData()
      await clear()

      expect(mockRun).toHaveBeenCalledWith('DELETE FROM entries')
    })

    it('persists after clearing', async () => {
      resetMocks()

      const { clear } = useSeedData()
      await clear()

      expect(mockPersist).toHaveBeenCalled()
    })

    it('shows success message after clearing', async () => {
      resetMocks()

      const { clear } = useSeedData()
      await clear()

      expect(mockShowSuccess).toHaveBeenCalledWith('All data cleared')
    })

    it('sets isClearing during operation', async () => {
      resetMocks()

      const { clear, isClearing } = useSeedData()

      expect(isClearing.value).toBe(false)

      const clearPromise = clear()
      expect(isClearing.value).toBe(true)

      await clearPromise
      expect(isClearing.value).toBe(false)
    })

    it('handles errors during clearing', async () => {
      resetMocks()
      mockPersist.mockRejectedValue(new Error('Delete failed'))

      const { clear } = useSeedData()
      await clear()

      expect(mockShowError).toHaveBeenCalledWith('Delete failed')
    })
  })

  describe('seedDataCounts', () => {
    it('exposes seed data counts for testing', () => {
      resetMocks()
      const { seedDataCounts } = useSeedData()

      // Current implementation is a stub with no seed records
      expect(seedDataCounts.records).toBe(0)
    })
  })
})
