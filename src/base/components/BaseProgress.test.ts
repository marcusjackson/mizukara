import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseProgress from './BaseProgress.vue'

describe('BaseProgress', () => {
  it('should expose the completion to assistive technology when given a value', () => {
    render(BaseProgress, { props: { label: 'Downloading model', value: 42 } })

    const bar = screen.getByRole('progressbar', { name: 'Downloading model' })
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('should clamp to zero when given a negative value', () => {
    render(BaseProgress, { props: { label: 'Downloading', value: -20 } })

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0'
    )
  })

  it('should clamp to one hundred when given a value above the range', () => {
    render(BaseProgress, { props: { label: 'Downloading', value: 140 } })

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100'
    )
  })

  it('should round to a whole percent when given a fractional value', () => {
    render(BaseProgress, { props: { label: 'Downloading', value: 66.6 } })

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '67'
    )
  })

  it('should show the percentage when showValue is left at its default', () => {
    render(BaseProgress, { props: { label: 'Downloading', value: 42 } })

    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('should hide the percentage when showValue is false', () => {
    render(BaseProgress, {
      props: { label: 'Downloading', showValue: false, value: 42 }
    })

    expect(screen.queryByText('42%')).not.toBeInTheDocument()
  })

  it('should announce a coarse percentage so a screen reader is not flooded', () => {
    render(BaseProgress, { props: { label: 'Downloading', value: 43 } })

    expect(screen.getByText(/Downloading 40 percent/)).toBeInTheDocument()
  })
})
