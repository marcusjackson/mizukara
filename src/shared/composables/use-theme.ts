/**
 * useTheme
 *
 * Composable for managing app theme (light/dark mode).
 * Uses localStorage to persist user preference, falls back to system preference.
 */

import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'mizukara-theme'

/**
 * Gets the system's preferred color scheme
 */
function getSystemTheme(): Theme {
  if (globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * Gets the initial theme: user's saved preference or system preference
 */
function getInitialTheme(): Theme {
  const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (storedTheme) {
    return storedTheme
  }
  return getSystemTheme()
}

/**
 * Applies the theme to the document
 */
function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  if (theme === 'dark') {
    document.documentElement.dataset['theme'] = 'dark'
  } else {
    delete document.documentElement.dataset['theme']
  }
}

// Shared reactive state (singleton pattern)
const theme = ref<Theme>(getInitialTheme())

// Initialize theme on module load
applyTheme(theme.value)

// Watch for changes and persist
watch(theme, (newTheme) => {
  applyTheme(newTheme)
  localStorage.setItem(STORAGE_KEY, newTheme)
})

export function useTheme() {
  /**
   * Toggles between light and dark themes
   */
  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  /**
   * Sets the theme explicitly
   */
  function setTheme(newTheme: Theme): void {
    theme.value = newTheme
  }

  return {
    setTheme,
    theme,
    toggleTheme
  }
}
