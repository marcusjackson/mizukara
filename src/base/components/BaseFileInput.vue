<script setup lang="ts">
/**
 * BaseFileInput
 *
 * File upload component with drag-and-drop, preview, and validation.
 * Converts uploaded files to Uint8Array for storage.
 */

import { ref, toRefs, useId } from 'vue'

import { BaseButton } from '@/base/components'
import { useFileInput } from '@/base/composables/use-file-input'

const props = defineProps<{
  /** Input label */
  label?: string
  /** Accepted file types (e.g., 'image/*', 'image/gif') */
  accept?: string
  /** External error message */
  error?: string
  /** Disable the input */
  disabled?: boolean
  /** Soft size limit in bytes (shows warning) */
  warningSizeBytes?: number
  /** Hard size limit in bytes (prevents upload) */
  maxSizeBytes?: number
}>()

const emit = defineEmits<{
  /** Emitted when there's a validation error */
  error: [message: string]
}>()

const modelValue = defineModel<Uint8Array | null>({ default: null })

const fileInputRef = ref<HTMLInputElement | null>(null)

const fileInputId = useId()

const {
  accept,
  error: externalError,
  maxSizeBytes,
  warningSizeBytes
} = toRefs(props)

const {
  displayError,
  handleDragEnterOver,
  handleDragLeave,
  handleDrop,
  handleFileSelect,
  handleRemove,
  hasPreview,
  isDragging,
  previewUrl,
  resolvedAccept,
  sizeWarning,
  triggerFileInput
} = useFileInput(
  modelValue,
  { accept, externalError, fileInputRef, maxSizeBytes, warningSizeBytes },
  (msg) => {
    emit('error', msg)
  }
)
</script>

<template>
  <div class="base-file-input">
    <label
      v-if="label"
      class="base-file-input-label"
      :for="fileInputId"
    >
      {{ label }}
    </label>

    <div
      class="base-file-input-drop-zone"
      :class="{
        'base-file-input-drop-zone--dragging': isDragging,
        'base-file-input-drop-zone--has-preview': hasPreview,
        'base-file-input-drop-zone--disabled': props.disabled,
        'base-file-input-drop-zone--error': displayError
      }"
      :data-dragging="isDragging"
      data-testid="file-input-drop-zone"
      @dragenter="handleDragEnterOver"
      @dragleave="handleDragLeave"
      @dragover="handleDragEnterOver"
      @drop="handleDrop"
    >
      <!-- Hidden file input -->
      <input
        :id="fileInputId"
        ref="fileInputRef"
        :accept="resolvedAccept"
        class="base-file-input-hidden"
        data-testid="file-input-hidden"
        :disabled="props.disabled"
        type="file"
        @change="handleFileSelect"
      />

      <!-- Preview -->
      <div
        v-if="hasPreview"
        class="base-file-input-preview-container"
      >
        <img
          alt="File preview"
          class="base-file-input-preview"
          data-testid="file-input-preview"
          :src="previewUrl ?? ''"
        />
        <button
          aria-label="Remove file"
          class="base-file-input-remove"
          data-testid="file-input-remove"
          type="button"
          @click="handleRemove"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="16"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="base-file-input-empty"
      >
        <div class="base-file-input-icon">
          <svg
            aria-hidden="true"
            fill="none"
            height="32"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            width="32"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line
              x1="12"
              x2="12"
              y1="3"
              y2="15"
            />
          </svg>
        </div>
        <p class="base-file-input-text">Drag and drop or click to upload</p>
        <BaseButton
          :disabled="props.disabled"
          size="sm"
          type="button"
          variant="secondary"
          @click="triggerFileInput"
        >
          Browse
        </BaseButton>
      </div>
    </div>

    <!-- Warning -->
    <p
      v-if="sizeWarning"
      class="base-file-input-warning"
      role="alert"
    >
      {{ sizeWarning }}
    </p>

    <!-- Error -->
    <p
      v-if="displayError"
      class="base-file-input-error"
      role="alert"
    >
      {{ displayError }}
    </p>
  </div>
</template>

<style scoped>
.base-file-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.base-file-input-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.base-file-input-drop-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-secondary);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.base-file-input-drop-zone:hover:not(.base-file-input-drop-zone--disabled) {
  border-color: var(--color-primary);
  background-color: var(--color-surface-tertiary);
}

.base-file-input-drop-zone--dragging {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.base-file-input-drop-zone--has-preview {
  cursor: default;
}

.base-file-input-drop-zone--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-file-input-drop-zone--error {
  border-color: var(--color-danger);
}

.base-file-input-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  clip-path: inset(50%);
}

.base-file-input-preview-container {
  position: relative;
  padding: var(--spacing-sm);
}

.base-file-input-preview {
  max-width: 200px;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--radius-sm);
}

.base-file-input-remove {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xs);
  border: none;
  border-radius: var(--radius-full);
  background-color: var(--color-danger);
  color: var(--color-white);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.base-file-input-remove:hover {
  background-color: var(--color-danger-dark);
}

.base-file-input-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  text-align: center;
}

.base-file-input-icon {
  color: var(--color-text-muted);
}

.base-file-input-text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.base-file-input-warning {
  margin: 0;
  color: var(--color-warning);
  font-size: var(--font-size-sm);
}

.base-file-input-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
</style>
