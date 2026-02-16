/**
 * Base Repository
 *
 * Abstract base class providing common CRUD operations.
 * All entity repositories should extend this class.
 */

import type { QueryResult } from './types'

/**
 * Abstract base class for repositories
 *
 * Provides common helper methods for:
 * - Converting query results to entities
 * - Converting snake_case to camelCase
 * - Standard CRUD operation patterns
 *
 * @typeParam T - Entity type
 */
export abstract class BaseRepository<T> {
  /** Database table name */
  protected abstract tableName: string

  /** Map a database row to an entity */
  protected abstract mapRow(row: Record<string, unknown>): T

  /**
   * Convert a single-row query result to an entity
   */
  protected resultToEntity(result: QueryResult[]): T | null {
    if (!result[0]?.values[0]) return null
    return this.mapRow(this.rowToObject(result[0]))
  }

  /**
   * Convert a multi-row query result to an array of entities
   */
  protected resultToList(result: QueryResult[]): T[] {
    const firstResult = result[0]
    if (!firstResult) return []
    return firstResult.values.map((row) =>
      this.mapRow(
        this.rowToObject({ columns: firstResult.columns, values: [row] })
      )
    )
  }

  /**
   * Convert a query result row to an object
   */
  protected rowToObject(result: {
    columns: string[]
    values: unknown[][]
  }): Record<string, unknown> {
    const obj: Record<string, unknown> = {}
    result.columns.forEach((col, i) => {
      obj[col] = result.values[0]?.[i]
    })
    return obj
  }

  /**
   * Convert camelCase to snake_case for database columns
   */
  protected camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  }

  /**
   * Convert snake_case to camelCase for entity properties
   */
  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
  }
}
