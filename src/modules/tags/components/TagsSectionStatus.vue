<script setup lang="ts">
/**
 * TagsSectionStatus
 *
 * What the Tags page shows in place of its sections while the first load of
 * tags is under way, or when that load failed.
 */

import { BaseButton, BaseSpinner } from '@/base/components'

interface Props {
  /** Message of the failed load; null while the load is still in progress */
  error: string | null
}

defineProps<Props>()

defineEmits<{
  /** Emitted when the person asks to try the load again */
  retry: []
}>()
</script>

<template>
  <div
    v-if="error"
    class="tags-section-status"
    data-testid="tags-error"
    role="alert"
  >
    <p class="tags-section-status__message">Error loading tags: {{ error }}</p>
    <BaseButton @click="$emit('retry')">Retry</BaseButton>
  </div>

  <output
    v-else
    aria-label="Loading tags"
    aria-live="polite"
    class="tags-section-status"
    data-testid="tags-loading"
  >
    <BaseSpinner />
  </output>
</template>

<style scoped>
.tags-section-status {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-4);
  min-height: 50dvh;
  padding: var(--spacing-6);
}

.tags-section-status__message {
  margin: 0;
  color: var(--color-danger);
  font-family: var(--font-family-sans);
}
</style>
