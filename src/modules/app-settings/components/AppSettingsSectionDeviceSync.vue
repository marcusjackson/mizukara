<script setup lang="ts">
/**
 * AppSettingsSectionDeviceSync
 *
 * Section component for the "Sync devices" entry point: opens a dialog that
 * walks through picking this device's role, mutual-QR/code pairing
 * (`SharedDeviceSyncPairing`, PR1), and the sync exchange itself
 * (`useDeviceSyncSession`, PR2's merge engine over PR1's transport). Sits
 * next to `AppSettingsSectionDatabase`'s export/import as the local-network
 * alternative to a manual export-transfer-import cycle.
 */

import { ref } from 'vue'

import { BaseButton, BaseDialog, BaseSpinner } from '@/base/components'

import SharedDeviceSyncPairing from '@/shared/components/SharedDeviceSyncPairing.vue'
import { useDeviceSyncSession } from '@/shared/composables/use-device-sync-session'

import type { DeviceSyncRole } from '@/shared/types/device-sync-types'

type DeviceSyncStep =
  'role-select' | 'pairing' | 'syncing' | 'complete' | 'error'

const session = useDeviceSyncSession()

const isOpen = ref(false)
const step = ref<DeviceSyncStep>('role-select')
const role = ref<DeviceSyncRole | null>(null)
const errorMessage = ref<string | null>(null)
// Bumped on retry to force SharedDeviceSyncPairing to remount, so it starts
// a fresh RTCPeerConnection rather than reusing the failed one.
const pairingAttempt = ref(0)
const pairingRef = ref<InstanceType<typeof SharedDeviceSyncPairing> | null>(
  null
)

function resetToRoleSelect(): void {
  step.value = 'role-select'
  role.value = null
  errorMessage.value = null
}

function handleOpenDialog(): void {
  resetToRoleSelect()
  pairingAttempt.value += 1
  isOpen.value = true
}

function handleOpenChange(open: boolean): void {
  isOpen.value = open
  if (!open) resetToRoleSelect()
}

function selectRole(selected: DeviceSyncRole): void {
  role.value = selected
  step.value = 'pairing'
}

async function handlePaired(dataChannel: RTCDataChannel): Promise<void> {
  step.value = 'syncing'
  await session.run(dataChannel)
  // The connection has done its job either way — close it now rather than
  // leaving it open until the user clicks Done/Try again, per the design's
  // "ephemeral, closed when the sync completes" requirement. Awaited: the
  // underlying close is graceful (usePeerConnection's close waits for the
  // data channel's own close handshake with the peer), so this actually
  // confirms delivery of anything just sent before the connection tears
  // down, rather than racing an abrupt teardown against still-in-flight data.
  await pairingRef.value?.close()

  if (session.phase.value === 'complete') {
    step.value = 'complete'
    return
  }

  errorMessage.value = session.error.value ?? 'Sync failed'
  step.value = 'error'
}

function handleRetry(): void {
  resetToRoleSelect()
  pairingAttempt.value += 1
}

function handleDone(): void {
  isOpen.value = false
  globalThis.location.reload()
}
</script>

<template>
  <section
    aria-label="Device sync settings"
    class="app-settings-section"
  >
    <h2 class="app-settings-section-title">Sync devices</h2>

    <div class="app-settings-db-operation">
      <div class="app-settings-db-operation-info">
        <span class="app-settings-db-operation-label">Sync now</span>
        <span class="app-settings-db-operation-description">
          Merge entries and tags with another device over the local network
        </span>
      </div>
      <BaseButton
        variant="secondary"
        @click="handleOpenDialog"
      >
        Sync devices
      </BaseButton>
    </div>

    <BaseDialog
      :open="isOpen"
      title="Sync devices"
      @update:open="handleOpenChange"
    >
      <div class="app-settings-device-sync-body">
        <template v-if="step === 'role-select'">
          <p class="app-settings-device-sync-hint">
            On one device, show a code. On the other, scan or paste it.
          </p>
          <div class="app-settings-device-sync-role-buttons">
            <BaseButton @click="selectRole('initiator')">
              Show a code
            </BaseButton>
            <BaseButton
              variant="secondary"
              @click="selectRole('responder')"
            >
              Scan or enter a code
            </BaseButton>
          </div>
        </template>

        <!--
          Stays mounted (only visually hidden) across pairing/syncing/
          complete/error: unmounting it closes its RTCPeerConnection
          (SharedDeviceSyncPairing -> usePeerConnection's onScopeDispose), so
          removing it from the DOM the instant `paired` fires would tear
          down the very data channel the sync session is about to use.
          It only actually unmounts (and closes the stale connection) when
          `step` returns to 'role-select' — on retry or dialog close.
        -->
        <template v-if="role && step !== 'role-select'">
          <SharedDeviceSyncPairing
            v-show="step === 'pairing'"
            :key="pairingAttempt"
            ref="pairingRef"
            :role="role"
            @paired="handlePaired"
          />

          <BaseSpinner
            v-if="step === 'syncing'"
            label="Syncing…"
          />

          <div
            v-else-if="step === 'complete'"
            class="app-settings-device-sync-result"
          >
            <p>Devices synced.</p>
            <BaseButton @click="handleDone">Done</BaseButton>
          </div>

          <div
            v-else-if="step === 'error'"
            class="app-settings-device-sync-result"
          >
            <p role="alert">{{ errorMessage }}</p>
            <p class="app-settings-device-sync-hint">
              If this keeps failing, use Export/Import above instead.
            </p>
            <BaseButton @click="handleRetry">Try again</BaseButton>
          </div>
        </template>
      </div>
    </BaseDialog>
  </section>
</template>

<style scoped>
.app-settings-section {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.app-settings-section-title {
  margin: 0 0 var(--spacing-lg);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.app-settings-db-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
  padding: var(--spacing-3) 0;
}

.app-settings-db-operation-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.app-settings-db-operation-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.app-settings-db-operation-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.app-settings-device-sync-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
}

.app-settings-device-sync-hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
}

.app-settings-device-sync-role-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  width: 100%;
}

.app-settings-device-sync-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  text-align: center;
}

@media (width <= 767px) {
  .app-settings-db-operation {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-3);
  }
}
</style>
