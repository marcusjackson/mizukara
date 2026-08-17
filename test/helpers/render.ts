/**
 * Render Test Helpers
 *
 * Utilities for rendering Vue components in tests.
 */

import { createMemoryHistory, createRouter } from 'vue-router'

import { render } from '@testing-library/vue'

import { ROUTES } from '@/router/routes'

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

// Routes derived from actual path constants — stubs components to avoid importing full pages
const testRoutes: RouteRecordRaw[] = [
  { path: ROUTES.HOME, redirect: ROUTES.ENTRY_DAY },
  { path: ROUTES.ENTRY_DAY, component: { template: '<div />' } },
  { path: ROUTES.SETTINGS, component: { template: '<div />' } },
  { path: '/:pathMatch(.*)*', component: { template: '<div />' } }
]

/**
 * Render a component with common providers (router, etc.)
 *
 * Use this when testing components that need app-level providers.
 * Returns a promise — await this call to ensure the router has navigated
 * to the initial route before assertions run.
 */
export async function renderWithProviders(
  component: Component,
  options: RenderWithProvidersOptions = {}
): Promise<RenderResult> {
  const { global: globalOpts, initialRoute = '/', ...restOptions } = options

  const router = createRouter({
    history: createMemoryHistory(),
    routes: testRoutes
  })

  await router.push(initialRoute)

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
