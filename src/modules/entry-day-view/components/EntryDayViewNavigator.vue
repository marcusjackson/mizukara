<script setup lang="ts">
/**
 * EntryDayViewNavigator
 *
 * Navigation component for browsing between different days.
 * Displays current date with responsive formatting and provides
 * previous/next day navigation buttons.
 *
 * Features:
 * - Responsive date display (long format on desktop, medium on mobile)
 * - CSS-based responsive behavior (no JS for breakpoints)
 * - Keyboard accessible navigation
 * - Sticky positioning on mobile
 *
 * @emits prev-day - Emitted when Previous Day button is clicked
 * @emits next-day - Emitted when Next Day button is clicked
 * @emits open-date-picker - Emitted when date display is clicked to open date picker
 *
 * @example
 * ```vue
 * <EntryDayViewNavigator
 *   :current-date="currentDate"
 *   @prev-day="goToPreviousDay"
 *   @next-day="goToNextDay"
 *   @open-date-picker="openDatePicker"
 * />
 * ```
 */

import { computed } from 'vue'

import { formatDateLong, formatDateMedium } from '@/shared/utils/date-utils'

interface Props {
  /** Current date being viewed (ISO string YYYY-MM-DD) */
  currentDate: string
}

interface Emits {
  /** Emitted when previous day button is clicked */
  'prev-day': []
  /** Emitted when next day button is clicked */
  'next-day': []
  /** Emitted when date picker trigger is clicked */
  'open-date-picker': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handlePrevDay = () => {
  emit('prev-day')
}

const handleNextDay = () => {
  emit('next-day')
}

const handleOpenDatePicker = () => {
  emit('open-date-picker')
}

/**
 * Pre-compute both date formats for responsive display.
 * CSS media queries control which version is visible.
 */
const dateLong = computed(() => formatDateLong(props.currentDate))
const dateMedium = computed(() => formatDateMedium(props.currentDate))
</script>

<template>
  <nav
    aria-label="Day navigation"
    class="entry-day-view-navigator"
    data-testid="entry-day-view-navigator"
  >
    <button
      aria-label="Previous day"
      class="nav-button prev-button"
      type="button"
      @click="handlePrevDay"
    >
      ←
    </button>

    <button
      aria-label="Jump to date"
      class="current-date"
      data-testid="current-date"
      type="button"
      @click="handleOpenDatePicker"
    >
      <span class="date-desktop">{{ dateLong }}</span>
      <span class="date-mobile">{{ dateMedium }}</span>
      <span
        aria-hidden="true"
        class="date-picker-icon"
        >▼</span
      >
    </button>

    <button
      aria-label="Next day"
      class="nav-button next-button"
      type="button"
      @click="handleNextDay"
    >
      →
    </button>
  </nav>
</template>

<style scoped>
.entry-day-view-navigator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.nav-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-normal);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.nav-button:hover {
  background: var(--color-background);
}

.nav-button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.current-date {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.current-date:hover {
  background: var(--color-background);
}

.current-date:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.date-picker-icon {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.date-mobile {
  display: none;
}

.date-desktop {
  display: inline;
}

/* Mobile responsive adjustments */
@media (width <= 767px) {
  .entry-day-view-navigator {
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .current-date {
    font-size: var(--font-size-base);
  }

  .date-desktop {
    display: none;
  }

  .date-mobile {
    display: inline;
  }
}
</style>
