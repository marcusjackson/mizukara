<script setup lang="ts">
/**
 * SharedKeyboardShortcutsHelp
 *
 * Displays a keyboard shortcuts reference dialog.
 * Includes a "?" trigger button and registers the "?" keyboard shortcut
 * to open the dialog when no input is focused.
 *
 * @requirements 7.5, 7.6
 */

import { ref } from 'vue'

import BaseDialog from '@/base/components/BaseDialog.vue'

import { useKeyboardShortcuts } from '@/shared/composables/use-keyboard-shortcuts'

interface ShortcutEntry {
  keys: string
  description: string
}

const isOpen = ref(false)

const isMac =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')
const modKey = isMac ? 'Cmd' : 'Ctrl'

const shortcuts: ShortcutEntry[] = [
  { keys: `${modKey} + N`, description: 'Create new entry' },
  { keys: 'J', description: 'Next day' },
  { keys: 'K', description: 'Previous day' },
  { keys: 'G', description: 'Jump to date' },
  { keys: `${modKey} + S`, description: 'Save entry' },
  { keys: 'Escape', description: 'Cancel / Clear' },
  { keys: '?', description: 'Show keyboard shortcuts' }
]

// Register "?" shortcut to open help dialog
useKeyboardShortcuts([
  {
    key: '?',
    handler: () => {
      isOpen.value = !isOpen.value
    }
  }
])
</script>

<template>
  <div class="shortcuts-help">
    <button
      aria-label="Keyboard shortcuts"
      class="shortcuts-help-trigger"
      type="button"
      @click="isOpen = true"
    >
      ?
    </button>

    <BaseDialog
      v-model:open="isOpen"
      description="Available keyboard shortcuts for this page."
      title="Keyboard Shortcuts"
    >
      <dl class="shared-keyboard-shortcuts-list">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.keys"
          class="shared-keyboard-shortcuts-item"
        >
          <dt class="shared-keyboard-shortcuts-keys">
            <kbd>{{ shortcut.keys }}</kbd>
          </dt>
          <dd class="shared-keyboard-shortcuts-description">
            {{ shortcut.description }}
          </dd>
        </div>
      </dl>
    </BaseDialog>
  </div>
</template>

<style scoped>
.shortcuts-help {
  display: inline-block;
}

/* Hide on mobile devices (< 768px) since keyboards are rarely used */
@media (width < 768px) {
  .shortcuts-help {
    display: none;
  }
}

.shortcuts-help-trigger {
  display: flex;
  justify-content: center;
  align-items: center;
  width: var(--spacing-9);
  height: var(--spacing-9);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.shortcuts-help-trigger:hover {
  background-color: var(--color-surface-hover);
}

.shortcuts-help-trigger:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}
</style>

<!--
  Global styles for dialog content rendered via Portal.
  The dialog content is teleported outside the component tree.
-->
<style>
.shared-keyboard-shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
}

.shared-keyboard-shortcuts-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.shared-keyboard-shortcuts-item:last-child {
  border-bottom: none;
}

.shared-keyboard-shortcuts-keys {
  flex-shrink: 0;
}

.shared-keyboard-shortcuts-keys kbd {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-family-mono, monospace);
  font-size: var(--font-size-sm);
}

.shared-keyboard-shortcuts-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  text-align: right;
}
</style>
