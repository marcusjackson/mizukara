/**
 * Tag entity
 *
 * Timestamp conventions:
 * - createdAt/updatedAt: Unix milliseconds (sync-safe last-write-wins key)
 *
 * Tag names are case-insensitively unique among non-deleted tags.
 */
export interface Tag {
  /** UUID v4 primary key */
  id: string
  /** Human-readable label; stored as entered; uniqueness checked case-insensitively */
  name: string
  /** Creation timestamp in Unix milliseconds */
  createdAt: number
  /** Last update timestamp in Unix milliseconds; updated on every mutation */
  updatedAt: number
  /** Soft delete flag */
  isDeleted: boolean
}

/**
 * Tag with count of non-deleted entries it is associated with.
 * Used in the tag browse view. Zero-count tags are included.
 */
export interface TagWithCount extends Tag {
  /** Number of non-deleted entries associated with this tag */
  entryCount: number
}

/**
 * Join entity representing a tag association on an entry.
 * Has its own UUID and timestamps for sync delta propagation.
 */
export interface EntryTag {
  /** UUID v4 primary key for this association row */
  id: string
  /** FK → entries.id */
  entryId: string
  /** FK → tags.id */
  tagId: string
  /** Creation timestamp in Unix milliseconds */
  createdAt: number
  /** Last update timestamp in Unix milliseconds */
  updatedAt: number
  /** Soft delete flag; removal is always a soft-delete, never hard-delete */
  isDeleted: boolean
}

/**
 * Input for creating a new tag
 */
export interface CreateTagInput {
  /** Tag name; must be non-empty after trim; must be case-insensitively unique */
  name: string
}

/**
 * Input for assigning a tag to an entry
 */
export interface AssignTagInput {
  /** UUID of the entry to tag */
  entryId: string
  /** UUID of the tag to assign */
  tagId: string
}

/**
 * Generic option shape used by BaseTagInput.
 * Kept in shared/types so base components need not import tag domain types.
 */
export interface TagInputOption {
  /** Tag ID — used as the selected value in the combobox */
  value: string
  /** Tag name — displayed in the dropdown and as chip label */
  label: string
}
