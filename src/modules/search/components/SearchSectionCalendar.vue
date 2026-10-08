<script setup lang="ts">
/**
 * SearchSectionCalendar
 *
 * Calendar view of search results — a hand-rolled month grid (no calendar
 * library; see docs/units/search/atlas.md for why not reka-ui's Calendar),
 * each day cell showing a match-count badge. Prev/next-month navigation
 * re-queries immediately, independent of the text/tag submit gating that
 * governs list view — a single month's day-count query is always cheap and
 * bounded.
 */

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { BaseSpinner } from '@/base/components'

import {
  formatMonthYear,
  getMonthGrid,
  getToday,
  parseMonthString
} from '@/shared/utils/date-utils'

import { buildEntryDayRoute } from '@/router/routes'

import type { DayCount } from '@/api/search'

// =============================================================================
// Props & Emits
// =============================================================================

interface Props {
  /** Per-day match counts for the currently viewed month */
  dayCounts: DayCount[]
  /** Month being viewed, as a YYYY-MM string */
  month: string
  /** True while a day-count query is in progress */
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'prev-month': []
  'next-month': []
}>()

// =============================================================================
// Constants
// =============================================================================

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// =============================================================================
// Derived state
// =============================================================================

const monthLabel = computed(() => formatMonthYear(props.month))

const countsByDay = computed(() => {
  const map = new Map<string, number>()
  for (const { assignedDay, count } of props.dayCounts) {
    map.set(assignedDay, count)
  }
  return map
})

const weeks = computed(() => {
  const { month, year } = parseMonthString(props.month)
  return getMonthGrid(year, month)
})

const today = getToday()

function countFor(date: string): number {
  return countsByDay.value.get(date) ?? 0
}
</script>

<template>
  <section
    aria-label="Search calendar"
    class="search-section-calendar"
  >
    <div class="search-section-calendar__header">
      <button
        aria-label="Previous month"
        class="search-section-calendar__nav-button"
        type="button"
        @click="emit('prev-month')"
      >
        ←
      </button>

      <h2 class="search-section-calendar__month">{{ monthLabel }}</h2>

      <button
        aria-label="Next month"
        class="search-section-calendar__nav-button"
        type="button"
        @click="emit('next-month')"
      >
        →
      </button>
    </div>

    <output
      v-if="isLoading"
      aria-label="Loading calendar"
      aria-live="polite"
      class="search-section-calendar__loading"
      data-testid="calendar-loading"
    >
      <BaseSpinner />
    </output>

    <table
      v-else
      class="search-section-calendar__grid"
      data-testid="calendar-grid"
    >
      <thead>
        <tr>
          <th
            v-for="label in WEEKDAY_LABELS"
            :key="label"
            scope="col"
          >
            {{ label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(week, weekIndex) in weeks"
          :key="weekIndex"
        >
          <td
            v-for="(date, dayIndex) in week"
            :key="dayIndex"
            class="search-section-calendar__cell"
          >
            <RouterLink
              v-if="date"
              class="search-section-calendar__day"
              :class="{
                'search-section-calendar__day--today': date === today
              }"
              data-testid="calendar-day"
              :to="buildEntryDayRoute(date)"
            >
              <span class="search-section-calendar__day-number">{{
                Number(date.slice(-2))
              }}</span>
              <span
                v-if="countFor(date) > 0"
                class="search-section-calendar__day-badge"
                data-testid="calendar-day-badge"
              >
                {{ countFor(date) }}
              </span>
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.search-section-calendar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.search-section-calendar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-section-calendar__month {
  margin: 0;
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.search-section-calendar__nav-button {
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
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.search-section-calendar__nav-button:hover {
  background: var(--color-background);
}

.search-section-calendar__nav-button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.search-section-calendar__loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.search-section-calendar__grid {
  width: 100%;
  border-collapse: collapse;
}

.search-section-calendar__grid th {
  padding: var(--spacing-xs);
  color: var(--color-text-muted);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.search-section-calendar__cell {
  padding: var(--spacing-xs);
  text-align: center;
  vertical-align: top;
}

.search-section-calendar__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  box-sizing: border-box;
  min-width: 44px;
  min-height: 44px;
  padding: var(--spacing-xs);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  text-decoration: none;
  transition: background-color var(--transition-fast);
}

.search-section-calendar__day:hover {
  background: var(--color-background);
}

.search-section-calendar__day:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

.search-section-calendar__day--today {
  border-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.search-section-calendar__day-number {
  font-size: var(--font-size-sm);
}

.search-section-calendar__day-badge {
  padding: 0 var(--spacing-1);
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}
</style>
