/**
 * Tests for BaseIcon component
 */

import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import BaseIcon from './BaseIcon.vue'

describe('BaseIcon', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(BaseIcon, { props: { name: 'search' } })

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })

  it('defaults to 20 pixels and honours a size', () => {
    const { container, rerender } = render(BaseIcon, {
      props: { name: 'search' }
    })
    expect(container.querySelector('svg')).toHaveAttribute('width', '20')

    return rerender({ name: 'search', size: 32 }).then(() => {
      expect(container.querySelector('svg')).toHaveAttribute('height', '32')
    })
  })

  it.each([
    ['today', 5],
    ['search', 2],
    ['tags', 2],
    ['settings', 2]
  ] as const)('draws the %s icon from %i shapes', (name, count) => {
    const { container } = render(BaseIcon, { props: { name } })

    expect(container.querySelector('svg')?.children).toHaveLength(count)
  })
})
