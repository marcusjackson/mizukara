<script setup lang="ts">
/**
 * AppSettingsRoot
 *
 * Root component for the settings page. Orchestrates appearance
 * and database settings sections with back navigation.
 */

import { RouterLink } from 'vue-router'

import { ROUTES } from '@/router/routes'

import AppSettingsSectionAppearance from './AppSettingsSectionAppearance.vue'
import AppSettingsSectionDatabase from './AppSettingsSectionDatabase.vue'
</script>

<template>
  <main class="app-settings-root">
    <div class="app-settings-header">
      <RouterLink
        aria-label="Back to entries"
        class="app-settings-back-link"
        :to="ROUTES.HOME"
      >
        ← Back
      </RouterLink>
      <h1 class="app-settings-title">Settings</h1>
    </div>

    <div class="app-settings-sections">
      <AppSettingsSectionAppearance />
      <AppSettingsSectionDatabase />
    </div>
  </main>
</template>

<style scoped>
.app-settings-root {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.app-settings-header {
  margin-bottom: var(--spacing-xl);
}

.app-settings-back-link {
  display: inline-flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.app-settings-back-link:hover {
  color: var(--color-text-primary);
}

.app-settings-back-link:focus-visible {
  border-radius: var(--radius-sm);
  box-shadow: var(--focus-ring);
  outline: none;
}

.app-settings-title {
  margin: 0;
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.app-settings-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

@media (width <= 767px) {
  .app-settings-root {
    padding: var(--spacing-md);
  }
}
</style>
