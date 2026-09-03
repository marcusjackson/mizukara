import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SharedDeviceSyncCodeExchange from './SharedDeviceSyncCodeExchange.vue'

/**
 * Stubs `navigator.clipboard` for the current test. Must be called *after*
 * `render()` — jsdom (or @testing-library/vue's mount) resets
 * `navigator.clipboard` back to its own default as a side effect of
 * mounting, which clobbers a stub installed beforehand.
 */
function stubClipboard(): { writeText: ReturnType<typeof vi.fn> } {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText }
  })
  return { writeText }
}

describe('SharedDeviceSyncCodeExchange', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the code to share', () => {
    render(SharedDeviceSyncCodeExchange, { props: { code: 'abc123xyz' } })

    expect(screen.getByText('abc123xyz')).toBeInTheDocument()
  })

  it('copies the code to the clipboard and shows confirmation', async () => {
    const user = userEvent.setup()
    render(SharedDeviceSyncCodeExchange, { props: { code: 'abc123xyz' } })
    const { writeText } = stubClipboard()

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith('abc123xyz')
    expect(
      await screen.findByRole('button', { name: 'Copied!' })
    ).toBeInTheDocument()
  })

  it('hides the share section when there is no code yet', () => {
    render(SharedDeviceSyncCodeExchange, { props: { code: null } })

    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull()
    expect(
      screen.getByLabelText("Paste the other device's code")
    ).toBeInTheDocument()
  })

  it('hides the paste field when showPasteInput is false', () => {
    render(SharedDeviceSyncCodeExchange, {
      props: { code: 'abc123xyz', showPasteInput: false }
    })

    expect(screen.getByText('abc123xyz')).toBeInTheDocument()
    expect(screen.queryByLabelText("Paste the other device's code")).toBeNull()
  })

  it('disables Continue until a code is pasted', async () => {
    const user = userEvent.setup()
    render(SharedDeviceSyncCodeExchange, { props: { code: 'abc123xyz' } })

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()

    await user.type(
      screen.getByLabelText("Paste the other device's code"),
      'their-code'
    )

    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  it('emits submit with the trimmed pasted code and clears the field', async () => {
    const user = userEvent.setup()
    const { emitted } = render(SharedDeviceSyncCodeExchange, {
      props: { code: 'abc123xyz' }
    })
    const input = screen.getByLabelText("Paste the other device's code")

    await user.type(input, '  their-code  ')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(emitted()['submit']).toEqual([['their-code']])
    expect(input).toHaveValue('')
  })

  it('does not submit a whitespace-only paste', async () => {
    const user = userEvent.setup()
    const { emitted } = render(SharedDeviceSyncCodeExchange, {
      props: { code: 'abc123xyz' }
    })

    await user.type(
      screen.getByLabelText("Paste the other device's code"),
      '   '
    )

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    expect(emitted()['submit']).toBeUndefined()
  })
})
