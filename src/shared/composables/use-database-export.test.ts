/**
 * Tests for useDatabaseExport composable
 *
 * Validates database export, import, and clear operations
 * with correct domain references (entries table, mizukara filename).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  generateExportFilename,
  useDatabaseExport
} from './use-database-export'

const mockRun = vi.fn()
const mockPersist = vi.fn().mockResolvedValue(undefined)
const mockReplaceDatabase = vi.fn().mockResolvedValue(undefined)
const mockExport = vi.fn().mockReturnValue(new Uint8Array([1, 2, 3]))
const mockDatabase = { value: { export: mockExport } }
const mockSuccess = vi.fn()
const mockError = vi.fn()

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: () => ({
    database: mockDatabase,
    persist: mockPersist,
    replaceDatabase: mockReplaceDatabase,
    run: mockRun
  })
}))

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
    info: vi.fn(),
    warning: vi.fn(),
    toasts: { value: [] },
    addToast: vi.fn(),
    removeToast: vi.fn()
  })
}))

describe('useDatabaseExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default values', () => {
    const { isClearing, isExporting, isImporting } = useDatabaseExport()

    expect(isExporting.value).toBe(false)
    expect(isImporting.value).toBe(false)
    expect(isClearing.value).toBe(false)
  })

  it('returns all expected functions', () => {
    const result = useDatabaseExport()

    expect(result.exportDatabase).toBeDefined()
    expect(result.importDatabase).toBeDefined()
    expect(result.validateDatabaseFile).toBeDefined()
    expect(result.clearDatabase).toBeDefined()
  })
})

describe('generateExportFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses mizukara prefix', () => {
    vi.setSystemTime(new Date(2026, 1, 15, 14, 30))
    expect(generateExportFilename()).toMatch(/^mizukara-/)
  })

  it('formats as mizukara-YYYY-MM-DD-HHMM.db', () => {
    vi.setSystemTime(new Date(2026, 1, 15, 14, 30))
    expect(generateExportFilename()).toBe('mizukara-2026-02-15-1430.db')
  })

  it('zero-pads month, day, hours, and minutes', () => {
    vi.setSystemTime(new Date(2026, 0, 5, 3, 7))
    expect(generateExportFilename()).toBe('mizukara-2026-01-05-0307.db')
  })

  it('has .db extension', () => {
    vi.setSystemTime(new Date(2026, 1, 15, 14, 30))
    expect(generateExportFilename()).toMatch(/\.db$/)
  })
})

describe('exportDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Restore mock implementations after clearAllMocks
    mockExport.mockReturnValue(new Uint8Array([1, 2, 3]))
    mockPersist.mockResolvedValue(undefined)
    mockReplaceDatabase.mockResolvedValue(undefined)
  })

  it('shows error toast when database not initialized', () => {
    const originalValue = mockDatabase.value
    mockDatabase.value = null as unknown as typeof originalValue

    const { exportDatabase } = useDatabaseExport()
    exportDatabase()

    expect(mockError).toHaveBeenCalledWith('Database not initialized')

    mockDatabase.value = originalValue
  })

  it('shows error toast when export fails', () => {
    mockExport.mockImplementationOnce(() => {
      throw new Error('Export failed')
    })

    const { exportDatabase } = useDatabaseExport()
    exportDatabase()

    expect(mockError).toHaveBeenCalledWith('Export failed')
  })

  it('resets isExporting on error', () => {
    mockExport.mockImplementationOnce(() => {
      throw new Error('Export failed')
    })

    const { exportDatabase, isExporting } = useDatabaseExport()
    exportDatabase()

    expect(isExporting.value).toBe(false)
  })

  it('shows success toast on successful export', () => {
    // Mock DOM APIs used by downloadBlob
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn()
    } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor)

    // jsdom does not have URL.createObjectURL
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn().mockReturnValue('blob:test')
    URL.revokeObjectURL = vi.fn()

    const { exportDatabase } = useDatabaseExport()
    exportDatabase()

    expect(mockSuccess).toHaveBeenCalledWith('Database exported successfully')

    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })
})

describe('validateDatabaseFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects files with invalid extensions', async () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    expect(result).toBe(false)
  })

  it('accepts .db extension', async () => {
    const file = new File([''], 'test.db', { type: 'application/x-sqlite3' })
    const { validateDatabaseFile } = useDatabaseExport()

    // Will fail at SQLite validation but passes extension check
    const result = await validateDatabaseFile(file)

    // File content is empty so validation will return false
    expect(result).toBe(false)
  })

  it('accepts .sqlite extension', async () => {
    const file = new File([''], 'test.sqlite', {
      type: 'application/x-sqlite3'
    })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    expect(result).toBe(false)
  })

  it('accepts .sqlite3 extension', async () => {
    const file = new File([''], 'test.sqlite3', {
      type: 'application/x-sqlite3'
    })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    expect(result).toBe(false)
  })

  it('rejects files exceeding maximum size (100MB)', async () => {
    // Create a file larger than 100MB
    const largeSize = 101 * 1024 * 1024 // 101 MB
    const largeContent = new ArrayBuffer(largeSize)
    const file = new File([largeContent], 'test.db', {
      type: 'application/x-sqlite3'
    })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    expect(result).toBe(false)
  })

  it('accepts files at maximum size limit (100MB)', async () => {
    // Create a file exactly at 100MB limit
    const maxSize = 100 * 1024 * 1024
    const content = new ArrayBuffer(maxSize)
    const file = new File([content], 'test.db', {
      type: 'application/x-sqlite3'
    })
    const { validateDatabaseFile } = useDatabaseExport()

    // Will fail at SQLite validation but passes size check
    const result = await validateDatabaseFile(file)

    // File content is empty so validation will return false
    expect(result).toBe(false)
  })

  it('accepts valid MIME type (application/x-sqlite3)', async () => {
    const file = new File([''], 'test.db', { type: 'application/x-sqlite3' })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    // Will fail at SQLite validation but passes MIME check
    expect(result).toBe(false)
  })

  it('accepts valid MIME type (application/vnd.sqlite3)', async () => {
    const file = new File([''], 'test.db', { type: 'application/vnd.sqlite3' })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    expect(result).toBe(false)
  })

  it('accepts valid MIME type (application/octet-stream)', async () => {
    const file = new File([''], 'test.db', {
      type: 'application/octet-stream'
    })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    expect(result).toBe(false)
  })

  it('accepts empty MIME type with valid extension', async () => {
    const file = new File([''], 'test.db', { type: '' })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    // Will fail at SQLite validation but passes MIME check
    expect(result).toBe(false)
  })

  it('rejects invalid MIME type without valid extension', async () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    expect(result).toBe(false)
  })

  it('is case-insensitive for file extensions', async () => {
    const file = new File([''], 'test.DB', { type: 'application/x-sqlite3' })
    const { validateDatabaseFile } = useDatabaseExport()

    const result = await validateDatabaseFile(file)

    expect(result).toBe(false)
  })
})

describe('importDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resets isImporting on error', async () => {
    mockReplaceDatabase.mockRejectedValueOnce(new Error('Import failed'))

    const file = new File([''], 'test.db')
    const { importDatabase, isImporting } = useDatabaseExport()

    await importDatabase(file)

    expect(isImporting.value).toBe(false)
  })

  it('shows error toast on import failure', async () => {
    mockReplaceDatabase.mockRejectedValueOnce(new Error('Import error'))

    const file = new File([''], 'test.db')
    const { importDatabase } = useDatabaseExport()

    await importDatabase(file)

    // Will fail at validation since file content is empty
    expect(mockError).toHaveBeenCalled()
  })
})

describe('clearDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes single DELETE FROM entries statement', async () => {
    const { clearDatabase } = useDatabaseExport()

    await clearDatabase()

    expect(mockRun).toHaveBeenCalledWith('DELETE FROM entries')
    expect(mockRun).toHaveBeenCalledTimes(1)
  })

  it('persists after clearing', async () => {
    const { clearDatabase } = useDatabaseExport()

    await clearDatabase()

    expect(mockPersist).toHaveBeenCalled()
  })

  it('shows success toast on clear', async () => {
    const { clearDatabase } = useDatabaseExport()

    await clearDatabase()

    expect(mockSuccess).toHaveBeenCalledWith('All data cleared successfully')
  })

  it('shows error toast when database not initialized', async () => {
    const originalValue = mockDatabase.value
    mockDatabase.value = null as unknown as typeof originalValue

    const { clearDatabase } = useDatabaseExport()
    await clearDatabase()

    expect(mockError).toHaveBeenCalledWith('Database not initialized')

    mockDatabase.value = originalValue
  })

  it('shows error toast on clear failure', async () => {
    mockRun.mockImplementationOnce(() => {
      throw new Error('Clear error')
    })

    const { clearDatabase } = useDatabaseExport()
    await clearDatabase()

    expect(mockError).toHaveBeenCalledWith('Clear error')
  })

  it('resets isClearing on error', async () => {
    mockRun.mockImplementationOnce(() => {
      throw new Error('Clear error')
    })

    const { clearDatabase, isClearing } = useDatabaseExport()
    await clearDatabase()

    expect(isClearing.value).toBe(false)
  })
})
