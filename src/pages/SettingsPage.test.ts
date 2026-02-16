/**
 * Tests for SettingsPage
 *
 * Thin page wrapper for the settings route.
 * Delegates all UI to AppSettingsRoot module component.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SettingsPage from './SettingsPage.vue'

// Mock child components
vi.mock('@/modules/app-settings/components/AppSettingsRoot.vue', () => ({
  default: {
    name: 'AppSettingsRoot',
    template: '<div data-testid="app-settings-root">AppSettingsRoot</div>'
  }
}))

vi.mock('@/base/components', () => ({
  BaseToast: {
    name: 'BaseToast',
    template: '<div data-testid="base-toast" />'
  }
}))

describe('SettingsPage', () => {
  it('renders AppSettingsRoot component', () => {
    const wrapper = mount(SettingsPage)

    expect(wrapper.find('[data-testid="app-settings-root"]').exists()).toBe(
      true
    )
  })

  it('renders BaseToast for notifications', () => {
    const wrapper = mount(SettingsPage)

    expect(wrapper.find('[data-testid="base-toast"]').exists()).toBe(true)
  })
})
