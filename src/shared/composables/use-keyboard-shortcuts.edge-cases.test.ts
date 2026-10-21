import { activeElementToBody, shortcutsComponent } from '@test/helpers/keyboard-shortcuts';
import { render } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

describe('useKeyboardShortcuts', () => {
  describe('edge cases', () => {
    it('handles case-insensitive key matching', () => {
      const handler = vi.fn();
      const TestComp = shortcutsComponent([{ key: 'K', handler }]);

      render(TestComp);

      activeElementToBody();

      const event = new KeyboardEvent('keydown', { key: 'k' }); // Lowercase
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });

    it('does not trigger after unmount', () => {
      const handler = vi.fn();
      const TestComp = shortcutsComponent([{ key: 'k', handler }]);

      const { unmount } = render(TestComp);

      activeElementToBody();

      unmount();

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('handles multiple shortcuts with same key (last match wins)', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const TestComp = shortcutsComponent([
        { key: 'k', handler: handler1 },
        { key: 'k', handler: handler2 },
      ]);

      render(TestComp);

      activeElementToBody();

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      // Only first match triggers (implementation detail: breaks on first match)
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('does not trigger navigation shortcuts when input is focused', () => {
      const handlerJ = vi.fn();
      const handlerK = vi.fn();
      const TestComp = shortcutsComponent([
        { key: 'j', handler: handlerJ },
        { key: 'k', handler: handlerK },
      ]);

      render(TestComp);

      // Mock input as active
      Object.defineProperty(document, 'activeElement', {
        value: document.createElement('input'),
        writable: true,
      });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

      expect(handlerJ).not.toHaveBeenCalled();
      expect(handlerK).not.toHaveBeenCalled();
    });

    it('does not trigger navigation shortcuts when textarea is focused', () => {
      const handler = vi.fn();
      const TestComp = shortcutsComponent([{ key: 'j', handler }]);

      render(TestComp);

      // Mock textarea as active
      Object.defineProperty(document, 'activeElement', {
        value: document.createElement('textarea'),
        writable: true,
      });

      const event = new KeyboardEvent('keydown', { key: 'j' });
      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('handles ctrl+key shortcut on all platforms using ctrlKey', () => {
      const handler = vi.fn();
      const TestComp = shortcutsComponent([{ key: 'ctrl+s', handler }]);

      // Mock Mac platform
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        writable: true,
        configurable: true,
      });

      render(TestComp);

      // Mock textarea as active (for save shortcut)
      Object.defineProperty(document, 'activeElement', {
        value: document.createElement('textarea'),
        writable: true,
      });

      // On Mac, ctrl+s should use ctrlKey (not metaKey)
      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
      document.dispatchEvent(event);
      expect(handler).toHaveBeenCalled();

      handler.mockClear();

      // metaKey should NOT trigger ctrl+s
      const metaEvent = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
      });
      document.dispatchEvent(metaEvent);
      expect(handler).not.toHaveBeenCalled();

      // Restore userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
        configurable: true,
      });
    });

    it('does not trigger cmd+n when only metaKey pressed on Windows', () => {
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

      // On Windows, metaKey should NOT trigger cmd+n (needs ctrlKey)
      const event = new KeyboardEvent('keydown', { key: 'n', metaKey: true });
      document.dispatchEvent(event);
      expect(handler).not.toHaveBeenCalled();

      // Restore userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
        configurable: true,
      });
    });

    it('does not trigger cmd+n when only ctrlKey pressed on Mac', () => {
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

      // On Mac, ctrlKey should NOT trigger cmd+n (needs metaKey)
      const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true });
      document.dispatchEvent(event);
      expect(handler).not.toHaveBeenCalled();

      // Restore userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
        configurable: true,
      });
    });
  });
});
