/**
 * Record entry entity
 *
 * Date conventions:
 * - createdAt/updatedAt: Unix milliseconds (for precise system timestamps)
 * - assignedDay: ISO date string YYYY-MM-DD (for user-facing day assignments)
 */
export interface Entry {
  /** UUID v4 primary key */
  id: string
  /** Item content (any length) */
  content: string
  /** Creation timestamp in Unix milliseconds (e.g., 1707667200000) */
  createdAt: number
  /** Last update timestamp in Unix milliseconds */
  updatedAt: number
  /** Assigned day in ISO format YYYY-MM-DD (e.g., '2026-02-11') */
  assignedDay: string
  /** Order position within day (for custom ordering) */
  orderPosition: number
  /** Soft delete flag */
  isDeleted: boolean
}

/**
 * Input for creating new record entry
 */
export interface CreateEntryInput {
  /** Item content */
  content: string
  /** Assigned day (ISO string YYYY-MM-DD) */
  assignedDay: string
}

/**
 * Input for updating existing record entry
 */
export interface UpdateEntryInput {
  /** Item content (optional) */
  content?: string
  /** Assigned day (optional) */
  assignedDay?: string
  /** Order position (optional) */
  orderPosition?: number
}
