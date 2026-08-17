/**
 * Tests for BaseTagInput component
 *
 * Covers task 5.1 (multi-select combobox with filtered search) and
 * task 5.2 (inline-create and keyboard accessibility).
 */

import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseTagInput from './BaseTagInput.vue'

import type { TagInputOption } from '@/shared/types/tag-types'

const testOptions: TagInputOption[] = [
  { label: 'Design', value: 'uuid-design' },
  { label: 'Planning', value: 'uuid-planning' },
  { label: 'Work', value: 'uuid-work' }
]

describe('BaseTagInput', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  it('renders with label', () => {
    render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    expect(screen.getByText('Tags')).toBeInTheDocument()
  })

  it('renders input with placeholder', () => {
    render(BaseTagInput, {
      props: {
        modelValue: [],
        options: testOptions,
        placeholder: 'Add tags...'
      }
    })

    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument()
  })

  it('renders combobox input', () => {
    render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders error message when error prop is provided', () => {
    render(BaseTagInput, {
      props: {
        error: 'Tag selection failed',
        label: 'Tags',
        modelValue: [],
        options: testOptions
      }
    })

    expect(screen.getByText('Tag selection failed')).toBeInTheDocument()
  })

  it('applies aria-invalid when error is present', () => {
    render(BaseTagInput, {
      props: {
        error: 'Error',
        label: 'Tags',
        modelValue: [],
        options: testOptions
      }
    })

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('links input to error message via aria-describedby when error is present', () => {
    render(BaseTagInput, {
      props: {
        error: 'Tag name required',
        label: 'Tags',
        modelValue: [],
        options: testOptions
      }
    })

    const input = screen.getByRole('combobox')
    const errorEl = screen.getByText('Tag name required')

    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(errorEl.id).toBe(describedBy)
  })

  it('does not set aria-describedby when no error is present', () => {
    render(BaseTagInput, {
      props: {
        label: 'Tags',
        modelValue: [],
        options: testOptions
      }
    })

    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-describedby')
  })

  // ─── Chips ──────────────────────────────────────────────────────────────────

  it('displays selected values as chips', () => {
    render(BaseTagInput, {
      props: {
        label: 'Tags',
        modelValue: ['uuid-design', 'uuid-work'],
        options: testOptions
      }
    })

    const chips = screen.getByTestId('tag-chips')
    expect(within(chips).getByText('Design')).toBeInTheDocument()
    expect(within(chips).getByText('Work')).toBeInTheDocument()
    expect(within(chips).queryByText('Planning')).not.toBeInTheDocument()
  })

  it('renders chips above the input', () => {
    render(BaseTagInput, {
      props: {
        label: 'Tags',
        modelValue: ['uuid-design'],
        options: testOptions
      }
    })

    const chips = screen.getByTestId('tag-chips')
    const combobox = screen.getByRole('combobox')

    // Chips container should come before the combobox in the DOM
    expect(
      chips.compareDocumentPosition(combobox) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('emits update:modelValue when chip remove button is clicked', async () => {
    const user = userEvent.setup()
    const result = render(BaseTagInput, {
      props: {
        label: 'Tags',
        modelValue: ['uuid-design', 'uuid-planning'],
        options: testOptions
      }
    })

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0]!)

    const emitted = result.emitted()['update:modelValue']
    expect(emitted).toBeTruthy()
    const last = emitted?.[emitted.length - 1]
    expect(last).toEqual([['uuid-planning']])
  })

  it('does not render chips container when no items are selected', () => {
    render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    expect(screen.queryByTestId('tag-chips')).not.toBeInTheDocument()
  })

  // ─── Filtering ──────────────────────────────────────────────────────────────

  it('filters options case-insensitively as user types', async () => {
    const user = userEvent.setup()
    render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'des')

    expect(screen.getByText('Design')).toBeInTheDocument()
    expect(screen.queryByText('Planning')).not.toBeInTheDocument()
    expect(screen.queryByText('Work')).not.toBeInTheDocument()
  })

  it('shows create option when search term matches nothing (no exact match)', async () => {
    const user = userEvent.setup()
    render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'zzznomatch')

    // When nothing in filteredOptions matches, the create option appears instead
    expect(screen.getByText(/create 'zzznomatch'/i)).toBeInTheDocument()
  })

  // ─── Inline create (task 5.2) ────────────────────────────────────────────────

  it('shows synthetic create option when search term has no exact match', async () => {
    const user = userEvent.setup()
    render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'NewTag')

    expect(screen.getByText(/create 'NewTag'/i)).toBeInTheDocument()
  })

  it('does not show create option when search term exactly matches an existing option', async () => {
    const user = userEvent.setup()
    render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    const input = screen.getByRole('combobox')
    // "Design" is an existing option (case-insensitive match)
    await user.type(input, 'design')

    expect(screen.queryByText(/create 'design'/i)).not.toBeInTheDocument()
  })

  it('does not show create option when search term is empty', () => {
    render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    expect(screen.queryByText(/create '/i)).not.toBeInTheDocument()
  })

  it('emits create-tag with trimmed name when create option is selected', async () => {
    const user = userEvent.setup()
    const result = render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'NewTag')

    const createItem = screen.getByText(/create 'NewTag'/i)
    await user.click(createItem)

    const emitted = result.emitted()['create-tag']
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual(['NewTag'])
  })

  it('does not add synthetic create option to modelValue emits', async () => {
    const user = userEvent.setup()
    const result = render(BaseTagInput, {
      props: { label: 'Tags', modelValue: [], options: testOptions }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'NewTag')
    await user.click(screen.getByText(/create 'NewTag'/i))

    // create-tag fires but update:modelValue does not (select is prevented)
    expect(result.emitted()['create-tag']).toBeTruthy()
    expect(result.emitted()['update:modelValue']).toBeFalsy()
  })

  // ─── Keyboard accessibility (task 5.2) ───────────────────────────────────────

  it('removes last chip when Backspace is pressed on empty input', async () => {
    const user = userEvent.setup()
    const result = render(BaseTagInput, {
      props: {
        label: 'Tags',
        modelValue: ['uuid-design', 'uuid-planning'],
        options: testOptions
      }
    })

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.keyboard('{Backspace}')

    const emitted = result.emitted()['update:modelValue']
    expect(emitted).toBeTruthy()
    const last = emitted?.[emitted.length - 1]
    expect(last).toEqual([['uuid-design']])
  })

  it('does not remove chip when Backspace is pressed with non-empty input', async () => {
    const user = userEvent.setup()
    const result = render(BaseTagInput, {
      props: {
        label: 'Tags',
        modelValue: ['uuid-design'],
        options: testOptions
      }
    })

    const input = screen.getByRole('combobox')
    await user.type(input, 'So')
    await user.keyboard('{Backspace}')

    // Should not emit modelValue update (Backspace only deletes the typed char)
    const updateEmits = result.emitted()['update:modelValue']
    expect(updateEmits).toBeFalsy()
  })

  it('can be disabled', () => {
    render(BaseTagInput, {
      props: {
        disabled: true,
        label: 'Tags',
        modelValue: [],
        options: testOptions
      }
    })

    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
