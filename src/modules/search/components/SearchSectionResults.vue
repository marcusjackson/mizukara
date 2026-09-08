<script setup lang="ts">
/**
 * SearchSectionResults
 *
 * List view of search results — one truncated-snippet card per result.
 * A new component, not a reuse of TagsSectionEntries.vue: module isolation
 * forbids importing a tags-module component from the search module, and
 * neither TagsSectionEntries.vue nor SharedEntryCard fit this shape
 * (full-content rendering, no submit-staged filter state).
 */

import { computed } from 'vue'

import { BaseSpinner } from '@/base/components'

import SearchResultCard from './SearchResultCard.vue'

import type { Entry } from '@/shared/types/entry-types'

// =============================================================================
// Props
// =============================================================================

interface Props {
  /** Entries matching the currently applied (submitted) filters */
  entries: Entry[]
  /** True while a search is in progress */
  isLoading: boolean
  /** True once a text query or tag filter has been submitted at least once */
  hasSubmitted: boolean
}

const props = defineProps<Props>()

// =============================================================================
// Derived state
// =============================================================================

const hasEntries = computed(() => props.entries.length > 0)
</script>

<template>
  <section
    aria-label="Search results"
    class="search-section-results"
  >
    <h2 class="search-section-results__title">Results</h2>

    <output
      v-if="isLoading"
      aria-label="Searching"
      aria-live="polite"
      class="search-section-results__loading"
      data-testid="results-loading"
    >
      <BaseSpinner />
    </output>

    <p
      v-else-if="!hasSubmitted"
      class="search-section-results__empty"
      data-testid="empty-no-submit"
    >
      Enter a search term or select tags, then press Search.
    </p>

    <p
      v-else-if="!hasEntries"
      class="search-section-results__empty"
      data-testid="empty-no-results"
    >
      No entries found.
    </p>

    <ol
      v-else
      class="search-section-results__list"
    >
      <li
        v-for="entry in props.entries"
        :key="entry.id"
        class="search-section-results__item"
      >
        <SearchResultCard :entry="entry" />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.search-section-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.search-section-results__title {
  margin: 0;
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.search-section-results__loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.search-section-results__empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.search-section-results__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
