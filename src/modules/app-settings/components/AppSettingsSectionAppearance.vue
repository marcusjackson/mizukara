<script setup lang="ts">
/**
 * AppSettingsSectionAppearance
 *
 * Section component for theme toggle and app version display.
 * Theme switch toggles between light/dark mode via useTheme composable.
 * App version is injected at build time via Vite's __APP_VERSION__ constant.
 */

import { computed } from 'vue'

import { BaseSwitch } from '@/base/components'

import { useTheme } from '@/shared/composables/use-theme'

const { theme, toggleTheme } = useTheme()

const isDarkMode = computed(() => theme.value === 'dark')

/**
 * App version injected at build time by Vite's define plugin (vite.config.ts).
 * Declared as a TypeScript global in src/env.d.ts.
 */
// eslint-disable-next-line no-undef
const appVersion = __APP_VERSION__

function handleThemeToggle(): void {
  toggleTheme()
}
</script>

<template>
  <section
    aria-label="Appearance settings"
    class="app-settings-section"
  >
    <h2 class="app-settings-section-title">Appearance</h2>

    <div class="app-settings-option">
      <div class="app-settings-option-info">
        <span class="app-settings-option-label">Theme</span>
        <span class="app-settings-option-description">
          {{ isDarkMode ? 'Dark mode' : 'Light mode' }}
        </span>
      </div>
      <BaseSwitch
        aria-label="Toggle dark mode"
        :model-value="isDarkMode"
        @update:model-value="handleThemeToggle"
      />
    </div>

    <div class="app-settings-option">
      <div class="app-settings-option-info">
        <span class="app-settings-option-label">Version</span>
        <span class="app-settings-option-description">{{ appVersion }}</span>
      </div>
    </div>
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

.app-settings-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
  padding: var(--spacing-3) 0;
}

.app-settings-option + .app-settings-option {
  border-top: 1px solid var(--color-border);
}

.app-settings-option-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.app-settings-option-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.app-settings-option-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
