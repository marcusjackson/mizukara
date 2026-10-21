/**
 * Tests for useDatabaseExport composable
 *
 * Validates database export, import, and clear operations
 * with correct domain references (entries table, mizukara filename).
 */

import { effectScope } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateExportFilename, useDatabaseExport } from './use-database-export';

const mockRun = vi.fn();
const mockPersist = vi.fn().mockResolvedValue(undefined);
const mockReplaceDatabase = vi.fn().mockResolvedValue(undefined);
const mockExport = vi.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
const mockDatabase = { value: { export: mockExport } };
const mockSuccess = vi.fn();
const mockError = vi.fn();

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: () => ({
    database: mockDatabase,
    persist: mockPersist,
    replaceDatabase: mockReplaceDatabase,
    run: mockRun,
  }),
}));

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
    info: vi.fn(),
    warning: vi.fn(),
    toasts: { value: [] },
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

// Mock sql.js so `validateSqliteData`'s real WASM load (which has no server to
// fetch the .wasm file from under jsdom) never runs. `sqlState` picks what the
// opened database reports.
const sqlState = vi.hoisted(() => ({
  tables: ['entries'] as string[],
  throwOnOpen: false,
}));

vi.mock('sql.js', () => ({
  default: () =>
    Promise.resolve({
      Database: function MockDatabase() {
        if (sqlState.throwOnOpen) throw new Error('invalid SQLite data');
        return {
          exec: () =>
            sqlState.tables.length > 0 ? [{ values: sqlState.tables.map((name) => [name]) }] : [],
          close: vi.fn(),
        };
      },
    }),
}));

describe('useDatabaseExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sqlState.tables = ['entries'];
    sqlState.throwOnOpen = false;
  });

  it('initializes with correct default values', () => {
    const { isClearing, isExporting, isImporting } = useDatabaseExport();

    expect(isExporting.value).toBe(false);
    expect(isImporting.value).toBe(false);
    expect(isClearing.value).toBe(false);
  });

  it('returns all expected functions', () => {
    const result = useDatabaseExport();

    expect(result.exportDatabase).toBeDefined();
    expect(result.importDatabase).toBeDefined();
    expect(result.validateDatabaseFile).toBeDefined();
    expect(result.clearDatabase).toBeDefined();
  });
});

describe('generateExportFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses mizukara prefix', () => {
    vi.setSystemTime(new Date(2026, 1, 15, 14, 30));
    expect(generateExportFilename()).toMatch(/^mizukara-/);
  });

  it('formats as mizukara-YYYY-MM-DD-HHMM.db', () => {
    vi.setSystemTime(new Date(2026, 1, 15, 14, 30));
    expect(generateExportFilename()).toBe('mizukara-2026-02-15-1430.db');
  });

  it('zero-pads month, day, hours, and minutes', () => {
    vi.setSystemTime(new Date(2026, 0, 5, 3, 7));
    expect(generateExportFilename()).toBe('mizukara-2026-01-05-0307.db');
  });

  it('has .db extension', () => {
    vi.setSystemTime(new Date(2026, 1, 15, 14, 30));
    expect(generateExportFilename()).toMatch(/\.db$/);
  });
});

