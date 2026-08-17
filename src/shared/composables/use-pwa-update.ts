/**
 * PWA Update Composable
 *
 * Wraps vite-plugin-pwa's registerType: 'prompt' service worker registration.
 * A new service worker installs and waits until this reload is triggered —
 * without it, updates only apply once every open tab/window is fully closed.
 */

import { useRegisterSW } from 'virtual:pwa-register/vue'

import type { Ref } from 'vue'

export interface UsePwaUpdate {
  /** True once a new service worker has installed and is waiting to activate */
  needRefresh: Ref<boolean>
  /** Activates the waiting service worker and reloads the page */
  reload: () => Promise<void>
}

/**
 * Surfaces PWA service worker updates so the app can prompt the user to reload.
 *
 * @returns Reactive update-available state and a function to apply it
 * @example
 * const { needRefresh, reload } = usePwaUpdate()
 */
export function usePwaUpdate(): UsePwaUpdate {
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  async function reload(): Promise<void> {
    await updateServiceWorker(true)
  }

  return { needRefresh, reload }
}
