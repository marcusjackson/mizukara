<script setup lang="ts">
/**
 * EntryDayViewRoot — root orchestrator for the day view.
 * Coordinates navigation, shortcuts, loading/error states, and data refetching.
 */

import { onMounted, ref, watch } from 'vue'

import { useTags } from '@/modules/tags/composables/use-tags'
import { useDayNavigation } from '../composables/use-day-navigation'
import { useEntryDayViewQueries } from '../composables/use-entry-day-view-queries'
import { useEntryDayViewShortcuts } from '../composables/use-entry-day-view-shortcuts'

import EntryDayViewDatePicker from './EntryDayViewDatePicker.vue'
import EntryDayViewSectionList from './EntryDayViewSectionList.vue'
import EntryDayViewSectionNavigation from './EntryDayViewSectionNavigation.vue'

interface Props {
  /** Initial date from route param (ISO string YYYY-MM-DD) or null for today */
  initialDate?: string | null
}

const props = defineProps<Props>()

// Tags
const { fetchTags, tagOptions } = useTags()

// Day navigation
const { currentDate, goToNextDay, goToPrevDay } = useDayNavigation({
  initialDate: props.initialDate ?? null
})

// Entry data
const { entries, entryTagsMap, error, fetchEntries, isLoading } =
  useEntryDayViewQueries(currentDate)

// Date picker state
const datePickerOpen = ref(false)

// Template refs
const sectionListRef = ref<InstanceType<typeof EntryDayViewSectionList> | null>(
  null
)

const refetchEntries = (): Promise<void> => {
  fetchEntries()
  void fetchTags()
  return Promise.resolve()
}

/** Focus the create form textarea */
const focusCreateForm = () => {
  sectionListRef.value?.focusCreateForm()
}

/** Handle save action — delegates to active editor or create form */
const handleSave = () => {
  sectionListRef.value?.handleGlobalSave()
}

/** Handle escape — closes date picker if open, otherwise delegates to section list */
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
  void fetchTags()
})

useEntryDayViewShortcuts({
  focusCreateForm,
  goToNextDay,
  goToPrevDay,
  handleOpenDatePicker,
  handleSave,
  handleEscape
})
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
        :all-tags="tagOptions"
        :current-date="currentDate"
        :entry-tags-map="entryTagsMap"
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
  min-height: 100dvh;
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