describe('exportDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore mock implementations after clearAllMocks
    mockExport.mockReturnValue(new Uint8Array([1, 2, 3]));
    mockPersist.mockResolvedValue(undefined);
    mockReplaceDatabase.mockResolvedValue(undefined);
  });

  it('shows error toast when database not initialized', () => {
    const originalValue = mockDatabase.value;
    mockDatabase.value = null as unknown as typeof originalValue;

    const { exportDatabase } = useDatabaseExport();
    exportDatabase();

    expect(mockError).toHaveBeenCalledWith('Database not initialized');

    mockDatabase.value = originalValue;
  });

  it('shows error toast when export fails', () => {
    mockExport.mockImplementationOnce(() => {
      throw new Error('Export failed');
    });

    const { exportDatabase } = useDatabaseExport();
    exportDatabase();

    expect(mockError).toHaveBeenCalledWith('Export failed');
  });

  it('resets isExporting on error', () => {
    mockExport.mockImplementationOnce(() => {
      throw new Error('Export failed');
    });

    const { exportDatabase, isExporting } = useDatabaseExport();
    exportDatabase();

    expect(isExporting.value).toBe(false);
  });

  it('shows success toast on successful export', () => {
    // Mock DOM APIs used by downloadBlob
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor);

    // jsdom does not have URL.createObjectURL
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    URL.revokeObjectURL = vi.fn();

    const { exportDatabase } = useDatabaseExport();
    exportDatabase();

    expect(mockSuccess).toHaveBeenCalledWith('Database exported successfully');

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

/** A file whose reported size is stubbed, so the size limit needs no real allocation */
function fileWithSize(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('validateDatabaseFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sqlState.tables = ['entries'];
    sqlState.throwOnOpen = false;
  });

  it('rejects files with invalid extensions', async () => {
    const file = new File(['x'], 'test.txt', { type: 'text/plain' });
    const { validateDatabaseFile } = useDatabaseExport();

    expect(await validateDatabaseFile(file)).toBe(false);
  });

  it.each(['test.db', 'test.sqlite', 'test.sqlite3', 'test.DB'])('accepts %s', async (name) => {
    // An unlisted MIME type, so only the extension can admit the file
    const file = new File(['x'], name, { type: 'text/plain' });
    const { validateDatabaseFile } = useDatabaseExport();

    expect(await validateDatabaseFile(file)).toBe(true);
  });

  it.each(['application/x-sqlite3', 'application/vnd.sqlite3', 'application/octet-stream', ''])(
    'accepts MIME type "%s"',
    async (type) => {
      const file = new File(['x'], 'test.db', { type });
      const { validateDatabaseFile } = useDatabaseExport();

      expect(await validateDatabaseFile(file)).toBe(true);
    }
  );

  it('accepts a valid extension with an unlisted MIME type', async () => {
    const file = new File(['x'], 'test.db', { type: 'text/plain' });
    const { validateDatabaseFile } = useDatabaseExport();

    expect(await validateDatabaseFile(file)).toBe(true);
  });

  it('rejects an unlisted MIME type without a valid extension', async () => {
    const file = new File(['x'], 'test.txt', { type: 'text/plain' });
    const { validateDatabaseFile } = useDatabaseExport();

    expect(await validateDatabaseFile(file)).toBe(false);
  });

  it('rejects files over the 100 MB limit', async () => {
    const file = fileWithSize('test.db', 'application/x-sqlite3', 100 * 1024 * 1024 + 1);
    const { validateDatabaseFile } = useDatabaseExport();

    expect(await validateDatabaseFile(file)).toBe(false);
  });

  it('accepts a file of exactly 100 MB', async () => {
    const file = fileWithSize('test.db', 'application/x-sqlite3', 100 * 1024 * 1024);
    const { validateDatabaseFile } = useDatabaseExport();

    expect(await validateDatabaseFile(file)).toBe(true);
  });

  it('rejects a SQLite file without an entries table', async () => {
    sqlState.tables = ['tags'];
    const file = new File(['x'], 'test.db', { type: 'application/x-sqlite3' });
    const { validateDatabaseFile } = useDatabaseExport();

    expect(await validateDatabaseFile(file)).toBe(false);
  });

  it('rejects data sql.js cannot open', async () => {
    sqlState.throwOnOpen = true;
    const file = new File(['x'], 'test.db', { type: 'application/x-sqlite3' });
    const { validateDatabaseFile } = useDatabaseExport();

    expect(await validateDatabaseFile(file)).toBe(false);
  });
});

