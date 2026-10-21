import { defineComponent } from 'vue';

import { activeElementToBody, shortcutsComponent } from '@test/helpers/keyboard-shortcuts';
import { render } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

const TestComponent = defineComponent({
  setup() {
    const shortcuts = [
      { key: 'k', handler: vi.fn() },
      { key: 'cmd+n', handler: vi.fn() },
      { key: 'escape', handler: vi.fn() },
    ];

    useKeyboardShortcuts(shortcuts);

    return { shortcuts };
  },
  template: '<div>Test</div>',
});

describe('useKeyboardShortcuts', () => {
  it('registers keydown listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    render(TestComponent);

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('cleans up listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(TestComponent);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('parses cmd+n key combination', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'cmd+n', handler }]);

    // Mock Mac platform
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      writable: true,
      configurable: true,
    });

    render(TestComp);

    const event = new KeyboardEvent('keydown', { key: 'n', metaKey: true });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith(event);

    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
  });

  it('handles cross-platform Cmd/Ctrl', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'cmd+n', handler }]);

    // Save original userAgent
    const originalUserAgent = navigator.userAgent;

    // Test on Mac (metaKey should work)
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      writable: true,
      configurable: true,
    });

    render(TestComp);

    const macEvent = new KeyboardEvent('keydown', { key: 'n', metaKey: true });
    document.dispatchEvent(macEvent);
    expect(handler).toHaveBeenCalledWith(macEvent);

    handler.mockClear();

    // ctrlKey should NOT work on Mac
    const macCtrlEvent = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
    });
    document.dispatchEvent(macCtrlEvent);
    expect(handler).not.toHaveBeenCalled();

    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
  });

  it('handles Cmd+N on Windows using Ctrl key', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'cmd+n', handler }]);

    // Mock Windows platform
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true,
      configurable: true,
    });

    render(TestComp);

    // On Windows, cmd+n should use ctrlKey
    const winEvent = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true });
    document.dispatchEvent(winEvent);
    expect(handler).toHaveBeenCalledWith(winEvent);

    handler.mockClear();

    // metaKey should NOT work on Windows
    const winMetaEvent = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
    });
    document.dispatchEvent(winMetaEvent);
    expect(handler).not.toHaveBeenCalled();

    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
  });

  it('prevents default when specified', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'k', handler, preventDefault: true }]);

    render(TestComp);

    const event = new KeyboardEvent('keydown', { key: 'k' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not prevent default when preventDefault is false', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'k', handler, preventDefault: false }]);

    render(TestComp);

    const event = new KeyboardEvent('keydown', { key: 'k' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('checks activeElement for navigation shortcuts', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'k', handler }]);

    render(TestComp);

    // Mock activeElement as input
    Object.defineProperty(document, 'activeElement', {
      value: document.createElement('input'),
      writable: true,
    });

    const event = new KeyboardEvent('keydown', { key: 'k' });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    // Mock activeElement as body
    activeElementToBody();

    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  it('triggers save shortcut when textarea focused', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'cmd+s', handler }]);

    // Mock Mac platform
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      writable: true,
      configurable: true,
    });

    render(TestComp);

    // Mock activeElement as textarea
    Object.defineProperty(document, 'activeElement', {
      value: document.createElement('textarea'),
      writable: true,
    });

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();

    // Restore userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
  });

  it('handles escape key', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'escape', handler }]);

    render(TestComp);

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  it('triggers escape handler even when a regular input is focused', () => {
    // Regression test: 'escape' contains 's', so without the correct ordering
    // in shouldTriggerShortcut, the save-shortcut branch fires first for 'escape',
    // checking if a textarea is active — which returns false for plain inputs,
    // making Escape silently unreachable outside textareas.
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'escape', handler }]);

    render(TestComp);

    // Simulate a plain <input> being focused (not a textarea)
    Object.defineProperty(document, 'activeElement', {
      value: document.createElement('input'),
      writable: true,
    });

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  it('triggers escape handler even when a textarea is focused', () => {
    const handler = vi.fn();
    const TestComp = shortcutsComponent([{ key: 'escape', handler }]);

    render(TestComp);

    Object.defineProperty(document, 'activeElement', {
      value: document.createElement('textarea'),
      writable: true,
    });

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  describe('modifier matching', () => {
    const body = () => {
      activeElementToBody();
    };

    function registerShortcut(key: string): ReturnType<typeof vi.fn> {
      const handler = vi.fn();
      render(shortcutsComponent([{ key, handler }]));
      body();
      return handler;
    }

    it('does not fire a plain-key shortcut for a keystroke carrying Ctrl, Meta or Alt', () => {
      const handler = registerShortcut('g');

      for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', [modifier]: true }));
      }

      expect(handler).not.toHaveBeenCalled();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      expect(handler).toHaveBeenCalledOnce();
    });

    it('still fires a key that needs Shift to type, such as ?', () => {
      const handler = registerShortcut('?');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true }));

      expect(handler).toHaveBeenCalledOnce();
    });

    it('does not treat every combo containing the letter s as the save shortcut', () => {
      const handler = registerShortcut('ctrl+escape');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', ctrlKey: true }));

      // Not gated to a focused textarea, which only the save shortcut is
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('key aliases', () => {
    it('maps J key to ArrowDown', () => {
      const handler = vi.fn();
      const TestComp = shortcutsComponent([{ key: 'j', handler }]);

      render(TestComp);

      activeElementToBody();

      const event = new KeyboardEvent('keydown', { key: 'j' });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });

    it('maps K key to ArrowUp', () => {
      const handler = vi.fn();
      const TestComp = shortcutsComponent([{ key: 'k', handler }]);

      render(TestComp);

      activeElementToBody();

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });

    it('triggers handler for ArrowDown key directly', () => {
      const handler = vi.fn();
      const TestComp = shortcutsComponent([{ key: 'arrowdown', handler }]);

      render(TestComp);

      activeElementToBody();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });

    it('triggers handler for ArrowUp key directly', () => {
      const handler = vi.fn();
      const TestComp = shortcutsComponent([{ key: 'arrowup', handler }]);

      render(TestComp);

      activeElementToBody();

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });
  });
});
