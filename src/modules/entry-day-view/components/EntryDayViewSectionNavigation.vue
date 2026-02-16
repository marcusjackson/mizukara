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

import { RouterLink } from 'vue-router'

import { SharedKeyboardShortcutsHelp } from '@/shared/components'

import { ROUTES } from '@/router/routes'

import EntryDayViewNavigator from './EntryDayViewNavigator.vue'

interface Props {
  /** Current date being viewed (ISO string YYYY-MM-DD) */
  currentDate: string
}

defineProps<Props>()

defineEmits<{
  /** Emitted when user requests previous day */
  'prev-day': []
  /** Emitted when user requests next day */
  'next-day': []
  /** Emitted when user requests date picker */
  'open-date-picker': []
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
      <SharedKeyboardShortcutsHelp />
      <RouterLink
        aria-label="Settings"
        class="settings-link"
        :to="ROUTES.SETTINGS"
      >
        <svg
          aria-hidden="true"
          class="settings-icon"
          fill="none"
          height="20"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="3"
          />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </svg>
      </RouterLink>
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

.settings-link {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.settings-link:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.settings-link:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.settings-icon {
  display: block;
}
</style>
