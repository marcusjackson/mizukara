/**
 * Tests for the browser lifecycle persistence handlers
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const persistImmediately = vi.fn<() => Promise<void>>();
const persistSync = vi.fn();

vi.mock('./indexeddb', () => ({ persistImmediately, persistSync }));

describe('lifecycle handlers', () => {
  beforeEach(() => {
    vi.resetModules();
    persistImmediately.mockReset();
    persistSync.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs instead of leaving a rejected save unhandled when the app is hidden', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    persistImmediately.mockRejectedValue(new Error('disk full'));
    const lifecycle = await import('./lifecycle');
    lifecycle.attachLifecycleListeners();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalled();
  });
});
