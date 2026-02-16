/**
 * Entry Mutation Functions
 *
 * Mutation operations for journal entries.
 * Handles creating, updating, and deleting entries.
 */

import { generateUUID } from '@/shared/utils/uuid-utils'

import { rowToEntry } from './entry-helpers'
import { validateEntryInput } from './entry-validation'

import type {
  CreateEntryInput,
  Entry,
  UpdateEntryInput
} from '@/shared/types/entry-types'
import type { Database } from 'sql.js'

// Re-export for backwards compatibility
export { EntryValidationError } from './entry-validation'

/**
 * Fetch entry by ID from database
 * @throws Error if entry not found
 */
function fetchEntryById(db: Database, id: string): Entry {
  const result = db.exec(
    `
    SELECT id, content, created_at, updated_at, assigned_day, order_position, is_deleted
    FROM entries
    WHERE id = ?
  `,
    [id]
  )

  if (!result[0]?.values[0]) {
    throw new Error(`Entry not found: ${id}`)
  }

  return rowToEntry(result[0].values[0])
}

/**
 * Create a new entry with auto-generated UUID and timestamps
 *
 * Automatically calculates the initial order_position by querying the maximum
 * position for the assigned day and incrementing by 1 (or 0 if first entry).
 * Soft-deleted entries do not affect position calculation.
 *
 * @param db - SQLite database instance
 * @param input - Entry creation data with content and assignedDay
 * @returns Newly created entry with all generated fields populated
 * @throws {EntryValidationError} If content is empty or assignedDay format is invalid
 * @throws {TypeError} If content is not a string
 *
 * @example
 * const entry = createEntry(db, {
 *   content: 'Had a great day learning TypeScript',
 *   assignedDay: '2026-02-11'
 * })
 * console.log(entry.id) // '550e8400-e29b-41d4-a716-446655440000'
 * console.log(entry.orderPosition) // 0 (if first entry for this day)
 */
export function createEntry(db: Database, input: CreateEntryInput): Entry {
  const { assignedDay, content } = input

  // Validate input
  validateEntryInput({ content, assignedDay })

  const id = generateUUID()
  const now = Date.now()

  // Calculate order_position: max for the day + 1, or 0 if none
  const maxResult = db.exec(
    `
    SELECT MAX(order_position) as max_pos
    FROM entries
    WHERE assigned_day = ? AND is_deleted = 0
  `,
    [assignedDay]
  )

  const maxPos = maxResult[0]?.values[0]?.[0] as number | null
  const orderPosition = maxPos == null ? 0 : maxPos + 1

  // Insert the entry
  db.run(
    `
    INSERT INTO entries (
      id, content, created_at, updated_at,
      assigned_day, order_position, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, 0)
  `,
    [id, content, now, now, assignedDay, orderPosition]
  )

  return fetchEntryById(db, id)
}

/**
 * Update an existing entry
 *
 * Accepts partial updates - only provided fields will be modified.
 * Always updates the updated_at timestamp. Preserves created_at timestamp.
 *
 * @param db - SQLite database instance
 * @param id - Entry UUID to update
 * @param input - Partial update data (content, assignedDay, and/or orderPosition)
 * @returns Updated entry with new values
 * @throws {EntryValidationError} If content is empty or assignedDay format is invalid
 * @throws {Error} If entry with given ID does not exist
 *
 * @example
 * // Update only content
 * updateEntry(db, entryId, { content: 'Revised entry text' })
 *
 * // Move to different day
 * updateEntry(db, entryId, { assignedDay: '2026-02-12' })
 *
 * // Update multiple fields
 * updateEntry(db, entryId, {
 *   content: 'New text',
 *   assignedDay: '2026-02-12',
 *   orderPosition: 5
 * })
 */
export function updateEntry(
  db: Database,
  id: string,
  input: UpdateEntryInput
): Entry {
  // Validate input
  const validationInput: { content?: string; assignedDay?: string } = {}
  if (input.content !== undefined) validationInput.content = input.content
  if (input.assignedDay !== undefined)
    validationInput.assignedDay = input.assignedDay
  validateEntryInput(validationInput)

  const now = Date.now()

  // Build dynamic update query
  const updates: string[] = []
  const valueList: unknown[] = []

  if (input.content !== undefined) {
    updates.push('content = ?')
    valueList.push(input.content)
  }

  if (input.assignedDay !== undefined) {
    updates.push('assigned_day = ?')
    valueList.push(input.assignedDay)
  }

  if (input.orderPosition !== undefined) {
    updates.push('order_position = ?')
    valueList.push(input.orderPosition)
  }

  updates.push('updated_at = ?')
  valueList.push(now)

  const values = [...valueList, id]

  const sql = `
    UPDATE entries
    SET ${updates.join(', ')}
    WHERE id = ?
  `

  db.run(sql, values)

  return fetchEntryById(db, id)
}

/**
 * Update only the order position of an entry
 *
 * Used for reordering entries within a day. More efficient than updateEntry
 * when only the position needs to change.
 *
 * @param db - SQLite database instance
 * @param id - Entry UUID to update
 * @param newOrderPosition - New order position value (0-based index)
 * @returns Updated entry with new order position
 * @throws {Error} If entry with given ID does not exist
 *
 * @example
 * // Move entry to position 3 within its day
 * updateOrderPosition(db, entryId, 3)
 */
export function updateOrderPosition(
  db: Database,
  id: string,
  newOrderPosition: number
): Entry {
  const now = Date.now()

  db.run(
    `
    UPDATE entries
    SET order_position = ?, updated_at = ?
    WHERE id = ?
  `,
    [newOrderPosition, now, id]
  )

  return fetchEntryById(db, id)
}

/**
 * Soft delete an entry
 *
 * Sets the is_deleted flag to true instead of removing the row from the database.
 * This is required for future sync functionality - hard deletes cannot be propagated
 * to other devices.
 *
 * @param db - SQLite database instance
 * @param id - Entry UUID to delete
 * @returns Updated entry with isDeleted set to true
 * @throws {Error} If entry with given ID does not exist
 *
 * @example
 * const deleted = softDeleteEntry(db, entryId)
 * console.log(deleted.isDeleted) // true
 */
export function softDeleteEntry(db: Database, id: string): Entry {
  const now = Date.now()

  db.run(
    `
    UPDATE entries
    SET is_deleted = 1, updated_at = ?
    WHERE id = ?
  `,
    [now, id]
  )

  return fetchEntryById(db, id)
}
