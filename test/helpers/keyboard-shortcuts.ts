/**
 * Keyboard Shortcut Test Helpers
 *
 * Shared by the useKeyboardShortcuts test files.
 */

import { defineComponent } from 'vue';

import { useKeyboardShortcuts } from '@/shared/composables/use-keyboard-shortcuts';

import type { KeyboardShortcut } from '@/shared/composables/use-keyboard-shortcuts';
import type { Component } from 'vue';

/** A component that registers the given shortcuts while mounted. */
export function shortcutsComponent(shortcuts: KeyboardShortcut[]): Component {
  return defineComponent({
    setup() {
      useKeyboardShortcuts(shortcuts);
    },
    template: '<div></div>',
  });
}

/** Point document.activeElement at the body, as navigation shortcuts expect. */
export function activeElementToBody(): void {
  Object.defineProperty(document, 'activeElement', {
    value: document.body,
    writable: true,
  });
}
