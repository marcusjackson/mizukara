/**
 * useFileInput / useFilePreview
 *
 * Handles file input logic: drag-and-drop, file validation, MIME detection,
 * and preview URL lifecycle. Used by BaseFileInput.
 */
import { computed, onUnmounted, ref, watch } from 'vue'

import type { ComputedRef, Ref } from 'vue'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ACCEPT = 'image/*'
const DEFAULT_WARNING_SIZE = 512 * 1024 // 512KB
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024 // 2MB

// ============================================================================
// MIME Detection
// ============================================================================

/** [minLength, bytesToMatch, mimeType] */
type MimeSignature = [number, number[], string]

const MIME_SIGNATURES: MimeSignature[] = [
  [4, [0x89, 0x50, 0x4e, 0x47], 'image/png'],
  [4, [0x47, 0x49, 0x46, 0x38], 'image/gif'],
  [3, [0xff, 0xd8, 0xff], 'image/jpeg'],
  [12, [0x52, 0x49, 0x46, 0x46], 'image/webp']
]

function detectMimeType(data: Uint8Array): string {
  for (const [minLen, bytes, mime] of MIME_SIGNATURES) {
    if (data.length >= minLen && bytes.every((b, i) => data[i] === b)) {
      return mime
    }
  }
  return 'application/octet-stream'
}

function makePreviewUrl(data: Uint8Array): string {
  const blob = new Blob([data] as BlobPart[], { type: detectMimeType(data) })
  return URL.createObjectURL(blob)
}

function revokePreview(previewUrl: Ref<string | null>): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

// ============================================================================
// File Processing
// ============================================================================

export interface UseFileInputOptions {
  accept?: Ref<string | undefined>
  externalError?: Ref<string | undefined>
  fileInputRef?: Ref<HTMLInputElement | null>
  maxSizeBytes?: Ref<number | undefined>
  warningSizeBytes?: Ref<number | undefined>
}

interface FileProcessorRefs {
  model: Ref<Uint8Array | null>
  onError: (message: string) => void
  sizeError: Ref<string | null>
  sizeWarning: Ref<string | null>
}

/** Returns a bound async processor that captures refs and options via closure. */
function createFileProcessor(
  refs: FileProcessorRefs,
  options: UseFileInputOptions
) {
  return async (file: File | undefined): Promise<void> => {
    if (!file) return
    refs.sizeWarning.value = null
    refs.sizeError.value = null
    const maxBytes = options.maxSizeBytes?.value ?? DEFAULT_MAX_SIZE
    const warnBytes = options.warningSizeBytes?.value ?? DEFAULT_WARNING_SIZE
    if (file.size > maxBytes) {
      refs.sizeError.value = `File too large. Maximum size is ${(maxBytes / (1024 * 1024)).toFixed(1)} MB`
      refs.onError(refs.sizeError.value)
      return
    }
    if (file.size > warnBytes) {
      refs.sizeWarning.value = `File is larger than ${String(Math.round(warnBytes / 1024))}KB`
    }
    const buffer = await file.arrayBuffer()
    refs.model.value = new Uint8Array(buffer)
  }
}

// ============================================================================
// Drag Helper
// ============================================================================

function setDragging(isDragging: Ref<boolean>, value: boolean) {
  return (event: DragEvent): void => {
    event.preventDefault()
    isDragging.value = value
  }
}

interface DragDropHandlers {
  handleDragEnterOver: (event: DragEvent) => void
  handleDragLeave: (event: DragEvent) => void
  handleDrop: (event: DragEvent) => void
}

function buildDragDropHandlers(
  isDragging: Ref<boolean>,
  runProcessFile: (file: File | undefined) => Promise<void>
): DragDropHandlers {
  return {
    handleDragEnterOver: setDragging(isDragging, true),
    handleDragLeave: setDragging(isDragging, false),
    handleDrop(event: DragEvent): void {
      event.preventDefault()
      isDragging.value = false
      void runProcessFile(event.dataTransfer?.files[0])
    }
  }
}

// ============================================================================
// Preview Sub-Composable
// ============================================================================

