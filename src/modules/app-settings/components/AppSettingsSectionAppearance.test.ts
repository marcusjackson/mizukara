/**
 * Tests for AppSettingsSectionAppearance component
 *
 * Section component for theme toggle and app version display.
 * Uses useTheme composable and __APP_VERSION__ build constant.
 */

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppSettingsSectionAppearance from './AppSettingsSectionAppearance.vue'

// Mock useTheme composable
const mockToggleTheme = vi.fn()
const mockTheme = { value: 'light' as 'light' | 'dark' }

vi.mock('@/shared/composables/use-theme', () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
    setTheme: vi.fn()
  })
}))

const rekaUiStubs = {
  SwitchRoot: {
    template:
      '<button role="switch" :aria-checked="String(modelValue)" :aria-label="ariaLabel" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>',
    props: ['modelValue', 'ariaLabel'],
    emits: ['update:modelValue']
  },
  SwitchThumb: { template: '<span />' }
}

function mountAppearance() {
  return mount(AppSettingsSectionAppearance, {
    global: {
      stubs: rekaUiStubs
    }
  })
}

describe('AppSettingsSectionAppearance', () => {
  beforeEach(() => {
    mockTheme.value = 'light'
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockTheme.value = 'light'
  })

  it('renders section title', () => {
    const wrapper = mountAppearance()

    expect(wrapper.text()).toContain('Appearance')
  })

  it('displays app version from __APP_VERSION__', () => {
    const wrapper = mountAppearance()

    // vitest.config.ts defines __APP_VERSION__ as '0.3.0'
    expect(wrapper.text()).toContain('0.3.0')
  })

  it('renders theme toggle switch', () => {
    const wrapper = mountAppearance()
    const switchElement = wrapper.find('[role="switch"]')

    expect(switchElement.exists()).toBe(true)
  })

  it('switch reflects current theme (unchecked for light)', () => {
    mockTheme.value = 'light'
    const wrapper = mountAppearance()
    const switchElement = wrapper.find('[role="switch"]')

    expect(switchElement.attributes('aria-checked')).toBe('false')
  })

  it('switch reflects current theme (checked for dark)', () => {
    mockTheme.value = 'dark'
    const wrapper = mountAppearance()
    const switchElement = wrapper.find('[role="switch"]')

    expect(switchElement.attributes('aria-checked')).toBe('true')
  })

  it('calls toggleTheme when switch is clicked', async () => {
    const wrapper = mountAppearance()
    const switchElement = wrapper.find('[role="switch"]')

    await switchElement.trigger('click')

    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('switch has accessible ARIA label', () => {
    const wrapper = mountAppearance()
    const switchElement = wrapper.find('[role="switch"]')

    expect(switchElement.attributes('aria-label')).toBe('Toggle dark mode')
  })

  it('displays version label', () => {
    const wrapper = mountAppearance()

    expect(wrapper.text()).toContain('Version')
  })

  it('displays theme label', () => {
    const wrapper = mountAppearance()

    expect(wrapper.text()).toContain('Theme')
  })

  it('displays "Light mode" description when theme is light', () => {
    mockTheme.value = 'light'
    const wrapper = mountAppearance()

    expect(wrapper.text()).toContain('Light mode')
  })

  it('displays "Dark mode" description when theme is dark', () => {
    mockTheme.value = 'dark'
    const wrapper = mountAppearance()

    expect(wrapper.text()).toContain('Dark mode')
  })
})
