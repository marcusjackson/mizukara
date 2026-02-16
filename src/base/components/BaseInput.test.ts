/**
 * Tests for BaseInput component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import BaseInput from './BaseInput.vue'

describe('BaseInput', () => {
  it('renders with label', () => {
    render(BaseInput, {
      props: { label: 'Character' }
    })

    expect(screen.getByLabelText('Character')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(BaseInput, {
      props: { placeholder: 'Enter text' }
    })

    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('displays required indicator', () => {
    render(BaseInput, {
      props: { label: 'Character', required: true }
    })

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(BaseInput, {
      props: { error: 'This field is required', label: 'Character' }
    })

    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('error')
    )
  })

  it('disables input when disabled prop is true', () => {
    render(BaseInput, {
      props: { disabled: true, label: 'Character' }
    })

    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('updates model value on input', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(BaseInput, {
      props: {
        label: 'Character',
        modelValue: '',
        'onUpdate:modelValue': onUpdate
      }
    })

    await user.type(screen.getByRole('textbox'), '日')
    expect(onUpdate).toHaveBeenCalledWith('日')
  })

  it('renders with different input types', () => {
    render(BaseInput, {
      props: { label: 'Count', type: 'number' }
    })

    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })

  it('applies error styling when error is present', () => {
    render(BaseInput, {
      props: { error: 'Error', label: 'Character' }
    })

    expect(screen.getByRole('textbox')).toHaveClass('base-input-field-error')
  })

  it('applies disabled styling when disabled', () => {
    render(BaseInput, {
      props: { disabled: true, label: 'Character' }
    })

    expect(screen.getByRole('textbox')).toHaveClass('base-input-field-disabled')
  })

  it('passes name attribute to input', () => {
    render(BaseInput, {
      props: { label: 'Character', name: 'character' }
    })

    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'character')
  })
})
