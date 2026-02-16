/**
 * Tests for BaseSwitch component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseSwitch from './BaseSwitch.vue'

describe('BaseSwitch', () => {
  it('renders with label text', () => {
    render(BaseSwitch, {
      props: {
        label: 'Enable notifications',
        modelValue: false
      }
    })

    expect(screen.getByText('Enable notifications')).toBeInTheDocument()
  })

  it('renders with slot content', () => {
    render(BaseSwitch, {
      props: { modelValue: false },
      slots: {
        default: '<span>Custom label</span>'
      }
    })

    expect(screen.getByText('Custom label')).toBeInTheDocument()
  })

  it('renders checked state correctly', () => {
    render(BaseSwitch, {
      props: {
        label: 'Toggle on',
        modelValue: true
      }
    })

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('data-state', 'checked')
    expect(switchElement).toHaveAttribute('aria-checked', 'true')
  })

  it('renders unchecked state correctly', () => {
    render(BaseSwitch, {
      props: {
        label: 'Toggle off',
        modelValue: false
      }
    })

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('data-state', 'unchecked')
    expect(switchElement).toHaveAttribute('aria-checked', 'false')
  })

  it('emits update:modelValue when clicked', async () => {
    const user = userEvent.setup()
    const wrapper = render(BaseSwitch, {
      props: {
        label: 'Click me',
        modelValue: false
      }
    })

    const switchElement = screen.getByRole('switch')
    await user.click(switchElement)

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeDefined()
    expect(events).toHaveLength(1)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (events) {
      expect(events[0]).toEqual([true])
    }
  })

  it('toggles state when clicked multiple times', async () => {
    const user = userEvent.setup()
    const wrapper = render(BaseSwitch, {
      props: {
        label: 'Toggle me',
        modelValue: false
      }
    })

    const switchElement = screen.getByRole('switch')

    // First click - turn on
    await user.click(switchElement)
    let events = wrapper.emitted('update:modelValue')
    expect(events).toBeDefined()
    expect(events[0]).toEqual([true])

    // Update props to reflect new state
    await wrapper.rerender({ modelValue: true })

    // Second click - turn off
    await user.click(switchElement)
    events = wrapper.emitted('update:modelValue')
    expect(events).toBeDefined()
    expect(events[1]).toEqual([false])
  })

  it('can be disabled', async () => {
    const user = userEvent.setup()
    const wrapper = render(BaseSwitch, {
      props: {
        disabled: true,
        label: 'Disabled switch',
        modelValue: false
      }
    })

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('data-disabled', '')

    await user.click(switchElement)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('displays error message when error prop is provided', () => {
    render(BaseSwitch, {
      props: {
        error: 'This setting is required',
        label: 'Required switch',
        modelValue: false
      }
    })

    expect(screen.getByText('This setting is required')).toBeInTheDocument()
  })

  it('does not display error message when error prop is empty', () => {
    render(BaseSwitch, {
      props: {
        error: '',
        label: 'Optional switch',
        modelValue: false
      }
    })

    expect(
      screen.queryByText('This setting is required')
    ).not.toBeInTheDocument()
  })

  it('is keyboard accessible', async () => {
    const user = userEvent.setup()
    const wrapper = render(BaseSwitch, {
      props: {
        label: 'Keyboard test',
        modelValue: false
      }
    })

    const switchElement = screen.getByRole('switch')
    switchElement.focus()
    expect(switchElement).toHaveFocus()

    await user.keyboard(' ')
    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeDefined()
    expect(events[0]).toEqual([true])
  })

  it('can be toggled with Enter key', async () => {
    const user = userEvent.setup()
    const wrapper = render(BaseSwitch, {
      props: {
        label: 'Enter key test',
        modelValue: false
      }
    })

    const switchElement = screen.getByRole('switch')
    switchElement.focus()

    await user.keyboard('{Enter}')
    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeDefined()
    expect(events[0]).toEqual([true])
  })

  it('renders without label', () => {
    const { container } = render(BaseSwitch, {
      props: {
        modelValue: false
      }
    })

    const label = container.querySelector('.base-switch-label')
    expect(label).not.toBeInTheDocument()
  })
})
