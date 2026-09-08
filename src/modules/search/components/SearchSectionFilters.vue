<script setup lang="ts">
/**
 * SearchSectionFilters
 *
 * Text query, tag combobox, "Show all results" toggle, and the list/calendar
 * view switch for the search page. The query/tags/show-all fields are staged
 * locally by the parent (via v-model) and only take effect on explicit
 * submit — Enter in the text field or the Search button — never live
 * as-you-type or as-you-click. The view toggle is the one exception: it
 * emits update:view immediately on click, since switching view is a cheap
 * display change over the already-applied filters, not a new query.
 */

import { BaseButton, BaseInput, BaseSwitch } from '@/base/components'
import BaseTagInput from '@/base/components/BaseTagInput.vue'

import type { TagInputOption } from '@/shared/types/tag-types'

// =============================================================================
// Props & Emits
// =============================================================================

interface Props {
  /** Tag options for the tag filter combobox */
  tagOptions: TagInputOption[]
  /** Currently displayed result view — applied immediately, not staged */
  view: 'list' | 'calendar'
}

defineProps<Props>()

const emit = defineEmits<{
  submit: []
  'update:view': ['list' | 'calendar']
}>()

const query = defineModel<string>('query', { default: '' })
const tagIds = defineModel<string[]>('tagIds', { default: () => [] })
const showAll = defineModel<boolean>('showAll', { default: false })

// =============================================================================
// Handlers
// =============================================================================

function handleQueryKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    emit('submit')
  }
}
</script>

<template>
  <section
    aria-label="Search filters"
    class="search-section-filters"
  >
    <BaseInput
      v-model="query"
      label="Search text"
      placeholder="Search entries..."
      @keydown="handleQueryKeydown"
    />

    <BaseTagInput
      v-model="tagIds"
      :allow-create="false"
      label="Tags"
      :options="tagOptions"
      placeholder="Filter by tags..."
    />

    <BaseSwitch
      v-model="showAll"
      class="search-section-filters__toggle"
      label="Show all results"
    />

    <BaseButton
      class="search-section-filters__submit"
      type="button"
      @click="emit('submit')"
    >
      Search
    </BaseButton>

    <div
      aria-label="Result view"
      class="search-section-filters__view-toggle"
    >
      <button
        :aria-pressed="view === 'list'"
        class="search-section-filters__view-button"
        :class="{
          'search-section-filters__view-button--active': view === 'list'
        }"
        type="button"
        @click="emit('update:view', 'list')"
      >
        List
      </button>
      <button
        :aria-pressed="view === 'calendar'"
        class="search-section-filters__view-button"
        :class="{
          'search-section-filters__view-button--active': view === 'calendar'
        }"
        type="button"
        @click="emit('update:view', 'calendar')"
      >
        Calendar
      </button>
    </div>
  </section>
</template>

<style scoped>
.search-section-filters {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.search-section-filters__toggle {
  margin-top: var(--spacing-xs);
}

.search-section-filters__submit {
  align-self: flex-start;
}

.search-section-filters__view-toggle {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.search-section-filters__view-button {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.search-section-filters__view-button:hover {
  background: var(--color-surface-hover);
}

.search-section-filters__view-button:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

.search-section-filters__view-button--active {
  background: var(--color-surface);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
}
</style>
