<script setup lang="ts">
/**
 * SharedUpdatePrompt
 *
 * Prompts the user to reload once a new app version's service worker has
 * installed and is waiting to activate. Should be mounted once at the app
 * root — without it, an installed update only takes effect after every
 * open tab/window of the app is fully closed.
 */

import BaseButton from '@/base/components/BaseButton.vue'

import { usePwaUpdate } from '@/shared/composables/use-pwa-update'

const { needRefresh, reload } = usePwaUpdate()
</script>

<template>
  <div
    v-if="needRefresh"
    aria-live="polite"
    class="shared-update-prompt"
    role="status"
  >
    <p class="shared-update-prompt-text">A new version is available.</p>
    <BaseButton
      size="sm"
      @click="reload"
    >
      Reload to update
    </BaseButton>
  </div>
</template>

<style scoped>
.shared-update-prompt {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
  transform: translateX(-50%);
}

.shared-update-prompt-text {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}
</style>
