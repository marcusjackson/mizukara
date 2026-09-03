<script setup lang="ts">
/**
 * SharedDeviceSyncPairing
 *
 * Drives the mutual-QR pairing flow (`useDeviceSyncPairing`) end to end for
 * one device, with a manual toggle to the copy-paste fallback for the
 * camera-less case. Emits `paired` once the underlying `RTCDataChannel` is
 * ready — `useDeviceSyncSession` picks up from there.
 *
 * Unmounting this component closes the underlying `RTCPeerConnection`
 * (`usePeerConnection`'s `onScopeDispose`), so a caller that keeps it
 * mounted past `paired` (to let a sync session finish using the channel)
 * should call the exposed `close()` once that session ends, rather than
 * relying on unmount — see `AppSettingsSectionDeviceSync.vue`.
 */

import { ref, watch } from 'vue'

import { BaseButton, BaseSpinner } from '@/base/components'

import { useDeviceSyncPairing } from '@/shared/composables/use-device-sync-pairing'

import SharedDeviceSyncCodeExchange from './SharedDeviceSyncCodeExchange.vue'
import SharedDeviceSyncQrDisplay from './SharedDeviceSyncQrDisplay.vue'
import SharedDeviceSyncQrScanner from './SharedDeviceSyncQrScanner.vue'

import type { DeviceSyncRole } from '@/shared/types/device-sync-types'

const props = defineProps<{ role: DeviceSyncRole }>()

const emit = defineEmits<{
  paired: [dataChannel: RTCDataChannel]
}>()

const pairing = useDeviceSyncPairing(props.role)
const inputMode = ref<'qr' | 'code'>('qr')

function toggleInputMode(): void {
  inputMode.value = inputMode.value === 'qr' ? 'code' : 'qr'
}

// Watches both phase and dataChannel — the responder's channel arrives via
// a separate 'datachannel' RTCPeerConnection event, independently timed
// from connectionState reaching 'connected', so either can be the one that
// completes the pair.
let hasEmittedPaired = false
watch([pairing.phase, pairing.dataChannel], ([phase, channel]) => {
  if (phase !== 'connected' || !channel || hasEmittedPaired) return
  hasEmittedPaired = true
  emit('paired', channel)
})

if (props.role === 'initiator') void pairing.start()

defineExpose({ close: pairing.close })
</script>

<template>
  <div class="shared-device-sync-pairing">
    <BaseSpinner
      v-if="pairing.phase.value === 'idle'"
      label="Preparing…"
    />

    <template
      v-else-if="
        pairing.phase.value === 'awaiting-offer' ||
        pairing.phase.value === 'sharing-offer' ||
        pairing.phase.value === 'sharing-answer'
      "
    >
      <SharedDeviceSyncQrDisplay
        v-if="inputMode === 'qr' && pairing.code.value"
        :value="pairing.code.value"
      />
      <SharedDeviceSyncQrScanner
        v-if="inputMode === 'qr' && pairing.phase.value !== 'sharing-answer'"
        @scanned="pairing.submitCode"
      />
      <SharedDeviceSyncCodeExchange
        v-if="inputMode === 'code'"
        :code="pairing.code.value"
        :show-paste-input="pairing.phase.value !== 'sharing-answer'"
        @submit="pairing.submitCode"
      />
      <BaseButton
        size="sm"
        variant="ghost"
        @click="toggleInputMode"
      >
        {{ inputMode === 'qr' ? 'Use a code instead' : 'Use camera instead' }}
      </BaseButton>
    </template>

    <BaseSpinner
      v-else-if="pairing.phase.value === 'connecting'"
      label="Connecting…"
    />

    <p v-else-if="pairing.phase.value === 'connected'">Devices paired.</p>

    <p
      v-else-if="pairing.phase.value === 'error'"
      role="alert"
    >
      {{ pairing.error.value }}
    </p>
  </div>
</template>

<style scoped>
.shared-device-sync-pairing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
}
</style>
