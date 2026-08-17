/**
 * useDatabaseExport
 *
 * Composable for database export, import, and clear operations.
 * Used in settings page for data management.
 *
 * Uses singleton state pattern — loading refs are shared across all callers
 * and returned as readonly to protect state integrity.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { isExporting, exportDatabase, importDatabase, clearDatabase }
 *   = useDatabaseExport()
 * </script>
 *
 * <template>
 *   <button :disabled="isExporting" @click="exportDatabase">Export</button>
 * </template>
 * ```
 *
 * @returns Database management functions and loading states
 * @see {@link UseDatabaseExport} for return type details
 */

import { onScopeDispose, readonly, ref } from 'vue'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

import type { Database } from 'sql.js'
import type { DeepReadonly, Ref } from 'vue'

// =============================================================================
// Constants
// =============================================================================

/** Valid SQLite database file extensions */
const VALID_DB_EXTENSIONS = ['.db', '.sqlite', '.sqlite3'] as const

/** Valid SQLite database MIME types */
const VALID_DB_MIME_TYPES = [
  'application/x-sqlite3',
  'application/vnd.sqlite3',
  'application/octet-stream'
] as const

/** Maximum import file size (100 MB) */
const MAX_DB_FILE_SIZE = 100 * 1024 * 1024

// =============================================================================
// Types
// =============================================================================

export interface UseDatabaseExport {
  isExporting: DeepReadonly<Ref<boolean>>
  isImporting: DeepReadonly<Ref<boolean>>
  isClearing: DeepReadonly<Ref<boolean>>
  exportDatabase: () => void
  importDatabase: (file: File) => Promise<boolean>
  validateDatabaseFile: (file: File) => Promise<boolean>
  clearDatabase: () => Promise<void>
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract error message from unknown error
 */
function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

/**
 * Generate a timestamped filename for database export
 *
 * @returns Filename in format `mizukara-YYYY-MM-DD-HHMM.db`
 */
export function generateExportFilename(): string {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `mizukara-${year}-${month}-${day}-${hours}${minutes}.db`
}

/**
 * Trigger a file download in the browser
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Validate that data is a valid SQLite database with expected schema.
 * Ensures the test database instance is always closed, even on error.
 */
/** Minimal interface for sql.js Database used during validation */
interface SqlJsDatabase {
  exec(sql: string): { values: unknown[][] }[]
  close(): void
}

async function validateSqliteData(data: Uint8Array): Promise<boolean> {
  let testDb: SqlJsDatabase | null = null
  try {
    const { default: initSqlJs } = await import('sql.js')
    const SQL = await initSqlJs({
      locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`
    })

    testDb = new SQL.Database(data)

    const result = testDb.exec(
      "SELECT name FROM sqlite_master WHERE type='table'"
    )

    const tables = result[0]?.values.map((row: unknown[]) => row[0]) ?? []
    return tables.includes('entries')
  } catch {
    return false
  } finally {
    testDb?.close()
  }
}

/**
 * Validate a database file by MIME type, extension, size, and SQLite structure
 */
async function performValidate(file: File): Promise<boolean> {
  try {
    if (file.size > MAX_DB_FILE_SIZE) return false

    // Check MIME type
    const hasValidMimeType =
      VALID_DB_MIME_TYPES.includes(
        file.type as (typeof VALID_DB_MIME_TYPES)[number]
      ) || !file.type // Allow empty MIME type

    // Check extension
    const hasValidExtension = VALID_DB_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidMimeType && !hasValidExtension) return false

    const buffer = await file.arrayBuffer()
    const data = new Uint8Array(buffer)
    return await validateSqliteData(data)
  } catch {
    return false
  }
}

// =============================================================================
// Singleton State
// =============================================================================

const isExporting = ref(false)
const isImporting = ref(false)
const isClearing = ref(false)

// =============================================================================
// Perform Functions
// =============================================================================

/**
 * Execute database export operation.
 * Exports current database as a binary file with timestamped filename.
 */
function performExport(
  database: Ref<Database | null>,
  toast: ReturnType<typeof useToast>
): void {
  if (!database.value) {
    toast.error('Database not initialized')
    return
  }

  isExporting.value = true
  try {
    const data = database.value.export()
    const buffer = new ArrayBuffer(data.length)
    const view = new Uint8Array(buffer)
    view.set(data)
    const blob = new Blob([buffer], { type: 'application/x-sqlite3' })
    const filename = generateExportFilename()
    downloadBlob(blob, filename)
    toast.success('Database exported successfully')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Export failed'))
  } finally {
    isExporting.value = false
  }
}

/**
 * Execute database import operation.
 * Validates (MIME type, extension, file size, and SQLite structure) and
 * replaces the current database with imported data.
 */
async function performImport(
  file: File,
  toast: ReturnType<typeof useToast>,
  replaceDatabase: (data: Uint8Array) => Promise<void>
): Promise<boolean> {
  isImporting.value = true
  try {
    const isValid = await performValidate(file)
    if (!isValid) {
      toast.error('Invalid database file')
      return false
    }
    const buffer = await file.arrayBuffer()
    const data = new Uint8Array(buffer)
    await replaceDatabase(data)
    toast.success('Database imported successfully')
    return true
  } catch (err) {
    toast.error(getErrorMessage(err, 'Import failed'))
    return false
  } finally {
    isImporting.value = false
  }
}

/**
 * Execute database clear operation.
 * Deletes all entries and persists the empty state.
 */
async function performClear(
  database: Ref<Database | null>,
  toast: ReturnType<typeof useToast>,
  run: (sql: string) => void,
  persist: () => Promise<void>
): Promise<void> {
  if (!database.value) {
    toast.error('Database not initialized')
    return
  }

  isClearing.value = true
  try {
    run('DELETE FROM entries')
    await persist()
    toast.success('All data cleared successfully')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Clear failed'))
  } finally {
    isClearing.value = false
  }
}

// =============================================================================
// Composable
// =============================================================================

export function useDatabaseExport(): UseDatabaseExport {
  const { database, persist, replaceDatabase, run } = useDatabase()
  const toast = useToast()

  // Reset loading states when composable is disposed
  onScopeDispose(() => {
    isExporting.value = false
    isImporting.value = false
    isClearing.value = false
  })

  return {
    isExporting: readonly(isExporting),
    isImporting: readonly(isImporting),
    isClearing: readonly(isClearing),
    exportDatabase: () => {
      performExport(database, toast)
    },
    importDatabase: (file: File) => performImport(file, toast, replaceDatabase),
    validateDatabaseFile: performValidate,
    clearDatabase: () => performClear(database, toast, run, persist)
  }
}
