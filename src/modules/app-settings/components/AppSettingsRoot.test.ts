/**
 * Tests for AppSettingsRoot component
 *
 * Root component for the settings page.
 * Renders page title, back navigation, and settings sections.
 */

import { createMemoryHistory, createRouter } from 'vue-router'

import { mount } from '@vue/test-utils'
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

function mountRoot(router?: Router) {
  const testRouter = router ?? createTestRouter()
  return mount(AppSettingsRoot, {
    global: {
      plugins: [testRouter],
      stubs: {
        AppSettingsSectionAppearance: {
          template: '<div data-testid="appearance-section">Appearance</div>'
        },
        AppSettingsSectionDatabase: {
          template: '<div data-testid="database-section">Database</div>'
        },
        AppSettingsSectionDeviceSync: {
          template: '<div data-testid="device-sync-section">Sync</div>'
        }
      }
    }
  })
}

describe('AppSettingsRoot', () => {
  it('renders page title', () => {
    const wrapper = mountRoot()

    expect(wrapper.text()).toContain('Settings')
  })

  it('renders back link', () => {
    const wrapper = mountRoot()
    const backLink = wrapper.find('a')

    expect(backLink.exists()).toBe(true)
  })

  it('renders appearance section', () => {
    const wrapper = mountRoot()

    expect(wrapper.find('[data-testid="appearance-section"]').exists()).toBe(
      true
    )
  })

  it('renders database section', () => {
    const wrapper = mountRoot()

    expect(wrapper.find('[data-testid="database-section"]').exists()).toBe(true)
  })

  it('renders device sync section', () => {
    const wrapper = mountRoot()

    expect(wrapper.find('[data-testid="device-sync-section"]').exists()).toBe(
      true
    )
  })

  it('has accessible page structure', () => {
    const wrapper = mountRoot()
    const main = wrapper.find('main')

    expect(main.exists()).toBe(true)
  })
})
