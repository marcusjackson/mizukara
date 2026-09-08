<script setup lang="ts">
/**
 * SearchResultCard
 *
 * One search result: a truncated content snippet, not the full entry.
 * A new presentational treatment distinct from SharedEntryCard (which always
 * renders full content, with no truncation precedent elsewhere in the app).
 * Clicking navigates to the full entry.
 */

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { formatDateMedium } from '@/shared/utils/date-utils'
import { truncateSnippet } from '@/shared/utils/text-utils'

import { buildEntryDayRoute } from '@/router/routes'

import type { Entry } from '@/shared/types/entry-types'

interface Props {
  entry: Entry
}

const props = defineProps<Props>()

const snippet = computed(() => truncateSnippet(props.entry.content))
const formattedDay = computed(() => formatDateMedium(props.entry.assignedDay))
const entryRoute = computed(() => buildEntryDayRoute(props.entry.assignedDay))
</script>

<template>
  <RouterLink
    class="search-result-card"
    data-testid="search-result-card"
    :to="entryRoute"
  >
    <time
      class="search-result-card__day"
      data-testid="search-result-day"
      :datetime="entry.assignedDay"
    >
      {{ formattedDay }}
    </time>
    <p
      class="search-result-card__snippet"
      data-testid="search-result-snippet"
    >
      {{ snippet }}
    </p>
  </RouterLink>
</template>

<style scoped>
.search-result-card {
  display: block;
  padding: var(--spacing-5);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.search-result-card:hover {
  box-shadow: var(--shadow-raised);
}

.search-result-card:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

.search-result-card__day {
  display: block;
  margin-bottom: var(--spacing-2);
  color: var(--color-text-secondary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.search-result-card__snippet {
  margin: 0;
  color: var(--color-text-primary);
  font-family: var(--font-family-serif);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  overflow-wrap: break-word;
  white-space: pre-wrap;
}
</style>
