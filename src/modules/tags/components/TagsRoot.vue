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

import { useTagMutations } from '../composables/use-tag-mutations'
import { useTags } from '../composables/use-tags'

import TagsSectionBrowse from './TagsSectionBrowse.vue'
import TagsSectionEntries from './TagsSectionEntries.vue'

// =============================================================================
// Composables
// =============================================================================

const { fetchEntriesByTags, fetchTags, filteredEntries, tags } = useTags()
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

// =============================================================================
// Tag mutations
// =============================================================================

async function handleRenameTag(id: string, name: string): Promise<void> {
  const success = await renameTag(id, name)
  if (success) await fetchTags()
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
    <h1 class="tags-root__title">Tags</h1>

    <div class="tags-root__layout">
      <TagsSectionBrowse
        :active-tag-ids="activeTagIds"
        class="tags-root__browse"
        :tags="tags"
        @delete-tag="handleDeleteTag"
        @rename-tag="handleRenameTag"
        @toggle-tag="handleToggleTag"
      />

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
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.tags-root__title {
  margin: 0 0 var(--spacing-xl);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.tags-root__layout {
  display: grid;
  grid-template-columns: 320px 1fr;
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