describe('importDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReplaceDatabase.mockResolvedValue(undefined);
    sqlState.tables = ['entries'];
    sqlState.throwOnOpen = false;
  });

  it('replaces the database, shows a success toast and returns true for a valid file', async () => {
    const file = new File(['x'], 'test.db', { type: 'application/x-sqlite3' });
    const { importDatabase } = useDatabaseExport();

    const result = await importDatabase(file);

    expect(result).toBe(true);
    expect(mockReplaceDatabase).toHaveBeenCalledTimes(1);
    expect(mockSuccess).toHaveBeenCalledWith('Database imported successfully');
  });

  it('resets isImporting on error', async () => {
    mockReplaceDatabase.mockRejectedValueOnce(new Error('Import failed'));

    const file = new File(['x'], 'test.db');
    const { importDatabase, isImporting } = useDatabaseExport();

    await importDatabase(file);

    expect(isImporting.value).toBe(false);
  });

  it('shows error toast on import failure', async () => {
    mockReplaceDatabase.mockRejectedValueOnce(new Error('Import error'));

    const file = new File(['x'], 'test.db');
    const { importDatabase } = useDatabaseExport();

    const result = await importDatabase(file);

    expect(result).toBe(false);
    expect(mockError).toHaveBeenCalledWith('Import error');
  });

  it('rejects files with invalid extensions during import', async () => {
    const file = new File(['x'], 'test.txt', { type: 'text/plain' });
    const { importDatabase } = useDatabaseExport();

    const result = await importDatabase(file);

    expect(result).toBe(false);
    expect(mockError).toHaveBeenCalledWith('Invalid database file');
    expect(mockReplaceDatabase).not.toHaveBeenCalled();
  });

  it('keeps isImporting true when a sibling caller scope is disposed mid-import', async () => {
    let finishReplace: () => void = () => undefined;
    mockReplaceDatabase.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishReplace = resolve;
      })
    );
    const scope = effectScope();
    const sibling = scope.run(() => useDatabaseExport());
    const { importDatabase, isImporting } = useDatabaseExport();
    if (!sibling) throw new Error('scope did not run');

    const pending = importDatabase(new File(['x'], 'test.db'));
    await vi.waitFor(() => {
      expect(mockReplaceDatabase).toHaveBeenCalled();
    });
    scope.stop();

    expect(isImporting.value).toBe(true);
    finishReplace();
    await pending;
    expect(isImporting.value).toBe(false);
  });
});

describe('clearDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes assignments, tags and entries in one transaction', async () => {
    const { clearDatabase } = useDatabaseExport();

    await clearDatabase();

    expect(mockRun.mock.calls.map(([sql]) => sql as string)).toEqual([
      'BEGIN TRANSACTION',
      'DELETE FROM entry_tags',
      'DELETE FROM tags',
      'DELETE FROM entries',
      'COMMIT',
    ]);
  });

  it('rolls back and reports failure when a delete throws', async () => {
    mockRun.mockImplementation((sql: string) => {
      if (sql === 'DELETE FROM tags') throw new Error('locked');
    });
    const { clearDatabase } = useDatabaseExport();

    try {
      const result = await clearDatabase();

      expect(result).toBe(false);
      expect(mockRun).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRun).not.toHaveBeenCalledWith('COMMIT');
      expect(mockPersist).not.toHaveBeenCalled();
    } finally {
      mockRun.mockReset();
    }
  });

  it('persists after clearing', async () => {
    const { clearDatabase } = useDatabaseExport();

    await clearDatabase();

    expect(mockPersist).toHaveBeenCalled();
  });

  it('shows success toast on clear', async () => {
    const { clearDatabase } = useDatabaseExport();

    const result = await clearDatabase();

    expect(result).toBe(true);
    expect(mockSuccess).toHaveBeenCalledWith('All data cleared successfully');
  });

  it('shows error toast when database not initialized', async () => {
    const originalValue = mockDatabase.value;
    mockDatabase.value = null as unknown as typeof originalValue;

    const { clearDatabase } = useDatabaseExport();
    const result = await clearDatabase();

    expect(result).toBe(false);
    expect(mockError).toHaveBeenCalledWith('Database not initialized');

    mockDatabase.value = originalValue;
  });

  it('shows error toast on clear failure', async () => {
    mockRun.mockImplementationOnce(() => {
      throw new Error('Clear error');
    });

    const { clearDatabase } = useDatabaseExport();
    await clearDatabase();

    expect(mockError).toHaveBeenCalledWith('Clear error');
  });

  it('resets isClearing on error', async () => {
    mockRun.mockImplementationOnce(() => {
      throw new Error('Clear error');
    });

    const { clearDatabase, isClearing } = useDatabaseExport();
    await clearDatabase();

    expect(isClearing.value).toBe(false);
  });
});
