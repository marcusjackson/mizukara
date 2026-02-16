/**
 * Tests for BaseComboboxMulti component
 */

import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseComboboxMulti from './BaseComboboxMulti.vue'

const testOptions = [
  { label: 'Apple', value: 1 },
  { label: 'Banana', value: 2 },
  { label: 'Cherry', value: 3 }
]

describe('BaseComboboxMulti', () => {
  it('renders with label', () => {
    render(BaseComboboxMulti, {
      props: { label: 'Fruits', modelValue: [], options: testOptions }
    })

    expect(screen.getByText('Fruits')).toBeInTheDocument()
  })

  it('renders input with placeholder', () => {
    render(BaseComboboxMulti, {
      props: {
        modelValue: [],
        options: testOptions,
        placeholder: 'Select fruits...'
      }
    })

    expect(screen.getByPlaceholderText('Select fruits...')).toBeInTheDocument()
  })

  it('displays required indicator', () => {
    render(BaseComboboxMulti, {
      props: {
        label: 'Fruits',
        modelValue: [],
        options: testOptions,
        required: true
      }
    })

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(BaseComboboxMulti, {
      props: {
        error: 'Selection required',
        label: 'Fruits',
        modelValue: [],
        options: testOptions
      }
    })

    expect(screen.getByText('Selection required')).toBeInTheDocument()
  })

  it('renders combobox input', () => {
    render(BaseComboboxMulti, {
      props: { label: 'Fruits', modelValue: [], options: testOptions }
    })

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('applies error styling when error is present', () => {
    render(BaseComboboxMulti, {
      props: {
        error: 'Error',
        label: 'Fruits',
        modelValue: [],
        options: testOptions
      }
    })

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders default placeholder when not specified', () => {
    render(BaseComboboxMulti, {
      props: { label: 'Fruits', modelValue: [], options: testOptions }
    })

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('shows dropdown toggle button', () => {
    render(BaseComboboxMulti, {
      props: { label: 'Fruits', modelValue: [], options: testOptions }
    })

    expect(screen.getByRole('button', { name: /toggle/i })).toBeInTheDocument()
  })

  it('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(BaseComboboxMulti, {
      props: { label: 'Fruits', modelValue: [], options: testOptions }
    })

    await user.click(screen.getByRole('button', { name: /toggle/i }))

    // Check that options are visible
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('Cherry')).toBeInTheDocument()
  })

  it('filters options when typing', async () => {
    const user = userEvent.setup()
    render(BaseComboboxMulti, {
      props: { label: 'Fruits', modelValue: [], options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'app')

    // Should show filtered results
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.queryByText('Banana')).not.toBeInTheDocument()
    expect(screen.queryByText('Cherry')).not.toBeInTheDocument()
  })

  it('shows no results message when no matches', async () => {
    const user = userEvent.setup()
    render(BaseComboboxMulti, {
      props: { label: 'Fruits', modelValue: [], options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'xyz')

    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('displays selected items as chips', () => {
    render(BaseComboboxMulti, {
      props: {
        label: 'Fruits',
        modelValue: [1, 2],
        options: testOptions
      }
    })

    // Find chips by their content
    const chipsContainer = screen.getByTestId('selected-chips')
    expect(within(chipsContainer).getByText('Apple')).toBeInTheDocument()
    expect(within(chipsContainer).getByText('Banana')).toBeInTheDocument()
    expect(within(chipsContainer).queryByText('Cherry')).not.toBeInTheDocument()
  })

  it('emits update when chip remove button is clicked', async () => {
    const user = userEvent.setup()
    const result = render(BaseComboboxMulti, {
      props: {
        label: 'Fruits',
        modelValue: [1, 2],
        options: testOptions
      }
    })

    // Find and click the remove button for Apple (first chip)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    const firstRemoveButton = removeButtons[0]
    expect(firstRemoveButton).toBeDefined()
    await user.click(firstRemoveButton!)

    // Should emit update with Apple removed
    const emittedEvents = result.emitted()['update:modelValue']
    expect(emittedEvents).toBeTruthy()
    const lastEmit = emittedEvents?.[emittedEvents.length - 1]
    expect(lastEmit).toEqual([[2]])
  })

  it('shows empty state when no options provided', () => {
    render(BaseComboboxMulti, {
      props: {
        label: 'Fruits',
        modelValue: [],
        options: [],
        placeholder: 'No items available'
      }
    })

    expect(
      screen.getByPlaceholderText('No items available')
    ).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(BaseComboboxMulti, {
      props: {
        disabled: true,
        label: 'Fruits',
        modelValue: [],
        options: testOptions
      }
    })

    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
