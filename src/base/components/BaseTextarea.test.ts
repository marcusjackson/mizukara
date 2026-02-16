/**
 * Tests for BaseTextarea component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import BaseTextarea from './BaseTextarea.vue'

describe('BaseTextarea', () => {
  it('renders with label', () => {
    render(BaseTextarea, {
      props: { label: 'Description' }
    })

    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(BaseTextarea, {
      props: { placeholder: 'Enter description' }
    })

    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('displays required indicator', () => {
    render(BaseTextarea, {
      props: { label: 'Description', required: true }
    })

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(BaseTextarea, {
      props: { error: 'This field is required', label: 'Description' }
    })

    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('error')
    )
  })

  it('disables textarea when disabled prop is true', () => {
    render(BaseTextarea, {
      props: { disabled: true, label: 'Description' }
    })

    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('updates model value on input', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(BaseTextarea, {
      props: {
        label: 'Description',
        modelValue: '',
        'onUpdate:modelValue': onUpdate
      }
    })

    await user.type(screen.getByRole('textbox'), 'Test text')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('applies error styling when error is present', () => {
    render(BaseTextarea, {
      props: { error: 'Error', label: 'Description' }
    })

    expect(screen.getByRole('textbox')).toHaveClass('base-textarea-field-error')
  })

  it('applies disabled styling when disabled', () => {
    render(BaseTextarea, {
      props: { disabled: true, label: 'Description' }
    })

    expect(screen.getByRole('textbox')).toHaveClass(
      'base-textarea-field-disabled'
    )
  })

  it('passes name attribute to textarea', () => {
    render(BaseTextarea, {
      props: { label: 'Description', name: 'description' }
    })

    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'description')
  })

  it('uses default rows when not specified', () => {
    render(BaseTextarea, {
      props: { label: 'Description' }
    })

    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4')
  })

  it('uses custom rows when specified', () => {
    render(BaseTextarea, {
      props: { label: 'Description', rows: 6 }
    })

    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6')
  })
})
