/**
 * Tests for BaseButton component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  it('renders with default props', () => {
    render(BaseButton, {
      slots: { default: 'Click me' }
    })

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('base-button-primary')
    expect(button).toHaveClass('base-button-md')
  })

  it('renders slot content', () => {
    render(BaseButton, {
      slots: { default: 'Submit Form' }
    })

    expect(
      screen.getByRole('button', { name: /submit form/i })
    ).toBeInTheDocument()
  })

  describe('variants', () => {
    it('renders primary variant', () => {
      render(BaseButton, {
        props: { variant: 'primary' },
        slots: { default: 'Primary' }
      })

      expect(screen.getByRole('button')).toHaveClass('base-button-primary')
    })

    it('renders secondary variant', () => {
      render(BaseButton, {
        props: { variant: 'secondary' },
        slots: { default: 'Secondary' }
      })

      expect(screen.getByRole('button')).toHaveClass('base-button-secondary')
    })

    it('renders ghost variant', () => {
      render(BaseButton, {
        props: { variant: 'ghost' },
        slots: { default: 'Ghost' }
      })

      expect(screen.getByRole('button')).toHaveClass('base-button-ghost')
    })
  })

  describe('sizes', () => {
    it('renders small size', () => {
      render(BaseButton, {
        props: { size: 'sm' },
        slots: { default: 'Small' }
      })

      expect(screen.getByRole('button')).toHaveClass('base-button-sm')
    })

    it('renders medium size (default)', () => {
      render(BaseButton, {
        slots: { default: 'Medium' }
      })

      expect(screen.getByRole('button')).toHaveClass('base-button-md')
    })

    it('renders large size', () => {
      render(BaseButton, {
        props: { size: 'lg' },
        slots: { default: 'Large' }
      })

      expect(screen.getByRole('button')).toHaveClass('base-button-lg')
    })
  })

  describe('disabled state', () => {
    it('disables the button when disabled prop is true', () => {
      render(BaseButton, {
        props: { disabled: true },
        slots: { default: 'Disabled' }
      })

      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).toHaveClass('base-button-disabled')
    })

    it('does not trigger click when disabled', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      const { container } = render(BaseButton, {
        props: { disabled: true },
        slots: { default: 'Disabled' },
        attrs: { onClick }
      })

      const button = container.querySelector('button')!
      await user.click(button)
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('disables the button when loading', () => {
      render(BaseButton, {
        props: { loading: true },
        slots: { default: 'Loading' }
      })

      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).toHaveClass('base-button-loading')
    })

    it('shows spinner when loading', () => {
      render(BaseButton, {
        props: { loading: true },
        slots: { default: 'Loading' }
      })

      expect(document.querySelector('.base-button-spinner')).toBeInTheDocument()
    })

    it('does not trigger click when loading', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      const { container } = render(BaseButton, {
        props: { loading: true },
        slots: { default: 'Loading' },
        attrs: { onClick }
      })

      const button = container.querySelector('button')!
      await user.click(button)
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('button type', () => {
    it('defaults to button type', () => {
      render(BaseButton, {
        slots: { default: 'Button' }
      })

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('can be submit type', () => {
      render(BaseButton, {
        props: { type: 'submit' },
        slots: { default: 'Submit' }
      })

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('can be reset type', () => {
      render(BaseButton, {
        props: { type: 'reset' },
        slots: { default: 'Reset' }
      })

      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset')
    })
  })

  describe('click handling', () => {
    it('triggers click event', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      const { container } = render(BaseButton, {
        slots: { default: 'Click' },
        attrs: { onClick }
      })

      const button = container.querySelector('button')!
      await user.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })
})
