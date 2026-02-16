<script setup lang="ts">
/**
 * BaseFileInput
 *
 * File upload component with drag-and-drop, preview, and validation.
 * Converts uploaded files to Uint8Array for storage.
 */

import { computed, onUnmounted, ref, watch } from 'vue'

import { BaseButton } from '@/base/components'

// ============================================================================
// Props and Model
// ============================================================================

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

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_ACCEPT = 'image/*'
const DEFAULT_WARNING_SIZE = 512 * 1024 // 500KB
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024 // 2MB

// ============================================================================
// State
// ============================================================================

const isDragging = ref(false)
const sizeWarning = ref<string | null>(null)
const sizeError = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// ============================================================================
// Computed
// ============================================================================

const displayError = computed(() => props.error ?? sizeError.value)
const hasPreview = computed(() => previewUrl.value !== null)
const accept = computed(() => props.accept ?? DEFAULT_ACCEPT)
const isDisabled = computed(() => props.disabled)

// ============================================================================
// Blob URL Management
// ============================================================================

function createPreviewUrl(data: Uint8Array): string {
  const mimeType = detectMimeType(data)
  const blob = new Blob([data], { type: mimeType })
  return URL.createObjectURL(blob)
}

function revokePreviewUrl(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

/**
 * MIME type signatures for magic byte detection
 * [minLength, bytesToMatch, mimeType]
 */
type MimeSignature = [number, number[], string]

const MIME_SIGNATURES: MimeSignature[] = [
  // PNG: 89 50 4E 47
  [4, [0x89, 0x50, 0x4e, 0x47], 'image/png'],
  // GIF: 47 49 46 38
  [4, [0x47, 0x49, 0x46, 0x38], 'image/gif'],
  // JPEG: FF D8 FF
  [3, [0xff, 0xd8, 0xff], 'image/jpeg'],
  // WebP: RIFF at 0-3, WEBP at 8-11 (check partial)
  [12, [0x52, 0x49, 0x46, 0x46], 'image/webp']
]

function detectMimeType(data: Uint8Array): string {
  for (const [minLen, bytes, mime] of MIME_SIGNATURES) {
    if (data.length >= minLen) {
      const matches = bytes.every((b, i) => data[i] === b)
      if (matches) return mime
    }
  }
  return 'application/octet-stream'
}

// Watch for model value changes and update preview
watch(
  () => modelValue.value,
  (newValue, oldValue) => {
    // Revoke old URL if it exists
    if (oldValue !== null || previewUrl.value) {
      revokePreviewUrl()
    }
    // Create new URL if we have data
    if (newValue) {
      previewUrl.value = createPreviewUrl(newValue)
    }
  },
  { immediate: true }
)

// Cleanup on unmount
onUnmounted(() => {
  revokePreviewUrl()
})

// ============================================================================
// File Handling
// ============================================================================

async function processFile(file: File): Promise<void> {
  // Reset warnings/errors
  sizeWarning.value = null
  sizeError.value = null

  const maxSize = props.maxSizeBytes ?? DEFAULT_MAX_SIZE
  const warnSize = props.warningSizeBytes ?? DEFAULT_WARNING_SIZE

  // Check file size - hard limit
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1)
    sizeError.value = `File too large. Maximum size is ${maxMB} MB`
    emit('error', sizeError.value)
    return
  }

  // Check file size - warning limit
  if (file.size > warnSize) {
    const warnKB = String(Math.round(warnSize / 1024))
    sizeWarning.value = `File is larger than ${warnKB}KB`
  }

  // Convert to Uint8Array
  const buffer = await file.arrayBuffer()
  const data = new Uint8Array(buffer)
  modelValue.value = data
}

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    void processFile(file)
  }
  // Reset input so the same file can be selected again
  input.value = ''
}

function handleRemove(): void {
  modelValue.value = null
  sizeWarning.value = null
  sizeError.value = null
}

function triggerFileInput(): void {
  fileInputRef.value?.click()
}

// ============================================================================
// Drag and Drop
// ============================================================================

function handleDragEnter(event: DragEvent): void {
  event.preventDefault()
  isDragging.value = true
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave(event: DragEvent): void {
  event.preventDefault()
  isDragging.value = false
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  isDragging.value = false

  const file = event.dataTransfer?.files[0]
  if (file) {
    void processFile(file)
  }
}
</script>

<template>
  <div class="base-file-input">
    <label
      v-if="label"
      class="base-file-input-label"
    >
      {{ label }}
    </label>

    <div
      class="base-file-input-drop-zone"
      :class="{
        'base-file-input-drop-zone--dragging': isDragging,
        'base-file-input-drop-zone--has-preview': hasPreview,
        'base-file-input-drop-zone--disabled': isDisabled,
        'base-file-input-drop-zone--error': displayError
      }"
      :data-dragging="isDragging"
      data-testid="file-input-drop-zone"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        :accept="accept"
        class="base-file-input-hidden"
        data-testid="file-input-hidden"
        :disabled="isDisabled"
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
          :src="previewUrl!"
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
          :disabled="isDisabled"
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
    border-color 0.2s,
    background-color 0.2s;
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
  transition: background-color 0.2s;
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
