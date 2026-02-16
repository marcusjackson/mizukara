/**
 * Browser lifecycle event handlers for database persistence
 *
 * Attaches listeners to save the database when the app goes to background
 * or when the page is about to unload. Critical for Android PWA where the
 * WebView may be killed while backgrounded.
 */

import { persistImmediately, persistSync } from './indexeddb'

let lifecycleListenersAttached = false

/**
 * Handle visibility change - save when app goes to background.
 * Critical for Android PWA where the WebView may be killed while backgrounded.
 */
function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    // Use async persist but don't await - we want to start it immediately
    void persistImmediately()
  }
}

/**
 * Handle page hide - more reliable than beforeunload on mobile.
 */
function handlePageHide(): void {
  // On page hide, use sync persist as async may not complete
  persistSync()
}

/**
 * Handle before unload - last chance to save.
 */
function handleBeforeUnload(): void {
  persistSync()
}

/**
 * Attach lifecycle listeners for persistence.
 * Called once during first database initialization.
 */
export function attachLifecycleListeners(): void {
  if (lifecycleListenersAttached) return

  // visibilitychange is the most reliable for mobile PWAs
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // pagehide is more reliable than beforeunload on some browsers
  window.addEventListener('pagehide', handlePageHide)

  // beforeunload as a fallback
  window.addEventListener('beforeunload', handleBeforeUnload)

  lifecycleListenersAttached = true
}
