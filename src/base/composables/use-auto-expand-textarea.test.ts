/**
 * Tests for useAutoExpandTextarea composable
 */

import { nextTick, ref } from 'vue'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { withSetup } from '../../../test/helpers/with-setup'

import { useAutoExpandTextarea } from './use-auto-expand-textarea'

function createMockTextarea(scrollHeight = 50): HTMLTextAreaElement {
  const el = {
    style: { height: '', overflowY: '' } as HTMLElement['style'],
    scrollHeight
  } as HTMLTextAreaElement

  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    lineHeight: '20',
    paddingTop: '8',
    paddingBottom: '8'
  } as unknown as CSSStyleDeclaration)

  return el
}

describe('useAutoExpandTextarea', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not adjust height when disabled', async () => {
    const textareaEl = ref<HTMLTextAreaElement | null>(null)
    const value = ref<string | undefined>('')
    const enabled = ref(false)

    const mockEl = createMockTextarea(100)
    textareaEl.value = mockEl

    withSetup(() => {
      useAutoExpandTextarea(textareaEl, value, { enabled, maxRows: 8 })
    })

    await nextTick()

    // Style should not be changed because enabled is false
    expect(mockEl.style.height).toBe('')
    expect(mockEl.style.overflowY).toBe('')
  })

  it('sets overflowY to hidden when content fits within maxRows', async () => {
    const textareaEl = ref<HTMLTextAreaElement | null>(null)
    const value = ref<string | undefined>('short text')
    const enabled = ref(true)

    // scrollHeight=50 < maxHeight (8*20 + 8 + 8 = 176), so overflowY should be hidden
    const mockEl = createMockTextarea(50)
    textareaEl.value = mockEl

    withSetup(() => {
      useAutoExpandTextarea(textareaEl, value, { enabled, maxRows: 8 })
    })

    await nextTick()

    expect(mockEl.style.overflowY).toBe('hidden')
    expect(mockEl.style.height).toBe('50px')
  })

  it('sets overflowY to auto when content exceeds maxRows', async () => {
    const textareaEl = ref<HTMLTextAreaElement | null>(null)
    const value = ref<string | undefined>('very long text')
    const enabled = ref(true)

    // scrollHeight=300 > maxHeight (8*20 + 8 + 8 = 176), so overflowY should be auto
    const mockEl = createMockTextarea(300)
    textareaEl.value = mockEl

    withSetup(() => {
      useAutoExpandTextarea(textareaEl, value, { enabled, maxRows: 8 })
    })

    await nextTick()

    expect(mockEl.style.overflowY).toBe('auto')
    expect(mockEl.style.height).toBe('176px')
  })

  it('does not cap height when maxRows is not specified', async () => {
    const textareaEl = ref<HTMLTextAreaElement | null>(null)
    const value = ref<string | undefined>('long text')
    const enabled = ref(true)

    const mockEl = createMockTextarea(500)
    textareaEl.value = mockEl

    withSetup(() => {
      useAutoExpandTextarea(textareaEl, value, { enabled })
    })

    await nextTick()

    expect(mockEl.style.height).toBe('500px')
    expect(mockEl.style.overflowY).toBe('hidden')
  })

  it('recalculates height when value changes', async () => {
    const textareaEl = ref<HTMLTextAreaElement | null>(null)
    const value = ref<string | undefined>('initial')
    const enabled = ref(true)

    const mockEl = createMockTextarea(50)
    // Allow scrollHeight to be reassigned for the test
    Object.defineProperty(mockEl, 'scrollHeight', {
      writable: true,
      value: 50
    })
    textareaEl.value = mockEl

    withSetup(() => {
      useAutoExpandTextarea(textareaEl, value, { enabled, maxRows: 8 })
    })

    await nextTick()
    expect(mockEl.style.height).toBe('50px')

    // Simulate user typing more content — watcher fires then nextTick inside composable runs
    ;(mockEl as unknown as { scrollHeight: number }).scrollHeight = 100
    value.value = 'initial\nnewline added'
    await nextTick()
    await nextTick()

    expect(mockEl.style.height).toBe('100px')
  })
})
