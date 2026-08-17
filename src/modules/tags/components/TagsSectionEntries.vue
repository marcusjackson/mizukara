<script setup lang="ts">
/**
 * TagsSectionEntries
 *
 * Section component displaying filtered entries by the active tag selection.
 * Uses SharedEntryCard in read-only mode.
 *
 * - Empty state when no tags are selected
 * - Empty state when selected tags yield no matching entries
 * - Clear filter action when at least one tag is active
 *
 * Includes `searchQuery` prop reserved for future text-search composition (req 4.6).
 */

import { computed } from 'vue'

import SharedEntryCard from '@/shared/components/SharedEntryCard.vue'

import type { Entry } from '@/shared/types/entry-types'

// =============================================================================
// Props & Emits
// =============================================================================

interface Props {
  /** Entries matching the active tag filter */
  entries: Entry[]
  /** IDs of currently selected filter tags */
  activeTagIds: string[]
  /** Reserved for future text-search composition */
  searchQuery?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'clear-filter': []
}>()

// =============================================================================
// Derived state
// =============================================================================

const hasActiveFilter = computed(() => props.activeTagIds.length > 0)
const hasEntries = computed(() => props.entries.length > 0)
</script>

<template>
  <section
    aria-label="Filtered entries"
    class="tags-section-entries"
  >
    <div class="tags-section-entries__header">
      <h2 class="tags-section-entries__title">Entries</h2>

      <button
        v-if="hasActiveFilter"
        class="tags-section-entries__clear-btn"
        data-testid="clear-filter-btn"
        type="button"
        @click="emit('clear-filter')"
      >
        Clear filter
      </button>
    </div>

    <!-- No filter active -->
    <p
      v-if="!hasActiveFilter"
      class="tags-section-entries__empty"
      data-testid="empty-no-filter"
    >
      Select a tag to filter entries.
    </p>

    <!-- Filter active but no results -->
    <p
      v-else-if="!hasEntries"
      class="tags-section-entries__empty"
      data-testid="empty-no-results"
    >
      No entries found for the selected tags.
    </p>

    <!-- Entry list -->
    <ol
      v-else
      class="tags-section-entries__list"
    >
      <li
        v-for="entry in props.entries"
        :key="entry.id"
        class="tags-section-entries__item"
      >
        <SharedEntryCard
          :entry="entry"
          :show-edit-button="false"
        />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.tags-section-entries {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.tags-section-entries__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags-section-entries__title {
  margin: 0;
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.tags-section-entries__clear-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.tags-section-entries__clear-btn:hover {
  background-color: var(--color-bg-muted);
  color: var(--color-text-primary);
}

.tags-section-entries__clear-btn:focus-visible {
  border-radius: var(--radius-sm);
  box-shadow: var(--focus-ring);
  outline: none;
}

.tags-section-entries__empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.tags-section-entries__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
