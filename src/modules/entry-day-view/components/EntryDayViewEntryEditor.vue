<script setup lang="ts">
/**
 * EntryDayViewEntryEditor - Inline editor for journal entries.
 * Validates content/day, auto-focuses, warns on unsaved changes.
 *
 * @emits save-requested - Valid data submission
 * @emits edit-cancelled - Cancel/Escape action
 */

import { onMounted, onUnmounted, ref } from 'vue'

import BaseButton from '@/base/components/BaseButton.vue'
import BaseTextarea from '@/base/components/BaseTextarea.vue'

import { SharedConfirmDialog } from '@/shared/components'

import { useEntryEditor } from '../composables/use-entry-editor'

import EntryDayViewEntryEditorDate from './EntryDayViewEntryEditorDate.vue'
import EntryDayViewEntryEditorTags from './EntryDayViewEntryEditorTags.vue'

import type { Entry } from '@/shared/types/entry-types'
import type { TagInputOption } from '@/shared/types/tag-types'

const props = defineProps<{ entry: Entry; allTags?: TagInputOption[] }>()
const emit = defineEmits<{
  'save-requested': [data: { content: string; assignedDay: string }]
  'edit-cancelled': []
}>()
const showCancelConfirm = ref(false)
const onCancel = () => {
  if (meta.value.dirty) {
    showCancelConfirm.value = true
  } else {
    emit('edit-cancelled')
  }
}
const confirmDiscard = () => {
  showCancelConfirm.value = false
  emit('edit-cancelled')
}
const onSave = () => {
  emit('save-requested', {
    content: contentValue.value,
    assignedDay: assignedDayValue.value
  })
}
const {
  assignedDayError,
  assignedDayValue,
  contentError,
  contentValue,
  handleBeforeUnload,
  handleKeyDown,
  meta,
  updateAssignedDay
} = useEntryEditor(props.entry, onCancel, onSave)
const textareaRef = ref<{ focus: () => void }>()

/**
 * Registered on the capture phase so it runs before Root's global Escape
 * shortcut (a separate bubble-phase document listener) and before any
 * ancestor can react to the same keypress. Escape stops propagation here
 * unless the discard-confirm dialog is already open, in which case the
 * event is left alone so the dialog's own Escape-to-close handling (a
 * window-level listener) still receives it.
 */
const documentKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showCancelConfirm.value) {
      return
    }
    event.stopPropagation()
  }
  handleKeyDown(event)
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('keydown', documentKeyDown, true)
  textareaRef.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('keydown', documentKeyDown, true)
})

defineExpose({
  save: onSave,
  cancel: onCancel
})
</script>

<template>
  <form
    class="entry-editor"
    data-testid="entry-editor"
    @submit.prevent="onSave"
  >
    <div class="entry-editor-content">
      <BaseTextarea
        ref="textareaRef"
        v-model="contentValue"
        auto-expand
        class="entry-editor-textarea"
        :error="contentError"
        label="Content"
        :max-rows="8"
        name="content"
        placeholder="Enter your thoughts..."
        :rows="3"
      />

      <EntryDayViewEntryEditorDate
        v-bind="assignedDayError ? { error: assignedDayError } : {}"
        :value="assignedDayValue"
        @change="updateAssignedDay"
      />

      <EntryDayViewEntryEditorTags
        :all-tags="allTags ?? []"
        :entry-id="entry.id"
      />
    </div>

    <div class="entry-editor-actions">
      <span class="keyboard-hint"> <kbd>Esc</kbd> to cancel </span>
      <div class="button-group">
        <BaseButton
          type="button"
          variant="secondary"
          @click="onCancel"
        >
          Cancel
        </BaseButton>

        <BaseButton
          type="submit"
          variant="primary"
        >
          Save
        </BaseButton>
      </div>
    </div>
  </form>

  <SharedConfirmDialog
    v-model:open="showCancelConfirm"
    confirm-label="Discard"
    description="Your unsaved edits will be lost. This cannot be undone."
    title="Discard changes?"
    variant="danger"
    @confirm="confirmDiscard"
  />
</template>

<style scoped>
.entry-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  border: 2px solid var(--color-border-focus);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.entry-editor-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.entry-editor-textarea {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
}

.entry-editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-3);
}

.button-group {
  display: flex;
  gap: var(--spacing-3);
}

.keyboard-hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

@media (width <= 767px) {
  .keyboard-hint {
    display: none;
  }
}

kbd {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
}
</style>
