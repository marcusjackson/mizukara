/**
 * Tests for AppSettingsRoot component
 *
 * Root component for the settings page.
 * Renders page title, back navigation, and settings sections.
 */

import { createMemoryHistory, createRouter } from 'vue-router'

import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import AppSettingsRoot from './AppSettingsRoot.vue'

import type { Router } from 'vue-router'

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/settings', component: { template: '<div />' } },
      {
        path: '/entries/:date?',
        name: 'entry-day-view',
        component: { template: '<div />' }
      }
    ]
  })
}

function renderRoot(router?: Router) {
  const testRouter = router ?? createTestRouter()
  return render(AppSettingsRoot, {
    global: {
      plugins: [testRouter],
      stubs: {
        AppSettingsSectionAppearance: {
          template: '<section aria-label="Appearance">Appearance</section>'
        },
        AppSettingsSectionDatabase: {
          template: '<section aria-label="Database">Database</section>'
        },
        AppSettingsSectionDeviceSync: {
          template: '<section aria-label="Device sync">Sync</section>'
        },
        AppSettingsSectionLocalInference: {
          template:
            '<section aria-label="Tag suggestions">Tag suggestions</section>'
        }
      }
    }
  })
}

describe('AppSettingsRoot', () => {
  it('renders page title', () => {
    renderRoot()

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders back link', () => {
    renderRoot()

    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it.each([
    ['appearance', 'Appearance'],
    ['database', 'Database'],
    ['device sync', 'Device sync'],
    ['tag suggestion', 'Tag suggestions']
  ])('renders %s section', (_label, name) => {
    renderRoot()

    expect(screen.getByRole('region', { name })).toBeInTheDocument()
  })

  it('has accessible page structure', () => {
    renderRoot()

    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
