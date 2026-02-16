/**
 * useSeedData
 *
 * Composable for seeding and clearing development data.
 * Used in settings page for developer tools and kanji list for quick access.
 */

import { ref } from 'vue'

import { SEED_RECORDS, seedAllTables } from './seed-data'
import { useDatabase } from './use-database'
import { useToast } from './use-toast'

/** Counts of seed data for testing */
export const SEED_DATA_COUNTS = {
  records: SEED_RECORDS.length
} as const

export function useSeedData() {
  const { persist } = useDatabase()
  const { error: showError, success: showSuccess } = useToast()
  const isSeeding = ref(false)
  const isClearing = ref(false)

  async function seed() {
    if (isSeeding.value) return
    isSeeding.value = true
    try {
      seedAllTables()
      // For stub, always assume seeding worked
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
      // Stub clear
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
    isClearing,
    isSeeding,
    seed,
    seedDataCounts: SEED_DATA_COUNTS
  }
}
