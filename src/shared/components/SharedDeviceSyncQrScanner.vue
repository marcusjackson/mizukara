<script setup lang="ts">
/**
 * SharedDeviceSyncQrScanner
 *
 * Live camera view for scanning a device-sync pairing QR code. Starts the
 * camera as soon as it's mounted and emits `scanned` with the decoded text
 * the first time a QR code is found; the parent decides what to do with it
 * (decode as a compact SDP code, advance the pairing flow, etc.).
 */

import { onMounted, ref } from 'vue'

import { BaseButton } from '@/base/components'

import { useQrCameraScanner } from '@/shared/composables/use-qr-camera-scanner'

const emit = defineEmits<{
  scanned: [value: string]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const scanner = useQrCameraScanner(videoRef, (value) => {
  emit('scanned', value)
})

onMounted(() => {
  void scanner.start()
})

function handleRetry(): void {
  void scanner.start()
}
</script>

<template>
  <div class="shared-device-sync-qr-scanner">
    <video
      ref="videoRef"
      autoplay
      class="shared-device-sync-qr-scanner-video"
      muted
      playsinline
    />
    <p
      v-if="scanner.error.value"
      class="shared-device-sync-qr-scanner-error"
      role="alert"
    >
      {{ scanner.error.value }}
      <BaseButton
        size="sm"
        variant="secondary"
        @click="handleRetry"
      >
        Try again
      </BaseButton>
    </p>
  </div>
</template>

<style scoped>
.shared-device-sync-qr-scanner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
}

.shared-device-sync-qr-scanner-video {
  width: 100%;
  max-width: 280px;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-secondary);
  object-fit: cover;
}

.shared-device-sync-qr-scanner-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  text-align: center;
}
</style>
