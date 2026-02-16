import { onMounted, onUnmounted } from 'vue'

interface KeyboardShortcut {
  /** Key combination (e.g., "cmd+n", "k", "escape") */
  key: string
  /** Callback function */
  handler: (event: KeyboardEvent) => void
  /** Prevent default browser behavior */
  preventDefault?: boolean
}

/** Keys that should only trigger when no input is focused */
const NAVIGATION_KEYS = ['j', 'k', 'arrowup', 'arrowdown'] as const

type NavigationKey = (typeof NAVIGATION_KEYS)[number]

/**
 * Key aliases for Vim-style navigation
 *
 * Maps J/K to arrow keys for consistent navigation behavior
 */
const KEY_ALIASES = new Map<string, string>([
  ['k', 'arrowup'],
  ['j', 'arrowdown']
])

/**
 * Register global keyboard shortcuts with context-aware behavior
 *
 * Navigation shortcuts (J/K) only work when input elements are not focused.
 * Save shortcuts (Cmd/Ctrl+S) only work when textarea is focused.
 * Escape works in any context (handler determines behavior).
 *
 * Cross-platform support:
 * - 'cmd+key' uses Cmd on Mac, Ctrl on Windows/Linux
 * - 'ctrl+key' uses Ctrl on all platforms
 *
 * @param shortcuts - Array of shortcuts to register
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 'cmd+n', handler: createNewEntry },
 *   { key: 'j', handler: navigateNext },
 *   { key: 'escape', handler: cancelEdit }
 * ])
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  const handleKeydown = (event: KeyboardEvent) => {
    // Parse the key combination
    for (const shortcut of shortcuts) {
      if (matchesShortcut(event, shortcut.key)) {
        // Check context awareness
        if (shouldTriggerShortcut(shortcut.key)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.handler(event)
        }
        break
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}

/**
 * Check if keyboard event matches the given shortcut
 *
 * Handles cross-platform Cmd/Ctrl properly:
 * - 'cmd+key' on Mac uses metaKey, on Windows/Linux uses ctrlKey
 * - 'ctrl+key' always uses ctrlKey (all platforms)
 *
 * Uses KEY_ALIASES for Vim-style navigation (J/K → Arrow keys)
 */
function matchesShortcut(event: KeyboardEvent, keyCombo: string): boolean {
  const normalizedKeyCombo = keyCombo.toLowerCase()
  const parts = normalizedKeyCombo.split('+')
  const key = parts.at(-1) ?? ''
  const modifiers = new Set(parts.slice(0, -1))

  const eventKey = event.key.toLowerCase()
  const eventCode = event.code.toLowerCase()

  // Check key match with aliases
  const aliasedKey = KEY_ALIASES.get(key) ?? key
  const keyMatches =
    eventKey === key || eventKey === aliasedKey || eventCode === 'key' + key

  if (!keyMatches) return false

  // Platform-aware modifier checking
  const hasCmd = modifiers.has('cmd')
  const hasCtrl = modifiers.has('ctrl')

  if (hasCmd) {
    // 'cmd' means metaKey on Mac, ctrlKey on Windows/Linux
    const isMac =
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')
    return isMac ? event.metaKey : event.ctrlKey
  }

  if (hasCtrl) {
    // 'ctrl' always means ctrlKey on all platforms
    return event.ctrlKey
  }

  // No modifiers specified, or all matched
  return true
}

/**
 * Check if element is an input field (input or textarea)
 */
function isInputElement(element: Element | null): boolean {
  return element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA'
}

/**
 * Determine if shortcut should trigger based on current focus context
 */
function shouldTriggerShortcut(keyCombo: string): boolean {
  const activeElement = document.activeElement
  const normalizedCombo = keyCombo.toLowerCase()

  // Navigation shortcuts (J/K/Arrow) only when no input focused
  if (NAVIGATION_KEYS.includes(normalizedCombo as NavigationKey)) {
    return !isInputElement(activeElement)
  }

  // Save shortcut (cmd/ctrl+s) when textarea focused
  if (normalizedCombo.includes('s')) {
    return activeElement?.tagName === 'TEXTAREA'
  }

  // Escape always triggers, but context handled in handler
  if (normalizedCombo === 'escape') {
    return true
  }

  // Other shortcuts (like cmd+n) when no input focused
  return !isInputElement(activeElement)
}
