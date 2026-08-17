/**
 * Tests for SettingsPage
 *
 * Thin page wrapper for the settings route.
 * Delegates all UI to AppSettingsRoot module component.
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import SettingsPage from './SettingsPage.vue'

// Mock child components to isolate the page wrapper
vi.mock('@/modules/app-settings/components/AppSettingsRoot.vue', () => ({
  default: {
    name: 'AppSettingsRoot',
    template: '<main aria-label="App Settings">AppSettingsRoot</main>'
  }
}))

vi.mock('@/shared/components', () => ({
  SharedToast: {
    name: 'SharedToast',
    template: '<div role="status" aria-label="Notifications"></div>'
  }
}))

describe('SettingsPage', () => {
  it('renders AppSettingsRoot component', () => {
    render(SettingsPage)

    expect(
      screen.getByRole('main', { name: /app settings/i })
    ).toBeInTheDocument()
  })

  it('renders SharedToast for notifications', () => {
    render(SettingsPage)

    expect(
      screen.getByRole('status', { name: /notifications/i })
    ).toBeInTheDocument()
  })
})
