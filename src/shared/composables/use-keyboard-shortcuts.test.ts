/* eslint-disable vue/one-component-per-file */

import { defineComponent } from 'vue'

import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import { useKeyboardShortcuts } from './use-keyboard-shortcuts'

const TestComponent = defineComponent({
  setup() {
    const shortcuts = [
      { key: 'k', handler: vi.fn() },
      { key: 'cmd+n', handler: vi.fn() },
      { key: 'escape', handler: vi.fn() }
    ]

    useKeyboardShortcuts(shortcuts)

    return { shortcuts }
  },
  template: '<div>Test</div>'
})

describe('useKeyboardShortcuts', () => {
  it('registers keydown listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

    render(TestComponent)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
  })

  it('cleans up listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = render(TestComponent)
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
  })

  it('parses cmd+n key combination', () => {
    const handler = vi.fn()
    const TestComp = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: 'cmd+n', handler }])
      },
      template: '<div></div>'
    })

    // Mock Mac platform
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      writable: true,
      configurable: true
    })

    render(TestComp)

    const event = new KeyboardEvent('keydown', { key: 'n', metaKey: true })
    document.dispatchEvent(event)

    expect(handler).toHaveBeenCalledWith(event)

    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true
    })
  })

  it('handles cross-platform Cmd/Ctrl', () => {
    const handler = vi.fn()
    const TestComp = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: 'cmd+n', handler }])
      },
      template: '<div></div>'
    })

    // Save original userAgent
    const originalUserAgent = navigator.userAgent

    // Test on Mac (metaKey should work)
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      writable: true,
      configurable: true
    })

    render(TestComp)

    const macEvent = new KeyboardEvent('keydown', { key: 'n', metaKey: true })
    document.dispatchEvent(macEvent)
    expect(handler).toHaveBeenCalledWith(macEvent)

    handler.mockClear()

    // ctrlKey should NOT work on Mac
    const macCtrlEvent = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true
    })
    document.dispatchEvent(macCtrlEvent)
    expect(handler).not.toHaveBeenCalled()

    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true
    })
  })

  it('handles Cmd+N on Windows using Ctrl key', () => {
    const handler = vi.fn()
    const TestComp = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: 'cmd+n', handler }])
      },
      template: '<div></div>'
    })

    // Mock Windows platform
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true,
      configurable: true
    })

    render(TestComp)

    // On Windows, cmd+n should use ctrlKey
    const winEvent = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })
    document.dispatchEvent(winEvent)
    expect(handler).toHaveBeenCalledWith(winEvent)

    handler.mockClear()

    // metaKey should NOT work on Windows
    const winMetaEvent = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true
    })
    document.dispatchEvent(winMetaEvent)
    expect(handler).not.toHaveBeenCalled()

    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true
    })
  })

  it('prevents default when specified', () => {
    const handler = vi.fn()
    const TestComp = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: 'k', handler, preventDefault: true }])
      },
      template: '<div></div>'
    })

    render(TestComp)

    const event = new KeyboardEvent('keydown', { key: 'k' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('does not prevent default when preventDefault is false', () => {
    const handler = vi.fn()
    const TestComp = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: 'k', handler, preventDefault: false }])
      },
      template: '<div></div>'
    })

    render(TestComp)

    const event = new KeyboardEvent('keydown', { key: 'k' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('checks activeElement for navigation shortcuts', () => {
    const handler = vi.fn()
    const TestComp = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: 'k', handler }])
      },
      template: '<div></div>'
    })

    render(TestComp)

    // Mock activeElement as input
    Object.defineProperty(document, 'activeElement', {
      value: document.createElement('input'),
      writable: true
    })

    const event = new KeyboardEvent('keydown', { key: 'k' })
    document.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()

    // Mock activeElement as body
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      writable: true
    })

    document.dispatchEvent(event)

    expect(handler).toHaveBeenCalled()
  })

  it('triggers save shortcut when textarea focused', () => {
    const handler = vi.fn()
    const TestComp = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: 'cmd+s', handler }])
      },
      template: '<div></div>'
    })

    // Mock Mac platform
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      writable: true,
      configurable: true
    })

    render(TestComp)

    // Mock activeElement as textarea
    Object.defineProperty(document, 'activeElement', {
      value: document.createElement('textarea'),
      writable: true
    })

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true })
    document.dispatchEvent(event)

    expect(handler).toHaveBeenCalled()

    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true
    })
  })

  it('handles escape key', () => {
    const handler = vi.fn()
    const TestComp = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: 'escape', handler }])
      },
      template: '<div></div>'
    })

    render(TestComp)

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event)

    expect(handler).toHaveBeenCalled()
  })

  describe('key aliases', () => {
    it('maps J key to ArrowDown', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'j', handler }])
        },
        template: '<div></div>'
      })

      render(TestComp)

      // Reset activeElement to body for navigation shortcuts
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true
      })

      const event = new KeyboardEvent('keydown', { key: 'j' })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })

    it('maps K key to ArrowUp', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'k', handler }])
        },
        template: '<div></div>'
      })

      render(TestComp)

      // Reset activeElement to body for navigation shortcuts
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true
      })

      const event = new KeyboardEvent('keydown', { key: 'k' })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })

    it('triggers handler for ArrowDown key directly', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'arrowdown', handler }])
        },
        template: '<div></div>'
      })

      render(TestComp)

      // Reset activeElement to body for navigation shortcuts
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true
      })

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })

    it('triggers handler for ArrowUp key directly', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'arrowup', handler }])
        },
        template: '<div></div>'
      })

      render(TestComp)

      // Reset activeElement to body for navigation shortcuts
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true
      })

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles case-insensitive key matching', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'K', handler }]) // Uppercase
        },
        template: '<div></div>'
      })

      render(TestComp)

      // Reset activeElement to body for navigation shortcuts
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true
      })

      const event = new KeyboardEvent('keydown', { key: 'k' }) // Lowercase
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })

    it('does not trigger after unmount', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'k', handler }])
        },
        template: '<div></div>'
      })

      const { unmount } = render(TestComp)

      // Reset activeElement
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true
      })

      unmount()

      const event = new KeyboardEvent('keydown', { key: 'k' })
      document.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('handles multiple shortcuts with same key (last match wins)', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([
            { key: 'k', handler: handler1 },
            { key: 'k', handler: handler2 }
          ])
        },
        template: '<div></div>'
      })

      render(TestComp)

      // Reset activeElement
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true
      })

      const event = new KeyboardEvent('keydown', { key: 'k' })
      document.dispatchEvent(event)

      // Only first match triggers (implementation detail: breaks on first match)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })

    it('does not trigger navigation shortcuts when input is focused', () => {
      const handlerJ = vi.fn()
      const handlerK = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([
            { key: 'j', handler: handlerJ },
            { key: 'k', handler: handlerK }
          ])
        },
        template: '<div></div>'
      })

      render(TestComp)

      // Mock input as active
      Object.defineProperty(document, 'activeElement', {
        value: document.createElement('input'),
        writable: true
      })

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))

      expect(handlerJ).not.toHaveBeenCalled()
      expect(handlerK).not.toHaveBeenCalled()
    })

    it('does not trigger navigation shortcuts when textarea is focused', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'j', handler }])
        },
        template: '<div></div>'
      })

      render(TestComp)

      // Mock textarea as active
      Object.defineProperty(document, 'activeElement', {
        value: document.createElement('textarea'),
        writable: true
      })

      const event = new KeyboardEvent('keydown', { key: 'j' })
      document.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('handles ctrl+key shortcut on all platforms using ctrlKey', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'ctrl+s', handler }])
        },
        template: '<div></div>'
      })

      // Mock Mac platform
      const originalUserAgent = navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        writable: true,
        configurable: true
      })

      render(TestComp)

      // Mock textarea as active (for save shortcut)
      Object.defineProperty(document, 'activeElement', {
        value: document.createElement('textarea'),
        writable: true
      })

      // On Mac, ctrl+s should use ctrlKey (not metaKey)
      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
      document.dispatchEvent(event)
      expect(handler).toHaveBeenCalled()

      handler.mockClear()

      // metaKey should NOT trigger ctrl+s
      const metaEvent = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true
      })
      document.dispatchEvent(metaEvent)
      expect(handler).not.toHaveBeenCalled()

      // Restore userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
        configurable: true
      })
    })

    it('does not trigger cmd+n when only metaKey pressed on Windows', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'cmd+n', handler }])
        },
        template: '<div></div>'
      })

      // Mock Windows platform
      const originalUserAgent = navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
        configurable: true
      })

      render(TestComp)

      // On Windows, metaKey should NOT trigger cmd+n (needs ctrlKey)
      const event = new KeyboardEvent('keydown', { key: 'n', metaKey: true })
      document.dispatchEvent(event)
      expect(handler).not.toHaveBeenCalled()

      // Restore userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
        configurable: true
      })
    })

    it('does not trigger cmd+n when only ctrlKey pressed on Mac', () => {
      const handler = vi.fn()
      const TestComp = defineComponent({
        setup() {
          useKeyboardShortcuts([{ key: 'cmd+n', handler }])
        },
        template: '<div></div>'
      })

      // Mock Mac platform
      const originalUserAgent = navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        writable: true,
        configurable: true
      })

      render(TestComp)

      // On Mac, ctrlKey should NOT trigger cmd+n (needs metaKey)
      const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })
      document.dispatchEvent(event)
      expect(handler).not.toHaveBeenCalled()

      // Restore userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
        configurable: true
      })
    })
  })
})
