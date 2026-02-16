/**
 * Tests for BaseCombobox component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseCombobox from './BaseCombobox.vue'

const testOptions = [
  { label: 'Water (氵)', value: '1', character: '氵' },
  { label: 'Fire (火)', value: '2', character: '火' },
  { label: 'Tree (木)', value: '3', character: '木' }
]

describe('BaseCombobox', () => {
  it('renders with label', () => {
    render(BaseCombobox, {
      props: { label: 'Radical', modelValue: null, options: testOptions }
    })

    expect(screen.getByText('Radical')).toBeInTheDocument()
  })

  it('renders input with placeholder', () => {
    render(BaseCombobox, {
      props: {
        modelValue: null,
        options: testOptions,
        placeholder: 'Search...'
      }
    })

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('displays required indicator', () => {
    render(BaseCombobox, {
      props: {
        label: 'Radical',
        modelValue: null,
        options: testOptions,
        required: true
      }
    })

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(BaseCombobox, {
      props: {
        error: 'Selection required',
        label: 'Radical',
        modelValue: null,
        options: testOptions
      }
    })

    expect(screen.getByText('Selection required')).toBeInTheDocument()
  })

  it('renders combobox input', () => {
    render(BaseCombobox, {
      props: { label: 'Radical', modelValue: null, options: testOptions }
    })

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('applies error styling when error is present', () => {
    render(BaseCombobox, {
      props: {
        error: 'Error',
        label: 'Radical',
        modelValue: null,
        options: testOptions
      }
    })

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows dropdown toggle button', () => {
    render(BaseCombobox, {
      props: { label: 'Radical', modelValue: null, options: testOptions }
    })

    expect(screen.getByRole('button', { name: /toggle/i })).toBeInTheDocument()
  })

  it('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(BaseCombobox, {
      props: { label: 'Radical', modelValue: null, options: testOptions }
    })

    await user.click(screen.getByRole('button', { name: /toggle/i }))

    expect(screen.getByText('Water (氵)')).toBeInTheDocument()
    expect(screen.getByText('Fire (火)')).toBeInTheDocument()
    expect(screen.getByText('Tree (木)')).toBeInTheDocument()
  })

  it('filters options when typing', async () => {
    const user = userEvent.setup()
    render(BaseCombobox, {
      props: { label: 'Radical', modelValue: null, options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'water')

    expect(screen.getByText('Water (氵)')).toBeInTheDocument()
    expect(screen.queryByText('Fire (火)')).not.toBeInTheDocument()
    expect(screen.queryByText('Tree (木)')).not.toBeInTheDocument()
  })

  it('shows no results message when no matches', async () => {
    const user = userEvent.setup()
    render(BaseCombobox, {
      props: { label: 'Radical', modelValue: null, options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'xyz')

    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('disables input when disabled prop is true', () => {
    render(BaseCombobox, {
      props: {
        disabled: true,
        label: 'Radical',
        modelValue: null,
        options: testOptions
      }
    })

    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('searches multiple keys when searchKeys provided', async () => {
    const user = userEvent.setup()
    render(BaseCombobox, {
      props: {
        label: 'Radical',
        modelValue: null,
        options: testOptions,
        searchKeys: ['label', 'character']
      }
    })

    const input = screen.getByRole('combobox')
    // Search by character instead of label
    await user.type(input, '火')

    expect(screen.getByText('Fire (火)')).toBeInTheDocument()
    expect(screen.queryByText('Water (氵)')).not.toBeInTheDocument()
  })

  it('displays selected value in input', () => {
    render(BaseCombobox, {
      props: {
        label: 'Radical',
        modelValue: '2',
        options: testOptions
      }
    })

    expect(screen.getByRole('combobox')).toHaveValue('Fire (火)')
  })
})
