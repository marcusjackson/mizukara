/**
 * Test helper for testing composables
 *
 * Wraps a composable call in a Vue component context
 * so it has access to lifecycle hooks.
 */

import { createApp, defineComponent } from 'vue'

import type { App } from 'vue'

/**
 * Wraps a composable in a test component for proper lifecycle management
 *
 * @param composable - Function that calls the composable
 * @returns Tuple of [result, app] - result is the composable return, app can be unmounted
 */
export function withSetup<T>(composable: () => T): [T, App] {
  let result: T

  const app = createApp(
    defineComponent({
      setup() {
        result = composable()
        return () => null
      }
    })
  )

  app.mount(document.createElement('div'))

  // @ts-expect-error - result is assigned in setup()
  return [result, app]
}
