<script setup lang="ts">
/**
 * SharedConfirmDialog
 *
 * Reusable confirmation dialog for actions that require explicit user consent.
 * Built on BaseDialog with a confirm/cancel button pair.
 * Supports a `danger` variant for destructive actions with auto-focus on cancel button.
 *
 * @example
 * ```vue
 * <SharedConfirmDialog
 *   v-model:open="showDialog"
 *   title="Delete all data?"
 *   description="This action cannot be undone."
 *   confirm-label="Delete"
 *   variant="danger"
 *   @confirm="handleDelete"
 *   @cancel="showDialog = false"
 * />
 * ```
 */

import { computed, nextTick, ref, watch } from 'vue'

import { BaseButton, BaseDialog } from '@/base/components'

import type { ComponentPublicInstance } from 'vue'

interface Props {
  /** Whether the dialog is open (use with v-model:open) */
  open: boolean
  /** Dialog title */
  title: string
  /** Dialog description/warning text */
  description: string
  /** Confirm button label */
  confirmLabel: string
  /** Cancel button label */
  cancelLabel?: string
  /** Visual variant — use "danger" for destructive actions */
  variant?: 'default' | 'danger'
  /** Whether the confirm action is in progress (disables both buttons) */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cancelLabel: 'Cancel',
  variant: 'default',
  loading: false
})

/**
 * @event confirm - User clicked confirm button. Handler should perform the action.
 * @event cancel - User clicked cancel, pressed Escape, or closed the dialog.
 * @event update:open - Dialog open state changed (for v-model:open binding).
 */
const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:open': [value: boolean]
}>()

const confirmButtonVariant = computed(() =>
  props.variant === 'danger' ? 'danger' : 'primary'
)

const cancelButtonRef = ref<ComponentPublicInstance | null>(null)

// Focus cancel button for dangerous actions to prevent accidental confirmation
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.variant === 'danger') {
      void nextTick(() => {
        const element = cancelButtonRef.value?.$el as HTMLElement | undefined
        element?.focus()
      })
    }
  }
)

function handleConfirm(): void {
  emit('confirm')
}

function handleCancel(): void {
  emit('cancel')
  emit('update:open', false)
}

function handleOpenChange(value: boolean): void {
  emit('update:open', value)
  if (!value) {
    emit('cancel')
  }
}
</script>

<template>
  <BaseDialog
    :description="description"
    :open="open"
    :title="title"
    @update:open="handleOpenChange"
  >
    <div class="shared-confirm-dialog-actions">
      <BaseButton
        ref="cancelButtonRef"
        :aria-label="`${cancelLabel} - ${variant === 'danger' ? 'Recommended for destructive actions' : 'Cancel action'}`"
        :disabled="loading ?? false"
        variant="secondary"
        @click="handleCancel"
      >
        {{ cancelLabel }}
      </BaseButton>
      <BaseButton
        :aria-label="`${confirmLabel}${variant === 'danger' ? ' - This action is destructive and cannot be undone' : ''}`"
        :disabled="loading ?? false"
        :loading="loading ?? false"
        :variant="confirmButtonVariant"
        @click="handleConfirm"
      >
        {{ confirmLabel }}
      </BaseButton>
    </div>
  </BaseDialog>
</template>

<style scoped>
.shared-confirm-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-md);
}
</style>
