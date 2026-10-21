/**
 * useTheme tests
 */

import { nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn();

describe('useTheme', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('matchMedia', matchMediaMock);
    localStorageMock.getItem.mockReturnValue(null);
    matchMediaMock.mockReturnValue({ matches: false });
  });

  afterEach(() => {
    delete document.documentElement.dataset['theme'];
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('exports useTheme function', async () => {
    const { useTheme } = await import('./use-theme');
    expect(typeof useTheme).toBe('function');
  });

  it('returns theme, toggleTheme, and setTheme', async () => {
    const { useTheme } = await import('./use-theme');
    const result = useTheme();

    expect(result).toHaveProperty('theme');
    expect(result).toHaveProperty('toggleTheme');
    expect(result).toHaveProperty('setTheme');
  });

  it('defaults to light theme when no preference stored', async () => {
    const { useTheme } = await import('./use-theme');
    const { theme } = useTheme();

    expect(theme.value).toBe('light');
  });

  it('falls back to the system theme when storage throws', async () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('blocked');
    });
    matchMediaMock.mockReturnValue({ matches: true });
    const { useTheme } = await import('./use-theme');
    const { setTheme, theme } = useTheme();

    expect(theme.value).toBe('dark');
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('blocked');
    });
    setTheme('light');
    await nextTick();

    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });

  it('can toggle theme', async () => {
    const { useTheme } = await import('./use-theme');
    const { theme, toggleTheme } = useTheme();

    const initial = theme.value;
    toggleTheme();
    expect(theme.value).not.toBe(initial);
    toggleTheme();
    expect(theme.value).toBe(initial);
  });

  it('can set theme explicitly', async () => {
    const { useTheme } = await import('./use-theme');
    const { setTheme, theme } = useTheme();

    setTheme('dark');
    expect(theme.value).toBe('dark');
    setTheme('light');
    expect(theme.value).toBe('light');
  });

  it('restores a stored dark theme', async () => {
    localStorageMock.getItem.mockReturnValue('dark');
    const { useTheme } = await import('./use-theme');
    const { theme } = useTheme();

    expect(theme.value).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('restores a stored light theme even when the system prefers dark', async () => {
    localStorageMock.getItem.mockReturnValue('light');
    matchMediaMock.mockReturnValue({ matches: true });
    const { useTheme } = await import('./use-theme');

    expect(useTheme().theme.value).toBe('light');
  });

  it('falls back to the system preference when the stored value is invalid', async () => {
    localStorageMock.getItem.mockReturnValue('sepia');
    matchMediaMock.mockReturnValue({ matches: true });
    const { useTheme } = await import('./use-theme');

    expect(useTheme().theme.value).toBe('dark');
  });

  it('sets and removes data-theme and persists the choice', async () => {
    const { useTheme } = await import('./use-theme');
    const { setTheme } = useTheme();

    setTheme('dark');
    await nextTick();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mizukara-theme', 'dark');

    setTheme('light');
    await nextTick();
    expect(document.documentElement.dataset['theme']).toBeUndefined();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mizukara-theme', 'light');
  });
});
