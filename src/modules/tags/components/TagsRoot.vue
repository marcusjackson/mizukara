<script setup lang="ts">
/**
 * TagsRoot
 *
 * Root orchestrator for the tags page.
 * Owns activeTagIds filter state and coordinates data fetching,
 * tag mutations, and child section rendering.
 *
 * Layout: Two-column on desktop (browse left, entries right);
 * stacked on mobile.
 */

import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { BaseIconButton } from '@/base/components'

import { ROUTES } from '@/router/routes'
import { useTagMutations } from '../composables/use-tag-mutations'
import { useTags } from '../composables/use-tags'

import TagsSectionBrowse from './TagsSectionBrowse.vue'
import TagsSectionEntries from './TagsSectionEntries.vue'
import TagsSectionStarter from './TagsSectionStarter.vue'
import TagsSectionStatus from './TagsSectionStatus.vue'

// =============================================================================
// Composables
// =============================================================================

const {
  fetchEntriesByTags,
  fetchTags,
  filteredEntries,
  isLoading,
  loadError,
  tags
} = useTags()
const { deleteTag, renameTag } = useTagMutations()

const route = useRoute()
const router = useRouter()

// =============================================================================
// Active filter state — URL-synced via ?tags=id1,id2
// =============================================================================

/**
 * Active tag IDs backed by URL query parameter ?tags.
 * Assigning a new array replaces the URL query, preserving back-navigation.
 */
const activeTagIds = computed({
  get: (): string[] => {
    const param = route.query['tags']
    if (!param) return []
    const ids = Array.isArray(param) ? param : [param]
    return ids.filter((id): id is string => Boolean(id))
  },
  set: (ids: string[]): void => {
    void router.replace({
      query: ids.length > 0 ? { tags: ids } : {}
    })
  }
})

/**
 * Toggle a tag in/out of the active filter.
 * Adding: append to activeTagIds.
 * Removing: splice from activeTagIds.
 */
function handleToggleTag(tagId: string): void {
  const idx = activeTagIds.value.indexOf(tagId)
  if (idx === -1) {
    activeTagIds.value = [...activeTagIds.value, tagId]
  } else {
    activeTagIds.value = activeTagIds.value.filter((id) => id !== tagId)
  }
}

/** Clear the active tag filter (callback for TagsSectionEntries). */
function handleClearFilter(): void {
  activeTagIds.value = []
}

/**
 * Navigate back a step in-app. Prefers browser history (so the originating
 * page/date is preserved) over a fixed link to today's entries, which would
 * silently discard that context. `history.state.back` is only set once
 * vue-router's own navigation has written to it, so this only takes the
 * history branch when the previous entry is actually in-app — unlike
 * `history.length`, which is also incremented by navigation that happened
 * before the app was reached (e.g. an external link into /tags) and would
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

// =============================================================================
// Tag mutations
// =============================================================================

async function handleRenameTag(id: string, name: string): Promise<boolean> {
  const success = await renameTag(id, name)
  if (success) await fetchTags()
  return success
}

async function handleDeleteTag(id: string): Promise<void> {
  const success = await deleteTag(id)
  if (success) {
    // Remove deleted tag from active filter if present
    activeTagIds.value = activeTagIds.value.filter((tid) => tid !== id)
    await fetchTags()
  }
}

// =============================================================================
// Lifecycle & watchers
// =============================================================================

onMounted(() => {
  void fetchTags()
})

/** Nothing to show yet: the first tag load is under way. */
const isInitialLoad = computed(() => isLoading.value && tags.value.length === 0)

watch(
  activeTagIds,
  (ids) => {
    void fetchEntriesByTags(ids)
  },
  { immediate: true }
)
</script>

<template>
  <main class="tags-root">
    <div class="tags-root__header">
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

      <h1 class="tags-root__title">Tags</h1>

      <BaseIconButton
        aria-label="Search"
        :to="ROUTES.SEARCH"
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
          <circle
            cx="11"
            cy="11"
            r="8"
          />
          <line
            x1="21"
            x2="16.65"
            y1="21"
            y2="16.65"
          />
        </svg>
      </BaseIconButton>
    </div>

    <TagsSectionStatus
      v-if="isInitialLoad || loadError"
      :error="loadError"
      @retry="fetchTags"
    />

    <div
      v-else
      class="tags-root__layout"
    >
      <div class="tags-root__browse">
        <TagsSectionBrowse
          :active-tag-ids="activeTagIds"
          :rename-tag="handleRenameTag"
          :tags="tags"
          @delete-tag="handleDeleteTag"
          @toggle-tag="handleToggleTag"
        />
        <TagsSectionStarter
          :tags="tags"
          @tags-added="fetchTags"
        />
      </div>

      <TagsSectionEntries
        :active-tag-ids="activeTagIds"
        class="tags-root__entries"
        :entries="filteredEntries"
        @clear-filter="handleClearFilter"
      />
    </div>
  </main>
</template>

<style scoped>
.tags-root {
  width: 100%;
  max-width: var(--layout-max-width-wide);
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.tags-root__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.tags-root__title {
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.tags-root__layout {
  display: grid;
  grid-template-columns: var(--layout-list-column-width) 1fr;
  gap: var(--spacing-xl);
}

.tags-root__browse {
  min-width: 0;
}

.tags-root__entries {
  min-width: 0;
}

@media (width <= 767px) {
  .tags-root {
    padding: var(--spacing-md);
  }

  .tags-root__layout {
    grid-template-columns: 1fr;
  }
}
</style>
