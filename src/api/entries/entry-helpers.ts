/**
 * Entry Helper Functions
 *
 * Shared utility functions used across entry queries and mutations.
 * Contains pure transformation functions with no side effects.
 */

import type { Entry } from '@/shared/types/entry-types'
import type { QueryExecResult } from 'sql.js'

// =============================================================================
// Type Assertion Helpers
// =============================================================================

/**
 * Assert and return a string value from a sql.js row cell.
 *
 * @param v - The raw cell value from a sql.js row
 * @param col - Column name (used in error message)
 * @returns The value cast to string
 * @throws {TypeError} If the value is not a string
 */
function assertString(v: unknown, col: string): string {
  if (typeof v !== 'string')
    throw new TypeError(
      `rowToEntry: column "${col}" expected string, got ${typeof v}`
    )
  return v
}

/**
 * Assert and return a number value from a sql.js row cell.
 *
 * @param v - The raw cell value from a sql.js row
 * @param col - Column name (used in error message)
 * @returns The value cast to number
 * @throws {TypeError} If the value is not a number
 */
function assertNumber(v: unknown, col: string): number {
  if (typeof v !== 'number')
    throw new TypeError(
      `rowToEntry: column "${col}" expected number, got ${typeof v}`
    )
  return v
}

/**
 * Build a column-name → index map from a sql.js QueryExecResult
 *
 * Used in conjunction with rowToEntry to guard against column reordering across
 * schema migrations. Callers pass the columns array once per query, then map
 * each row through rowToEntry with the resulting column map.
 *
 * @param columns - Column-name array from QueryExecResult.columns
 * @returns Map from column name to its array index
 */
export function buildColumnMap(columns: string[]): Map<string, number> {
  return new Map(columns.map((col, i) => [col, i]))
}

/**
 * Convert SQLite query result row to Entry object using a named column map
 *
 * Uses a column map (from buildColumnMap) so insertion order of columns in the
 * SELECT list does not affect correctness. Converts is_deleted (0/1) to boolean.
 *
 * @param row - Database row as array of values
 * @param cols - Column name → index map (from buildColumnMap)
 * @returns Entry object with typed properties
 *
 * @example
 * const cols = buildColumnMap(result[0].columns)
 * const entries = result[0].values.map((row) => rowToEntry(row, cols))
 */
export function rowToEntry(row: unknown[], cols: Map<string, number>): Entry {
  const idx = (name: string): number => {
    const i = cols.get(name)
    if (i === undefined) throw new Error(`rowToEntry: missing column "${name}"`)
    return i
  }

  return {
    id: assertString(row[idx('id')], 'id'),
    content: assertString(row[idx('content')], 'content'),
    createdAt: assertNumber(row[idx('created_at')], 'created_at'),
    updatedAt: assertNumber(row[idx('updated_at')], 'updated_at'),
    assignedDay: assertString(row[idx('assigned_day')], 'assigned_day'),
    orderPosition: assertNumber(row[idx('order_position')], 'order_position'),
    isDeleted: Boolean(row[idx('is_deleted')])
  }
}

/**
 * Map all rows in a QueryExecResult to Entry objects
 *
 * Convenience wrapper that builds the column map once and maps over all rows.
 *
 * @param result - A single QueryExecResult (result[0] from db.exec())
 * @returns Array of Entry objects
 */
export function queryResultToEntries(result: QueryExecResult): Entry[] {
  const cols = buildColumnMap(result.columns)
  return result.values.map((row) => rowToEntry(row, cols))
}
