/**
 * useSeedData
 *
 * Composable for seeding and clearing development data.
 * Used in settings page for developer tools and kanji list for quick access.
 */

import { readonly, ref } from 'vue'

import { SEED_RECORDS, seedAllTables } from './seed-data'
import { useDatabase } from './use-database'
import { useToast } from './use-toast'

import type { DeepReadonly, Ref } from 'vue'

/** Counts of seed data for testing */
export const SEED_DATA_COUNTS = {
  records: SEED_RECORDS.length
} as const

export interface UseSeedDataReturn {
  /** Whether a seed operation is currently in progress */
  isSeeding: DeepReadonly<Ref<boolean>>
  /** Whether a clear operation is currently in progress */
  isClearing: DeepReadonly<Ref<boolean>>
  /** Seed all tables with development data */
  seed: () => Promise<void>
  /** Clear all entries from the database */
  clear: () => Promise<void>
  /** Counts of available seed records per table */
  seedDataCounts: typeof SEED_DATA_COUNTS
}

/**
 * Composable for seeding and clearing development data.
 *
 * Used in settings page for developer tools.
 * Note: when no seed data is configured, `seed()` will report
 * that no data is available rather than showing a misleading success.
 *
 * @returns Seeding/clearing actions and loading state
 * @example
 * const { seed, clear, isSeeding } = useSeedData()
 * await seed()
 */
export function useSeedData(): UseSeedDataReturn {
  const { persist, run } = useDatabase()
  const { error: showError, info: showInfo, success: showSuccess } = useToast()
  const isSeeding = ref(false)
  const isClearing = ref(false)

  async function seed() {
    if (isSeeding.value) return
    isSeeding.value = true
    try {
      if (SEED_DATA_COUNTS.records === 0) {
        showInfo('No seed data available')
        return
      }
      seedAllTables()
      await persist()
      showSuccess('Seed data loaded')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to seed data')
    } finally {
      isSeeding.value = false
    }
  }

  async function clear() {
    if (isClearing.value) return
    isClearing.value = true
    try {
      run('DELETE FROM entries')
      await persist()
      showSuccess('All data cleared')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to clear data')
    } finally {
      isClearing.value = false
    }
  }

  return {
    clear,
    isClearing: readonly(isClearing),
    isSeeding: readonly(isSeeding),
    seed,
    seedDataCounts: SEED_DATA_COUNTS
  }
}
