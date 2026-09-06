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
      <button
        v-if="!isToday"
        aria-label="Jump to today"
        class="today-button"
        type="button"
        @click="$emit('go-to-today')"
      >
        <svg
          aria-hidden="true"
          class="today-icon"
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
          <rect
            height="18"
            rx="2"
            width="18"
            x="3"
            y="4"
          />
          <line
            x1="16"
            x2="16"
            y1="2"
            y2="6"
          />
          <line
            x1="8"
            x2="8"
            y1="2"
            y2="6"
          />
          <line
            x1="3"
            x2="21"
            y1="10"
            y2="10"
          />
          <circle
            cx="12"
            cy="15"
            fill="currentColor"
            r="1.5"
            stroke="none"
          />
        </svg>
      </button>
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

.settings-link,
.today-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.settings-link:hover,
.today-button:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.settings-link:focus-visible,
.today-button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.settings-icon,
.today-icon {
  display: block;
}
</style>