export interface UseFilePreviewReturn {
  /** Whether a preview URL is available for the current file */
  hasPreview: ComputedRef<boolean>
  /**
   * Object URL for the current file preview, or null if none.
   * The URL is created on file selection and revoked on removal or unmount
   * to prevent memory leaks.
   */
  previewUrl: Ref<string | null>
}

/**
 * Creates and manages an object URL preview for a binary file model.
 * The URL is automatically created when the model changes and revoked on
 * component unmount to prevent memory leaks.
 *
 * @param model - Reactive ref containing the raw file bytes, or null
 * @returns Preview URL state
 */
export function useFilePreview(
  model: Ref<Uint8Array | null>
): UseFilePreviewReturn {
  const previewUrl = ref<string | null>(null)
  const hasPreview = computed(() => previewUrl.value !== null)

  watch(
    () => model.value,
    (val) => {
      revokePreview(previewUrl)
      if (val) previewUrl.value = makePreviewUrl(val)
    },
    { immediate: true }
  )

  onUnmounted(() => {
    revokePreview(previewUrl)
  })

  return { hasPreview, previewUrl }
}

// ============================================================================
// Main File Input Composable
// ============================================================================

export interface UseFileInputReturn {
  /** The error message to show below the input (external or size error) */
  displayError: ComputedRef<string | null>
  /** Ref to the hidden file input element */
  fileInputRef: Ref<HTMLInputElement | null>
  /** Whether a preview URL is available for the current file */
  hasPreview: ComputedRef<boolean>
  /** Whether the user is currently dragging a file over the drop zone */
  isDragging: Ref<boolean>
  /** Object URL for the current file preview, or null if none */
  previewUrl: Ref<string | null>
  /** The resolved accepted file types string */
  resolvedAccept: ComputedRef<string>
  /** Non-blocking size warning message, or null */
  sizeWarning: Ref<string | null>
  /** Combined handler for dragenter and dragover events */
  handleDragEnterOver: (event: DragEvent) => void
  /** Handler for dragleave event */
  handleDragLeave: (event: DragEvent) => void
  /** Handler for drop event */
  handleDrop: (event: DragEvent) => void
  /** Handler for file input change event */
  handleFileSelect: (event: Event) => void
  /** Remove the current file and reset all state */
  handleRemove: () => void
  /** Programmatically open the file picker dialog */
  triggerFileInput: () => void
}

/**
 * Manages file input state: drag-and-drop, file selection, size validation,
 * and preview URL lifecycle.
 *
 * @param model - Reactive ref to store the selected file bytes
 * @param options - Optional configuration for accepted types, size limits, etc.
 * @param onError - Callback invoked when a hard error occurs (e.g., file too large)
 * @returns State and event handlers for use with BaseFileInput
 */
export function useFileInput(
  model: Ref<Uint8Array | null>,
  options: UseFileInputOptions,
  onError: (message: string) => void
): UseFileInputReturn {
  const isDragging = ref(false)
  const sizeWarning = ref<string | null>(null)
  const sizeError = ref<string | null>(null)
  const fileInputRef =
    options.fileInputRef ?? ref<HTMLInputElement | null>(null)
  const resolvedAccept = computed(() => options.accept?.value ?? DEFAULT_ACCEPT)
  const displayError = computed(
    () => options.externalError?.value ?? sizeError.value
  )
  const { hasPreview, previewUrl } = useFilePreview(model)
  const runProcessFile = createFileProcessor(
    { model, onError, sizeError, sizeWarning },
    options
  )

  function handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement
    void runProcessFile(input.files?.[0])
    input.value = ''
  }

  function handleRemove(): void {
    model.value = null
    sizeWarning.value = null
    sizeError.value = null
  }

  const { handleDragEnterOver, handleDragLeave, handleDrop } =
    buildDragDropHandlers(isDragging, runProcessFile)

  return {
    displayError,
    fileInputRef,
    hasPreview,
    isDragging,
    previewUrl,
    resolvedAccept,
    sizeWarning,
    handleDragEnterOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleRemove,
    triggerFileInput: () => fileInputRef.value?.click()
  }
}
