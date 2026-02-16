/**
 * Tests for BaseSelect component
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseSelect from './BaseSelect.vue'

const testOptions = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' }
]

describe('BaseSelect', () => {
  it('renders with label', () => {
    render(BaseSelect, {
      props: { label: 'Level', options: testOptions }
    })

    expect(screen.getByText('Level')).toBeInTheDocument()
  })

  it('renders trigger with placeholder', () => {
    render(BaseSelect, {
      props: { options: testOptions, placeholder: 'Select an option...' }
    })

    expect(screen.getByText('Select an option...')).toBeInTheDocument()
  })

  it('displays required indicator', () => {
    render(BaseSelect, {
      props: { label: 'Level', options: testOptions, required: true }
    })

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(BaseSelect, {
      props: {
        error: 'Selection required',
        label: 'Level',
        options: testOptions
      }
    })

    expect(screen.getByText('Selection required')).toBeInTheDocument()
  })

  it('disables select when disabled prop is true', () => {
    render(BaseSelect, {
      props: { disabled: true, label: 'Level', options: testOptions }
    })

    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('renders combobox role', () => {
    render(BaseSelect, {
      props: { label: 'Level', options: testOptions }
    })

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('applies error styling when error is present', () => {
    render(BaseSelect, {
      props: { error: 'Error', label: 'Level', options: testOptions }
    })

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders default placeholder when not specified', () => {
    render(BaseSelect, {
      props: { label: 'Level', options: testOptions }
    })

    expect(screen.getByText('Select...')).toBeInTheDocument()
  })
})
