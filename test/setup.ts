/**
 * Vitest Test Setup
 *
 * This file runs before each test file.
 * Sets up testing-library matchers and global test utilities.
 */

import { cleanup } from '@testing-library/vue'
import { afterEach } from 'vitest'

import { detachLifecycleListeners } from '@/db/lifecycle'

import '@testing-library/jest-dom/vitest'

// Clean up DOM after each test
// eslint-disable-next-line vitest/require-top-level-describe
afterEach(() => {
  cleanup()
  detachLifecycleListeners()
})

// Mock scrollIntoView for jsdom (not implemented)
// This is needed for Reka UI components that use scrollIntoView
Element.prototype.scrollIntoView = () => {
  // No-op for jsdom environment
}

// Mock matchMedia for jsdom (not implemented)
// This is needed for theme detection with prefers-color-scheme
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {
      // No-op for jsdom
    },
    removeListener: () => {
      // No-op for jsdom
    },
    addEventListener: () => {
      // No-op for jsdom
    },
    removeEventListener: () => {
      // No-op for jsdom
    },
    dispatchEvent: () => true
  })
})

// Mock ResizeObserver for jsdom (not implemented)
// This is needed for Reka UI Tooltip and other components
class ResizeObserverMock {
  observe() {
    // No-op
  }
  unobserve() {
    // No-op
  }
  disconnect() {
    // No-op
  }
}
globalThis.ResizeObserver = ResizeObserverMock

// Mock URL.createObjectURL and revokeObjectURL for jsdom
// This is needed for blob URL creation in file input components
// UUID-based URLs avoid test-order dependencies from counter-based values
globalThis.URL.createObjectURL = (_blob: Blob): string => {
  return `blob:mock-url-${crypto.randomUUID()}`
}

globalThis.URL.revokeObjectURL = (_url: string): void => {
  // No-op for jsdom environment
}
