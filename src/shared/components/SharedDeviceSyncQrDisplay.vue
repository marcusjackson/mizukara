<script setup lang="ts">
/**
 * SharedDeviceSyncQrDisplay
 *
 * Renders a device-sync pairing code (an offer or answer produced by
 * `usePeerConnection`) as a scannable QR code. Purely presentational — the
 * caller decides what code to show and when; this only turns it into an
 * image.
 */

import { ref, watch } from 'vue'

import QRCode from 'qrcode'

import { BaseSpinner } from '@/base/components'

interface Props {
  /** The compact pairing code to encode */
  value: string
  /** Accessible label describing what this QR code represents */
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Device pairing code'
})

const QR_CODE_PIXEL_SIZE = 280

const imageDataUrl = ref<string | null>(null)
const error = ref<string | null>(null)

watch(
  () => props.value,
  async (value) => {
    imageDataUrl.value = null
    error.value = null
    try {
      imageDataUrl.value = await QRCode.toDataURL(value, {
        margin: 1,
        width: QR_CODE_PIXEL_SIZE
      })
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to generate QR code'
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="shared-device-sync-qr-display">
    <img
      v-if="imageDataUrl"
      :alt="label"
      class="shared-device-sync-qr-display-image"
      :src="imageDataUrl"
    />
    <p
      v-else-if="error"
      class="shared-device-sync-qr-display-error"
      role="alert"
    >
      {{ error }}
    </p>
    <BaseSpinner
      v-else
      :label="`Generating ${label.toLowerCase()}…`"
    />
  </div>
</template>

<style scoped>
.shared-device-sync-qr-display {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 280px;
}

.shared-device-sync-qr-display-image {
  width: 100%;
  max-width: 280px;
  height: auto;
  border-radius: var(--radius-md);
}

.shared-device-sync-qr-display-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  text-align: center;
}
</style>
