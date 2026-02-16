/**
 * Render Test Helpers
 *
 * Utilities for rendering Vue components in tests.
 */

import { createMemoryHistory, createRouter } from 'vue-router'

import { render } from '@testing-library/vue'

import type { RenderResult } from '@testing-library/vue'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

interface RenderWithProvidersOptions {
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  /** Initial route path (default: '/') */
  initialRoute?: string
  /** Additional global options (stubs, etc.) */
  global?: {
    stubs?: Record<string, unknown>
  }
}

// Minimal routes for test router
const testRoutes: RouteRecordRaw[] = [
  { path: '/', component: { template: '<div />' } },
  { path: '/kanji', component: { template: '<div />' } },
  { path: '/kanji/new', component: { template: '<div />' } },
  { path: '/kanji/:id', component: { template: '<div />' } },
  { path: '/kanji/:id/edit', component: { template: '<div />' } },
  { path: '/components', component: { template: '<div />' } },
  { path: '/components/:id', component: { template: '<div />' } },
  { path: '/components/:id/edit', component: { template: '<div />' } },
  { path: '/vocabulary', component: { template: '<div />' } },
  { path: '/vocabulary/:id', component: { template: '<div />' } },
  { path: '/settings', component: { template: '<div />' } },
  // Coming soon for new UI testing
  { path: '/coming-soon', component: { template: '<div />' } }
]

/**
 * Render a component with common providers (router, etc.)
 *
 * Use this when testing components that need app-level providers.
 */
export function renderWithProviders(
  component: Component,
  options: RenderWithProvidersOptions = {}
): RenderResult {
  const { global: globalOpts, initialRoute = '/', ...restOptions } = options

  const router = createRouter({
    history: createMemoryHistory(),
    routes: testRoutes
  })

  void router.push(initialRoute)

  return render(component, {
    ...restOptions,
    global: {
      plugins: [router],
      stubs: {
        // Stub RouterView by default (RouterLink uses actual router)
        RouterView: {
          template: '<div />'
        },
        // Merge in custom stubs
        ...globalOpts?.stubs
      }
    }
  })
}

/**
 * Re-export testing library utilities for convenience
 */
export { default as userEvent } from '@testing-library/user-event'
export { render } from '@testing-library/vue'
