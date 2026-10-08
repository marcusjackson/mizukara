<script setup lang="ts">
/**
 * EntryDayViewSectionNavigation
 *
 * Section component for day navigation orchestration.
 * Thin wrapper that separates navigation concerns from entry list concerns.
 *
 * Features:
 * - Coordinates day navigation UI
 * - Emits navigation events (no handler props)
 * - Settings link for quick access
 * - No business logic (pure coordination)
 *
 * @example
 * ```vue
 * <EntryDayViewSectionNavigation
 *   :current-date="currentDate"
 *   @prev-day="handlePrevDay"
 *   @next-day="handleNextDay"
 * />
 * ```
 */

import { BaseIcon, BaseIconButton } from '@/base/components'

import { SharedKeyboardShortcutsHelp } from '@/shared/components'

import { ROUTES } from '@/router/routes'

import EntryDayViewNavigator from './EntryDayViewNavigator.vue'

interface Props {
  /** Current date being viewed (ISO string YYYY-MM-DD) */
  currentDate: string
  /** Whether currentDate is today's date */
  isToday: boolean
}

defineProps<Props>()

defineEmits<{
  /** Emitted when user requests previous day */
  'prev-day': []
  /** Emitted when user requests next day */
  'next-day': []
  /** Emitted when user requests date picker */
  'open-date-picker': []
  /** Emitted when user requests to jump to today */
  'go-to-today': []
}>()
</script>

<template>
  <section
    aria-label="Day navigation"
    class="entry-day-view-section-navigation"
  >
    <EntryDayViewNavigator
      :current-date="currentDate"
      @next-day="$emit('next-day')"
      @open-date-picker="$emit('open-date-picker')"
      @prev-day="$emit('prev-day')"
    />

    <div class="entry-day-view-section-actions">
      <BaseIconButton
        v-if="!isToday"
        aria-label="Jump to today"
        @click="$emit('go-to-today')"
      >
        <BaseIcon name="today" />
      </BaseIconButton>
      <SharedKeyboardShortcutsHelp />
      <BaseIconButton
        aria-label="Search"
        :to="ROUTES.SEARCH"
      >
        <BaseIcon name="search" />
      </BaseIconButton>
      <BaseIconButton
        aria-label="Tags"
        :to="ROUTES.TAGS"
      >
        <BaseIcon name="tags" />
      </BaseIconButton>
      <BaseIconButton
        aria-label="Settings"
        :to="ROUTES.SETTINGS"
      >
        <BaseIcon name="settings" />
      </BaseIconButton>
    </div>
  </section>
</template>

<style scoped>
.entry-day-view-section-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-2);
  padding: 0 var(--spacing-4) var(--spacing-2);
}
</style>
