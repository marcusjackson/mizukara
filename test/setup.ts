/**
 * Vitest Test Setup
 *
 * This file runs before each test file.
 * Sets up testing-library matchers and global test utilities.
 */

import '@testing-library/jest-dom/vitest'

// Mock scrollIntoView for jsdom (not implemented)
// This is needed for Reka UI components that use scrollIntoView
Element.prototype.scrollIntoView = () => {
  // No-op for jsdom environment
}

// Mock matchMedia for jsdom (not implemented)
// This is needed for theme detection with prefers-color-scheme
Object.defineProperty(window, 'matchMedia', {
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
global.ResizeObserver = ResizeObserverMock

// Mock URL.createObjectURL and revokeObjectURL for jsdom
// This is needed for blob URL creation in file input components
let urlCounter = 0
const urlMap = new Map<string, Blob>()

global.URL.createObjectURL = (blob: Blob): string => {
  const url = `blob:mock-url-${String(urlCounter++)}`
  urlMap.set(url, blob)
  return url
}

global.URL.revokeObjectURL = (url: string): void => {
  urlMap.delete(url)
}
