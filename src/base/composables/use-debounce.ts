/**
 * useDebounce Composable
 *
 * Creates a debounced version of a value that only updates after a delay.
 * Useful for search inputs to reduce API calls/filtering frequency.
 */

import { customRef } from 'vue'

import type { Ref } from 'vue'

/**
 * Creates a debounced ref that delays updating its value.
 *
 * @param initialValue - The initial value
 * @param delay - Debounce delay in milliseconds (default: 150)
 * @returns A ref that debounces value updates
 *
 * @example
 * ```ts
 * const searchQuery = useDebounce('', 200)
 * // Updates to searchQuery.value are debounced by 200ms
 * ```
 */
export function useDebounce<T>(initialValue: T, delay = 150): Ref<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let currentValue = initialValue

  return customRef((track, trigger) => ({
    get() {
      track()
      return currentValue
    },
    set(newValue: T) {
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(() => {
        currentValue = newValue
        trigger()
      }, delay)
    }
  }))
}
