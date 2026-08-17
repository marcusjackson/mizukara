<script setup lang="ts">
/**
 * TagsSectionBrowseRow
 *
 * A single tag row in the tags browse section.
 * Manages its own inline rename and delete confirmation state.
 *
 * @emits toggle  - User clicked the tag toggle button
 * @emits rename  - User confirmed a rename with the trimmed new name
 * @emits delete  - User confirmed deletion
 */

import { nextTick, ref, watch } from 'vue'

import { BaseButton } from '@/base/components'

import SharedConfirmDialog from '@/shared/components/SharedConfirmDialog.vue'

import type { TagWithCount } from '@/shared/types/tag-types'

// =============================================================================
// Props & Emits
// =============================================================================

const props = defineProps<{
  /** Tag data with association count */
  tag: TagWithCount
  /** Whether this tag is currently active (selected as filter) */
  isActive: boolean
}>()

const emit = defineEmits<{
  toggle: []
  rename: [name: string]
  delete: []
}>()

// =============================================================================
// Rename state
// =============================================================================

const isRenaming = ref(false)
const renameValue = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

watch(isRenaming, async (renaming) => {
  if (renaming) {
    await nextTick()
    renameInputRef.value?.focus()
  }
})

function startRename(): void {
  isRenaming.value = true
  renameValue.value = props.tag.name
}

function confirmRename(): void {
  const trimmed = renameValue.value.trim()
  if (!trimmed) return

  emit('rename', trimmed)
  isRenaming.value = false
}

function handleRenameKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    confirmRename()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    isRenaming.value = false
    renameValue.value = ''
  }
}

// =============================================================================
// Delete state
// =============================================================================

const showDeleteDialog = ref(false)

function requestDelete(): void {
  showDeleteDialog.value = true
}

function confirmDelete(): void {
  emit('delete')
  showDeleteDialog.value = false
}

function cancelDelete(): void {
  showDeleteDialog.value = false
}
</script>

<template>
  <li
    :class="['tag-row', { 'tag-row--active': isActive }]"
    :data-testid="`tag-row-${tag.id}`"
  >
    <!-- Toggle button (tag name + count) -->
    <button
      :aria-label="`Select ${tag.name}`"
      :aria-pressed="isActive"
      class="tag-row__toggle"
      :data-testid="`tag-toggle-${tag.id}`"
      type="button"
      @click="emit('toggle')"
    >
      <span
        v-if="!isRenaming"
        class="tag-row__name"
        :data-testid="`tag-name-${tag.id}`"
      >
        {{ tag.name }}
      </span>
      <span
        class="tag-row__count"
        :title="`${tag.entryCount} entries`"
      >
        {{ tag.entryCount }}
      </span>
    </button>

    <!-- Inline rename input (replaces name span) -->
    <input
      v-if="isRenaming"
      ref="renameInputRef"
      v-model="renameValue"
      aria-label="Rename tag"
      class="tag-row__rename-input"
      :data-testid="`rename-input-${tag.id}`"
      type="text"
      @keydown="handleRenameKeydown"
    />

    <!-- Actions -->
    <div class="tag-row__actions">
      <BaseButton
        :aria-label="`Rename ${tag.name}`"
        :data-testid="`rename-btn-${tag.id}`"
        size="sm"
        variant="ghost"
        @click="startRename"
      >
        Rename
      </BaseButton>

      <BaseButton
        :aria-label="`Delete ${tag.name}`"
        :data-testid="`delete-btn-${tag.id}`"
        size="sm"
        variant="ghost"
        @click="requestDelete"
      >
        Delete
      </BaseButton>
    </div>

    <!-- Delete confirmation dialog -->
    <SharedConfirmDialog
      v-model:open="showDeleteDialog"
      confirm-label="Delete"
      :description="`Delete '${tag.name}'? This will remove it from all entries.`"
      :title="`Delete tag '${tag.name}'?`"
      variant="danger"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    />
  </li>
</template>

<style scoped>
/* Tag row */

.tag-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.tag-row--active {
  border-color: var(--color-primary);
  background-color: var(--color-bg-muted);
}

.tag-row__toggle {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
}

.tag-row__toggle:focus-visible {
  border-radius: var(--radius-sm);
  box-shadow: var(--focus-ring);
  outline: none;
}

.tag-row__name {
  font-weight: var(--font-weight-medium);
}

.tag-row__count {
  padding: var(--spacing-0-5) var(--spacing-2);
  border-radius: var(--radius-full);
  background-color: var(--color-bg-muted);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.tag-row--active .tag-row__count {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.tag-row__rename-input {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.tag-row__rename-input:focus {
  box-shadow: var(--focus-ring);
  outline: none;
}

.tag-row__actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.tag-row:hover .tag-row__actions,
.tag-row:focus-within .tag-row__actions {
  opacity: 1;
}

@media (width <= 767px) {
  .tag-row__actions {
    opacity: 1;
  }
}
</style>
