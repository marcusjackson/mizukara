<script setup lang="ts">
/**
 * SharedDeviceSyncCodeExchange
 *
 * Copy-paste fallback for device-sync pairing, for the camera-less case
 * `SharedDeviceSyncQrScanner` can't cover. Shows this device's compact code
 * as copyable text, and a field to paste the other device's code into.
 */

import { onBeforeUnmount, ref } from 'vue'

import { BaseButton, BaseInput } from '@/base/components'

interface Props {
  /** This device's compact pairing code, shown for the user to copy. Omit the share section entirely by passing null (e.g. before a responder has anything of its own to share yet). */
  code: string | null
  /** Hide the paste-in field once no further code is expected (e.g. a responder that's already shared its answer and is just waiting) */
  showPasteInput?: boolean
  shareLabel?: string
  pasteLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  pasteLabel: "Paste the other device's code",
  shareLabel: 'Your code',
  showPasteInput: true
})

const emit = defineEmits<{
  submit: [value: string]
}>()

const COPIED_FEEDBACK_MS = 2000

const pastedCode = ref('')
const justCopied = ref(false)
let copiedFeedbackTimer: ReturnType<typeof setTimeout> | null = null

async function handleCopy(): Promise<void> {
  if (props.code === null) return
  try {
    await navigator.clipboard.writeText(props.code)
    justCopied.value = true
    if (copiedFeedbackTimer) clearTimeout(copiedFeedbackTimer)
    copiedFeedbackTimer = setTimeout(() => {
      justCopied.value = false
    }, COPIED_FEEDBACK_MS)
  } catch {
    // Clipboard API can be unavailable or permission-denied; the code
    // stays visible and selectable so the user can still copy it by hand.
  }
}

function handleSubmit(): void {
  const value = pastedCode.value.trim()
  if (!value) return
  emit('submit', value)
  pastedCode.value = ''
}

onBeforeUnmount(() => {
  if (copiedFeedbackTimer) clearTimeout(copiedFeedbackTimer)
})
</script>

<template>
  <div class="shared-device-sync-code-exchange">
    <div
      v-if="code !== null"
      class="shared-device-sync-code-exchange-share"
    >
      <span class="shared-device-sync-code-exchange-share-label">
        {{ shareLabel }}
      </span>
      <div class="shared-device-sync-code-exchange-share-row">
        <code class="shared-device-sync-code-exchange-code">{{ code }}</code>
        <BaseButton
          size="sm"
          variant="secondary"
          @click="handleCopy"
        >
          {{ justCopied ? 'Copied!' : 'Copy' }}
        </BaseButton>
      </div>
    </div>

    <form
      v-if="showPasteInput"
      class="shared-device-sync-code-exchange-paste"
      @submit.prevent="handleSubmit"
    >
      <BaseInput
        v-model="pastedCode"
        :label="pasteLabel"
        placeholder="Paste code here"
      />
      <BaseButton
        :disabled="!pastedCode.trim()"
        type="submit"
      >
        Continue
      </BaseButton>
    </form>
  </div>
</template>

<style scoped>
.shared-device-sync-code-exchange {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.shared-device-sync-code-exchange-share {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.shared-device-sync-code-exchange-share-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.shared-device-sync-code-exchange-share-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.shared-device-sync-code-exchange-code {
  overflow-wrap: anywhere;
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-secondary);
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
}

.shared-device-sync-code-exchange-paste {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-2);
}

.shared-device-sync-code-exchange-paste :deep(.base-input) {
  flex: 1;
}
</style>
