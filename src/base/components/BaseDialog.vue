<script setup lang="ts">
/**
 * BaseDialog
 *
 * A dialog/modal component built on Reka UI Dialog primitives.
 * Provides overlay, centered content, title, description, and close button.
 */

import { ref, watch } from 'vue'

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle
} from 'reka-ui'

defineProps<{
  /** Dialog title */
  title?: string
  /** Dialog description */
  description?: string
}>()

const open = defineModel<boolean>('open', { default: false })

// Internal state for dialog open/close - syncs with open model
// This is the pattern used in the reference implementation
const internalOpen = ref<boolean>(open.value)

// Watch for external model changes and sync internal state
watch(
  () => open.value,
  (newValue: boolean) => {
    internalOpen.value = newValue
  },
  { immediate: true }
)

// Handle changes from DialogRoot and update the model
const handleDialogUpdate = (newValue: boolean) => {
  internalOpen.value = newValue
  open.value = newValue
}
</script>

<template>
  <DialogRoot
    :open="internalOpen"
    @update:open="handleDialogUpdate"
  >
    <slot name="trigger" />

    <DialogPortal>
      <DialogOverlay class="base-dialog-overlay" />

      <DialogContent class="base-dialog-content">
        <DialogTitle
          v-if="title"
          class="base-dialog-title"
        >
          {{ title }}
        </DialogTitle>

        <DialogDescription class="base-dialog-description">
          {{ description || '' }}
        </DialogDescription>

        <slot />

        <DialogClose
          aria-label="Close"
          class="base-dialog-close"
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
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </DialogClose>

        <slot name="footer" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
/* Scoped styles only apply to elements within this component's direct DOM */
</style>

<!-- 
  Global styles for Dialog components rendered via Portal/Teleport.
  DialogOverlay and DialogContent are rendered outside the component tree,
  so scoped styles don't apply to them.
-->
<style>
.base-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background-color: var(--color-overlay);
}

.base-dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: var(--z-modal);
  width: 90vw;
  max-width: 450px;
  max-height: 85vh;
  padding: var(--spacing-lg);
  padding-bottom: var(--spacing-xl);
  overflow-y: auto;
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-xl);
  transform: translate(-50%, -50%);
}

.base-dialog-title {
  margin: 0 0 var(--spacing-2);
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.base-dialog-description {
  margin: 0 0 var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}

.base-dialog-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.base-dialog-close:hover {
  background-color: var(--color-surface);
}

.base-dialog-close:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}
</style>
