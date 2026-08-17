<script setup lang="ts">
/**
 * SharedEntryCardTags
 *
 * Renders the tag chips row on an entry card.
 * Only rendered when the entry has at least one associated tag.
 */

import BaseBadge from '@/base/components/BaseBadge.vue'

import type { Tag } from '@/shared/types/tag-types'

defineProps<{
  /** Tags to display as chips */
  tags: Tag[]
}>()
</script>

<template>
  <div
    class="entry-tags"
    data-testid="entry-tags"
  >
    <BaseBadge
      v-for="tag in tags"
      :key="tag.id"
      size="sm"
      variant="secondary"
    >
      {{ tag.name }}
    </BaseBadge>
  </div>
</template>

<style scoped>
.entry-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  margin-top: var(--spacing-2);
}
</style>
