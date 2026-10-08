<script setup lang="ts">
/**
 * SearchRoot
 *
 * Root orchestrator for the search page. Owns URL-synced applied filters
 * (?q=&tags=&all=&view=&month=) and local staged edits that are only pushed
 * to the URL (and re-queried) on explicit submit — unlike the Tags page's
 * live filter, every search here is a potentially unbounded query, so
 * applying on every keystroke or tag click is deliberately avoided. View and
 * month, by contrast, apply immediately: switching view is just a display
 * change over the already-applied filters, and a month's day-count query is
 * always cheap and bounded. See docs/units/search/atlas.md for why this
 * differs from the Tags page's own live filter.
 */

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { BaseIconButton } from '@/base/components'

import {
  addMonths,
  getToday,
  isValidMonthString
} from '@/shared/utils/date-utils'

import { ROUTES } from '@/router/routes'
import { useSearch } from '../composables/use-search'
import { useSearchTagOptions } from '../composables/use-search-tag-options'
import { toArrayParam, toStringParam } from '../utils/search-query-params'

import SearchSectionCalendar from './SearchSectionCalendar.vue'
import SearchSectionFilters from './SearchSectionFilters.vue'
import SearchSectionResults from './SearchSectionResults.vue'

import type { LocationQueryRaw } from 'vue-router'

// =============================================================================
// Composables
// =============================================================================

const {
  dayCounts,
  entries,
  isLoading,
  isLoadingDayCounts,
  runDayCounts,
  runSearch
} = useSearch()
const { fetchTagOptions, tagOptions } = useSearchTagOptions()

const route = useRoute()
const router = useRouter()

// =============================================================================
// Applied filters — URL-synced via ?q=&tags=&all=&view=&month=
// =============================================================================

const appliedQuery = computed(() => toStringParam(route.query['q']))
const appliedTagIds = computed(() => toArrayParam(route.query['tags']))
const appliedAll = computed(() => toStringParam(route.query['all']) === 'true')
const appliedView = computed<'list' | 'calendar'>(() =>
  toStringParam(route.query['view']) === 'calendar' ? 'calendar' : 'list'
)
/**
 * ?month= is user-editable (bookmarks, hand-edited URLs), unlike the
 * always-zero-padded values addMonths produces internally — an invalid or
 * non-zero-padded value (e.g. "2026-2") falls back to the current month
 * rather than silently producing an empty result set downstream.
 */
const appliedMonth = computed(() => {
  const raw = toStringParam(route.query['month'])
  return raw && isValidMonthString(raw) ? raw : getToday().slice(0, 7)
})

// =============================================================================
// Staged filters — local edits, pushed to the URL only on submit
// =============================================================================

const stagedQuery = ref('')
const stagedTagIds = ref<string[]>([])
const stagedAll = ref(false)

/**
 * Navigate back a step in-app. Prefers browser history (so the originating
 * page/date is preserved) over a fixed link to today's entries, which would
 * silently discard that context. `history.state.back` is only set once
 * vue-router's own navigation has written to it, so this only takes the
 * history branch when the previous entry is actually in-app — unlike
 * `history.length`, which is also incremented by navigation that happened
 * before the app was reached (e.g. an external link into /search) and would
 * otherwise send `router.back()` off the site entirely.
 */
function handleBack(): void {
  const historyState = globalThis.history.state as { back?: string } | null
  if (historyState?.back) {
    router.back()
  } else {
    void router.push(ROUTES.HOME)
  }
}

/** Submit staged filters to the URL, triggering a re-query. */
function handleSubmit(): void {
  const nextQuery: LocationQueryRaw = { ...route.query }

  const trimmedQuery = stagedQuery.value.trim()
  if (trimmedQuery) {
    nextQuery['q'] = trimmedQuery
  } else {
    delete nextQuery['q']
  }

  if (stagedTagIds.value.length > 0) {
    nextQuery['tags'] = stagedTagIds.value
  } else {
    delete nextQuery['tags']
  }

  if (stagedAll.value) {
    nextQuery['all'] = 'true'
  } else {
    delete nextQuery['all']
  }

  void router.replace({ query: nextQuery })
}

