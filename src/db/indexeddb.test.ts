/**
 * Tests for the IndexedDB persistence layer
 *
 * Covers the debounce, the one-persist-at-a-time queueing and the failure
 * toast. IndexedDB is replaced by a small in-memory fake.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as IndexedDbModule from './indexeddb';
import type { Database } from 'sql.js';

const mockError = vi.fn();

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({ error: mockError }),
}));

interface FakeStore {
  values: Map<string, unknown>;
  puts: number;
  failPuts: boolean;
  /** The put request succeeds but the transaction aborts (e.g. full quota). */
  abortPuts: boolean;
  putGate: Promise<void> | null;
  opens: number;
  /** Number of upcoming open() calls that fail. */
  failOpens: number;
  connection: {
    onclose: (() => void) | null;
    onversionchange: (() => void) | null;
    close: () => void;
  };
}

interface FakeTransaction {
  oncomplete: (() => void) | null;
  onabort: (() => void) | null;
  onerror: (() => void) | null;
  error: { message: string } | null;
  objectStore: () => unknown;
}

function installFakeIndexedDB(): FakeStore {
  const store: FakeStore = {
    values: new Map(),
    puts: 0,
    failPuts: false,
    abortPuts: false,
    putGate: null,
    opens: 0,
    failOpens: 0,
    connection: { onclose: null, onversionchange: null, close: vi.fn() },
  };

  const fakeConnection = Object.assign(store.connection, {
    objectStoreNames: { contains: () => true },
    transaction: () => {
      const transaction: FakeTransaction = {
        oncomplete: null,
        onabort: null,
        onerror: null,
        error: null,
        objectStore: () => ({
          put(value: unknown, key: string) {
            const request: {
              onsuccess: (() => void) | null;
              onerror: (() => void) | null;
              error: { message: string } | null;
            } = { onsuccess: null, onerror: null, error: null };
            store.puts += 1;
            void (store.putGate ?? Promise.resolve()).then(() => {
              if (store.failPuts) {
                request.error = { message: 'disk full' };
                request.onerror?.();
                transaction.error = request.error;
                transaction.onabort?.();
              } else if (store.abortPuts) {
                request.onsuccess?.();
                transaction.error = { message: 'quota exceeded' };
                transaction.onabort?.();
              } else {
                store.values.set(key, value);
                request.onsuccess?.();
                transaction.oncomplete?.();
              }
            });
            return request;
          },
          get(key: string) {
            const request: {
              onsuccess: (() => void) | null;
              onerror: (() => void) | null;
              result: unknown;
              error: null;
            } = { onsuccess: null, onerror: null, result: undefined, error: null };
            void Promise.resolve().then(() => {
              request.result = store.values.get(key);
              request.onsuccess?.();
            });
            return request;
          },
        }),
      };
      return transaction;
    },
  });

  vi.stubGlobal('indexedDB', {
    open: () => {
      store.opens += 1;
      const request: {
        result: unknown;
        onsuccess: (() => void) | null;
        onerror: (() => void) | null;
        onblocked: (() => void) | null;
        onupgradeneeded: ((event: unknown) => void) | null;
        error: { message: string } | null;
      } = {
        result: fakeConnection,
        onsuccess: null,
        onerror: null,
        onblocked: null,
        onupgradeneeded: null,
        error: null,
      };
      const fail = store.failOpens > 0;
      if (fail) store.failOpens -= 1;
      void Promise.resolve().then(() => {
        if (fail) {
          request.error = { message: 'open failed' };
          request.onerror?.();
        } else {
          request.onsuccess?.();
        }
      });
      return request;
    },
  });

  return store;
}

function fakeDatabase(bytes: number[] = [1, 2, 3]): Database {
  return { export: () => new Uint8Array(bytes) } as unknown as Database;
}

async function loadModule(): Promise<typeof IndexedDbModule> {
  vi.resetModules();
  return import('./indexeddb');
}

