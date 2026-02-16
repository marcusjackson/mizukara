<script setup lang="ts">
/**
 * EntryDayViewRoot
 *
 * Root orchestration component for day view.
 *
 * Features:
 * - Fetches entries for currently selected day
 * - Coordinates navigation state with sections
 * - Registers global keyboard shortcuts
 * - Handles loading and error states
 * - Provides refetch callback for mutations
 *
 * @example
 * ```vue
 * <EntryDayViewRoot :initial-date="'2026-02-10'" />
 * ```
 */

import { onMounted, ref, watch } from 'vue'

import { findByDay } from '@/api/entries/entry-queries'

import { useDatabase } from '@/shared/composables/use-database'
import { useKeyboardShortcuts } from '@/shared/composables/use-keyboard-shortcuts'

import { useDayNavigation } from '../composables/use-day-navigation'

import EntryDayViewDatePicker from './EntryDayViewDatePicker.vue'
import EntryDayViewSectionList from './EntryDayViewSectionList.vue'
import EntryDayViewSectionNavigation from './EntryDayViewSectionNavigation.vue'

import type { Entry } from '@/shared/types/entry-types'

interface Props {
  /** Initial date from route param (ISO string YYYY-MM-DD) or null for today */
  initialDate?: string | null
}

const props = defineProps<Props>()

// Database access
const { database: db } = useDatabase()

// Day navigation
const { currentDate, goToNextDay, goToPrevDay } = useDayNavigation({
  initialDate: props.initialDate ?? null
})

// Entry list state
const entries = ref<Entry[]>([])
const isLoading = ref(true)
const error = ref<Error | null>(null)

// Date picker state
const datePickerOpen = ref(false)

// Template refs
const sectionListRef = ref<InstanceType<typeof EntryDayViewSectionList> | null>(
  null
)

/**
 * Fetch entries for the current date
 */
const fetchEntries = () => {
  const database = db.value
  if (!database) {
    error.value = new Error('Database not initialized')
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    error.value = null
    entries.value = findByDay(database, currentDate.value)
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(String(err))
    entries.value = []
  } finally {
    isLoading.value = false
  }
}

const refetchEntries = (): Promise<void> => {
  fetchEntries()
  return Promise.resolve()
}

/**
 * Focus the create form textarea
 *
 * Uses template ref to access child component method.
 * Preferred over DOM querying for maintainability and type safety.
 */
const focusCreateForm = () => {
  sectionListRef.value?.focusCreateForm()
}

/**
 * Handle save action (context-aware)
 * Delegates to section list component which knows about form context
 */
const handleSave = () => {
  sectionListRef.value?.handleGlobalSave()
}

/**
 * Handle escape action (context-aware)
 * Closes date picker if open, otherwise delegates to section list
 */
const handleEscape = () => {
  if (datePickerOpen.value) {
    datePickerOpen.value = false
    return
  }
  sectionListRef.value?.handleGlobalEscape()
}

/** Open date picker dialog */
const handleOpenDatePicker = () => {
  datePickerOpen.value = true
}

/** Navigate to selected date and close picker */
const handleDateSelected = (date: string) => {
  datePickerOpen.value = false
  currentDate.value = date
}

/** Close date picker without navigation */
const handleDatePickerClose = () => {
  datePickerOpen.value = false
}

// Watch for date changes and refetch
watch(currentDate, () => {
  fetchEntries()
})

// Initial fetch on mount
onMounted(() => {
  fetchEntries()
})

// Register keyboard shortcuts
useKeyboardShortcuts([
  {
    key: 'cmd+n',
    handler: focusCreateForm,
    preventDefault: true
  },
  {
    key: 'j',
    handler: goToNextDay,
    preventDefault: true
  },
  {
    key: 'k',
    handler: goToPrevDay,
    preventDefault: true
  },
  {
    key: 'arrowdown',
    handler: goToNextDay,
    preventDefault: true
  },
  {
    key: 'arrowup',
    handler: goToPrevDay,
    preventDefault: true
  },
  {
    key: 'g',
    handler: handleOpenDatePicker,
    preventDefault: true
  },
  {
    key: 'cmd+s',
    handler: handleSave,
    preventDefault: true
  },
  {
    key: 'escape',
    handler: handleEscape,
    preventDefault: false
  }
])
</script>

<template>
  <div class="entry-day-view-root">
    <!-- Loading State -->
    <output
      v-if="isLoading && entries.length === 0"
      aria-label="Loading entries"
      aria-live="polite"
      class="loading-container"
    >
      <div class="loading-spinner"></div>
    </output>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-container"
      data-testid="error-container"
      role="alert"
    >
      <p class="error-message">
        Error loading entries: {{ error?.message || 'Unknown error' }}
      </p>
      <button
        class="retry-button"
        type="button"
        @click="refetchEntries"
      >
        Retry
      </button>
    </div>

    <!-- Main Content -->
    <div
      v-else
      class="content-container"
    >
      <EntryDayViewSectionNavigation
        :current-date="currentDate"
        @next-day="goToNextDay"
        @open-date-picker="handleOpenDatePicker"
        @prev-day="goToPrevDay"
      />

      <EntryDayViewSectionList
        ref="sectionListRef"
        :current-date="currentDate"
        :items="entries"
        :on-refetch="refetchEntries"
      />

      <EntryDayViewDatePicker
        :initial-date="currentDate"
        :open="datePickerOpen"
        @close="handleDatePickerClose"
        @date-selected="handleDateSelected"
      />
    </div>
  </div>
</template>

<style scoped>
.entry-day-view-root {
  min-height: 100vh;
  background: var(--color-background);
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-4);
  min-height: 400px;
  padding: var(--spacing-6);
}

.error-message {
  color: var(--color-danger);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-md);
  text-align: center;
}

.retry-button {
  padding: var(--spacing-3) var(--spacing-5);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.retry-button:hover {
  background: var(--color-primary-hover);
}

.retry-button:active {
  background: var(--color-primary-active);
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}
</style>