// =============================================================================
// View & month — applied immediately, not staged
// =============================================================================

function handleViewChange(nextView: 'list' | 'calendar'): void {
  const nextQuery: LocationQueryRaw = { ...route.query }

  if (nextView === 'list') {
    delete nextQuery['view']
  } else {
    nextQuery['view'] = nextView
  }

  void router.replace({ query: nextQuery })
}

function handleMonthChange(nextMonth: string): void {
  const nextQuery: LocationQueryRaw = { ...route.query, month: nextMonth }
  void router.replace({ query: nextQuery })
}

function handlePrevMonth(): void {
  handleMonthChange(addMonths(appliedMonth.value, -1))
}

function handleNextMonth(): void {
  handleMonthChange(addMonths(appliedMonth.value, 1))
}

// =============================================================================
// Lifecycle & watchers
// =============================================================================

onMounted(() => {
  void fetchTagOptions()
})

// Staged fields follow the applied filters but not the view, so an unsubmitted
// edit survives a view switch. The string key stops appliedTagIds' fresh array
// on every URL change from firing this on a view switch.
watch(
  () =>
    JSON.stringify([appliedQuery.value, appliedTagIds.value, appliedAll.value]),
  () => {
    stagedQuery.value = appliedQuery.value
    stagedTagIds.value = appliedTagIds.value
    stagedAll.value = appliedAll.value
  },
  { immediate: true }
)

watch(
  [appliedQuery, appliedTagIds, appliedAll, appliedView],
  ([query, tagIds, all, view]) => {
    // List view's query is potentially unbounded, so it only runs while list
    // is the active view — switching back to list re-triggers this watcher
    // and catches up on any filter change made while calendar was showing.
    if (view !== 'list') return
    void runSearch({ query, tagIds }, !all)
  },
  { immediate: true }
)

watch(
  [appliedQuery, appliedTagIds, appliedMonth, appliedView],
  ([query, tagIds, month, view]) => {
    if (view !== 'calendar') return
    void runDayCounts({ query, tagIds }, month)
  },
  { immediate: true }
)
</script>

<template>
  <main class="search-root">
    <div class="search-root__header">
      <BaseIconButton
        aria-label="Back"
        @click="handleBack"
      >
        <svg
          aria-hidden="true"
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
          <line
            x1="19"
            x2="5"
            y1="12"
            y2="12"
          />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </BaseIconButton>

      <h1 class="search-root__title">Search</h1>

      <BaseIconButton
        aria-label="Tags"
        :to="ROUTES.TAGS"
      >
        <svg
          aria-hidden="true"
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
          <path
            d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z"
          />
          <circle
            cx="7.5"
            cy="7.5"
            fill="currentColor"
            r="1.5"
            stroke="none"
          />
        </svg>
      </BaseIconButton>
    </div>

    <div class="search-root__layout">
      <SearchSectionFilters
        v-model:query="stagedQuery"
        v-model:show-all="stagedAll"
        v-model:tag-ids="stagedTagIds"
        class="search-root__filters"
        :tag-options="tagOptions"
        :view="appliedView"
        @submit="handleSubmit"
        @update:view="handleViewChange"
      />

      <SearchSectionResults
        v-if="appliedView === 'list'"
        class="search-root__results"
        :entries="entries"
        :has-submitted="Boolean(appliedQuery) || appliedTagIds.length > 0"
        :is-capped="!appliedAll"
        :is-loading="isLoading"
      />

      <SearchSectionCalendar
        v-else
        class="search-root__results"
        :day-counts="dayCounts"
        :is-loading="isLoadingDayCounts"
        :month="appliedMonth"
        @next-month="handleNextMonth"
        @prev-month="handlePrevMonth"
      />
    </div>
  </main>
</template>

<style scoped>
.search-root {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.search-root__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.search-root__title {
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.search-root__layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-xl);
}

.search-root__filters,
.search-root__results {
  min-width: 0;
}

@media (width <= 767px) {
  .search-root {
    padding: var(--spacing-md);
  }

  .search-root__layout {
    grid-template-columns: 1fr;
  }
}
</style>
