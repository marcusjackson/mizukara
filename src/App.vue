<script setup lang="ts">
/**
 * Root App component
 */
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import { useDatabase } from '@/shared/composables/use-database'
import { useTheme } from '@/shared/composables/use-theme'

// Initialize theme on app startup (applies saved preference or system preference)
useTheme()

// Initialize database on app startup
const { initError: error, initialize, isInitialized: isReady } = useDatabase()

// Trigger database initialization when app mounts
onMounted(async () => {
  await initialize()
})
</script>

<template>
  <div
    v-if="error"
    class="app-error"
  >
    <h1>Database Error</h1>
    <p>{{ error.message }}</p>
  </div>
  <template v-else-if="isReady">
    <RouterView />
  </template>
  <div
    v-else
    class="app-loading"
  >
    <p>Loading...</p>
  </div>
</template>

<style>
.app-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--spacing-lg);
  text-align: center;
}

.app-error h1 {
  margin-bottom: var(--spacing-md);
  color: var(--color-error);
}

.app-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
