/**
 * useTheme
 *
 * Composable for managing app theme (light/dark mode).
 * Uses localStorage to persist user preference, falls back to system preference.
 */

import { ref, watch } from 'vue'

import type { Ref } from 'vue'

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
  const stored = localStorage.getItem(STORAGE_KEY)
  const isValidTheme = (value: string | null): value is Theme =>
    value === 'light' || value === 'dark'
  if (isValidTheme(stored)) {
    return stored
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

let initialized = false

/**
 * Interface for theme management composable return value
 */
export interface UseTheme {
  /** The current active theme */
  theme: Ref<Theme>
  /** Toggle between light and dark themes */
  toggleTheme: () => void
  /** Set the theme explicitly */
  setTheme: (newTheme: Theme) => void
}

/**
 * Composable for managing the application theme (light/dark mode).
 *
 * Uses a singleton pattern — state is shared across all callers.
 * Persists the user preference to localStorage and falls back
 * to the system preference on first load.
 *
 * @returns Reactive theme state and toggle/set functions
 * @example
 * const { theme, toggleTheme, setTheme } = useTheme()
 * setTheme('dark')
 */
export function useTheme(): UseTheme {
  if (!initialized) {
    initialized = true
    // Initialize theme on first use
    applyTheme(theme.value)
    // Watch for changes and persist
    watch(theme, (newTheme) => {
      applyTheme(newTheme)
      localStorage.setItem(STORAGE_KEY, newTheme)
    })
  }

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