describe('indexeddb persistence', () => {
  let store: FakeStore;

  beforeEach(() => {
    vi.useFakeTimers();
    mockError.mockClear();
    store = installFakeIndexedDB();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does nothing when no database is set', async () => {
    const { schedulePersist } = await loadModule();

    schedulePersist();
    await vi.advanceTimersByTimeAsync(500);

    expect(store.puts).toBe(0);
  });

  it('groups rapid writes into one save after the debounce', async () => {
    const { schedulePersist, setDatabaseRef } = await loadModule();
    setDatabaseRef(fakeDatabase());

    schedulePersist();
    schedulePersist();
    schedulePersist();
    await vi.advanceTimersByTimeAsync(50);
    expect(store.puts).toBe(0);

    await vi.advanceTimersByTimeAsync(100);

    expect(store.puts).toBe(1);
    expect(store.values.get('db')).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('queues one more save for writes that arrive while a save is running', async () => {
    const { schedulePersist, setDatabaseRef } = await loadModule();
    setDatabaseRef(fakeDatabase());
    let release!: () => void;
    store.putGate = new Promise<void>((resolve) => {
      release = resolve;
    });

    schedulePersist();
    await vi.advanceTimersByTimeAsync(150);
    expect(store.puts).toBe(1);

    schedulePersist();
    await vi.advanceTimersByTimeAsync(150);
    expect(store.puts).toBe(1);

    release();
    await vi.advanceTimersByTimeAsync(0);

    expect(store.puts).toBe(2);
  });

  it('shows a toast when a scheduled save fails', async () => {
    const { schedulePersist, setDatabaseRef } = await loadModule();
    setDatabaseRef(fakeDatabase());
    store.failPuts = true;

    schedulePersist();
    await vi.advanceTimersByTimeAsync(150);

    expect(mockError).toHaveBeenCalledWith(
      'Failed to auto-save. Your recent changes may not be saved.'
    );
  });

  it('persistImmediately cancels the pending debounce and saves once', async () => {
    const { persistImmediately, schedulePersist, setDatabaseRef } = await loadModule();
    setDatabaseRef(fakeDatabase());

    schedulePersist();
    await persistImmediately();
    await vi.advanceTimersByTimeAsync(500);

    expect(store.puts).toBe(1);
  });

  it('loadFromIndexedDB returns null when nothing is stored', async () => {
    const { loadFromIndexedDB } = await loadModule();

    await expect(loadFromIndexedDB()).resolves.toBeNull();
  });

  it('shows a toast when the transaction aborts after the put succeeds', async () => {
    const { schedulePersist, setDatabaseRef } = await loadModule();
    setDatabaseRef(fakeDatabase());
    store.abortPuts = true;

    schedulePersist();
    await vi.advanceTimersByTimeAsync(150);

    expect(mockError).toHaveBeenCalledWith(
      'Failed to auto-save. Your recent changes may not be saved.'
    );
  });

  it('retries opening after a failed open instead of caching the failure', async () => {
    const { persistImmediately, setDatabaseRef } = await loadModule();
    setDatabaseRef(fakeDatabase());
    store.failOpens = 1;

    await expect(persistImmediately()).rejects.toThrow('open failed');
    await persistImmediately();

    expect(store.values.get('db')).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('opens a fresh connection after the cached one closes', async () => {
    const { persistImmediately, setDatabaseRef } = await loadModule();
    setDatabaseRef(fakeDatabase());
    await persistImmediately();
    expect(store.opens).toBe(1);

    store.connection.onclose?.();
    await persistImmediately();

    expect(store.opens).toBe(2);
  });

  it('closes the connection when another tab upgrades the database', async () => {
    const { persistImmediately, setDatabaseRef } = await loadModule();
    setDatabaseRef(fakeDatabase());
    await persistImmediately();

    store.connection.onversionchange?.();
    await persistImmediately();

    expect(store.connection.close).toHaveBeenCalledTimes(1);
    expect(store.opens).toBe(2);
  });
});
