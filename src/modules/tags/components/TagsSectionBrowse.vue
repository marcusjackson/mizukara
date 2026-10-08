<script setup lang="ts">
/**
 * TagsSectionBrowse
 *
 * Section component for browsing and managing tags.
 * Displays all tags with entry counts; each row handles its own
 * rename and delete state via TagsSectionBrowseRow.
 *
 * @emits toggle-tag  - User clicked a tag to add/remove it from the active filter
 * @emits delete-tag  - User confirmed deletion of a tag
 */

import TagsSectionBrowseRow from './TagsSectionBrowseRow.vue'

import type { TagWithCount } from '@/shared/types/tag-types'

// =============================================================================
// Props & Emits
// =============================================================================

const props = defineProps<{
  /** All tags with association counts */
  tags: TagWithCount[]
  /** IDs of currently selected filter tags */
  activeTagIds: string[]
  /** Apply a rename (id, trimmed new name); resolves true when it succeeded */
  renameTag: (id: string, name: string) => Promise<boolean>
}>()

const emit = defineEmits<{
  'toggle-tag': [tagId: string]
  'delete-tag': [id: string]
}>()
</script>

<template>
  <section
    aria-label="Tags"
    class="tags-section-browse"
  >
    <h2 class="tags-section-browse__title">Tags</h2>

    <p
      v-if="props.tags.length === 0"
      class="tags-section-browse__empty"
      data-testid="tags-empty-state"
    >
      No tags yet
    </p>

    <ul
      v-else
      class="tags-section-browse__list"
    >
      <TagsSectionBrowseRow
        v-for="tag in props.tags"
        :key="tag.id"
        :is-active="props.activeTagIds.includes(tag.id)"
        :rename="(name) => props.renameTag(tag.id, name)"
        :tag="tag"
        @delete="emit('delete-tag', tag.id)"
        @toggle="emit('toggle-tag', tag.id)"
      />
    </ul>
  </section>
</template>

<style scoped>
.tags-section-browse {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.tags-section-browse__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.tags-section-browse__empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.tags-section-browse__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
