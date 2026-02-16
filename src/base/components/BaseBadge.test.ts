/**
 * Tests for BaseBadge component
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseBadge from './BaseBadge.vue'

describe('BaseBadge', () => {
  it('renders slot content', () => {
    render(BaseBadge, {
      slots: { default: 'Test Badge' }
    })

    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  describe('variants', () => {
    it('renders default variant', () => {
      render(BaseBadge, {
        slots: { default: 'Default' }
      })

      expect(screen.getByText('Default')).toHaveClass('base-badge-default')
    })

    it('renders primary variant', () => {
      render(BaseBadge, {
        props: { variant: 'primary' },
        slots: { default: 'Primary' }
      })

      expect(screen.getByText('Primary')).toHaveClass('base-badge-primary')
    })

    it('renders secondary variant', () => {
      render(BaseBadge, {
        props: { variant: 'secondary' },
        slots: { default: 'Secondary' }
      })

      expect(screen.getByText('Secondary')).toHaveClass('base-badge-secondary')
    })

    it('renders muted variant', () => {
      render(BaseBadge, {
        props: { variant: 'muted' },
        slots: { default: 'Muted' }
      })

      expect(screen.getByText('Muted')).toHaveClass('base-badge-muted')
    })
  })

  describe('sizes', () => {
    it('renders small size', () => {
      render(BaseBadge, {
        props: { size: 'sm' },
        slots: { default: 'Small' }
      })

      expect(screen.getByText('Small')).toHaveClass('base-badge-size-sm')
    })

    it('renders medium size (default)', () => {
      render(BaseBadge, {
        slots: { default: 'Medium' }
      })

      expect(screen.getByText('Medium')).toHaveClass('base-badge-size-md')
    })
  })
})
