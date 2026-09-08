/**
 * Tests for BaseIconButton component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import BaseIconButton from './BaseIconButton.vue'

// ---------------------------------------------------------------------------
// Stub RouterLink (avoids needing a real router instance in unit tests)
// ---------------------------------------------------------------------------

const routerLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to']
}

describe('BaseIconButton', () => {
  it('renders a button and emits click when no `to` is given', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(BaseIconButton, {
      props: { ariaLabel: 'Do the thing', onClick },
      slots: { default: '<svg data-testid="icon" />' }
    })

    const button = screen.getByRole('button', { name: 'Do the thing' })
    expect(screen.getByTestId('icon')).toBeInTheDocument()

    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders a RouterLink to the given route when `to` is set', () => {
    render(BaseIconButton, {
      props: { ariaLabel: 'Go search', to: '/search' },
      slots: { default: '<svg data-testid="icon" />' },
      global: { stubs: { RouterLink: routerLinkStub } }
    })

    expect(screen.getByRole('link', { name: 'Go search' })).toHaveAttribute(
      'href',
      '/search'
    )
  })
})
