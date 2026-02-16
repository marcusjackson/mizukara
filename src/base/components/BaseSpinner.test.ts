/**
 * Tests for BaseSpinner component
 */

import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseSpinner from './BaseSpinner.vue'

describe('BaseSpinner', () => {
  it('renders with default props', () => {
    render(BaseSpinner)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('base-spinner-md')
  })

  it('has accessible label for screen readers', () => {
    render(BaseSpinner)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading...')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  describe('sizes', () => {
    it('renders small size', () => {
      render(BaseSpinner, {
        props: { size: 'sm' }
      })

      expect(screen.getByRole('status')).toHaveClass('base-spinner-sm')
    })

    it('renders medium size (default)', () => {
      render(BaseSpinner)

      expect(screen.getByRole('status')).toHaveClass('base-spinner-md')
    })

    it('renders large size', () => {
      render(BaseSpinner, {
        props: { size: 'lg' }
      })

      expect(screen.getByRole('status')).toHaveClass('base-spinner-lg')
    })
  })

  describe('custom label', () => {
    it('accepts custom aria label', () => {
      render(BaseSpinner, {
        props: { label: 'Saving data...' }
      })

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Saving data...')
      expect(screen.getByText('Saving data...')).toBeInTheDocument()
    })
  })
})
