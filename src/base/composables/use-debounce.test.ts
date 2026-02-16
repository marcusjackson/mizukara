import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial value immediately', () => {
    const debounced = useDebounce('initial', 100)
    expect(debounced.value).toBe('initial')
  })

  it('does not update value immediately on set', () => {
    const debounced = useDebounce('initial', 100)
    debounced.value = 'updated'
    expect(debounced.value).toBe('initial')
  })

  it('updates value after delay', () => {
    const debounced = useDebounce('initial', 100)
    debounced.value = 'updated'

    vi.advanceTimersByTime(100)

    expect(debounced.value).toBe('updated')
  })

  it('resets timer on subsequent updates', () => {
    const debounced = useDebounce('initial', 100)

    debounced.value = 'first'
    vi.advanceTimersByTime(50)

    debounced.value = 'second'
    vi.advanceTimersByTime(50)

    // Should still be initial because timer was reset
    expect(debounced.value).toBe('initial')

    vi.advanceTimersByTime(50)

    // Now 100ms after 'second' was set
    expect(debounced.value).toBe('second')
  })

  it('uses default delay of 150ms', () => {
    const debounced = useDebounce('initial')
    debounced.value = 'updated'

    vi.advanceTimersByTime(149)
    expect(debounced.value).toBe('initial')

    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('updated')
  })

  it('works with different types', () => {
    const numberDebounced = useDebounce(0, 100)
    numberDebounced.value = 42
    vi.advanceTimersByTime(100)
    expect(numberDebounced.value).toBe(42)

    const objectDebounced = useDebounce({ key: 'value' }, 100)
    objectDebounced.value = { key: 'updated' }
    vi.advanceTimersByTime(100)
    expect(objectDebounced.value).toEqual({ key: 'updated' })
  })
})
