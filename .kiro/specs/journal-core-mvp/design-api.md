# Design: API Layer & Shared Utilities

**Part of**: [journal-core-mvp design](design.md)  
**Theme**: API repositories, shared utilities, and type definitions

**Related files**:

- [design.md](design.md) — Overview and navigation
- [design-architecture.md](design-architecture.md) — Architecture patterns
- [design-components.md](design-components.md) — UI components
- [design-data.md](design-data.md) — Data models and schema

---

## Component Summary

| Component              | Layer             | Intent                                  | Req Coverage | Key Dependencies (P0)         |
| ---------------------- | ----------------- | --------------------------------------- | ------------ | ----------------------------- |
| entry-queries          | API/Queries       | SELECT operations                       | 2            | useDatabase                   |
| entry-mutations        | API/Mutations     | INSERT/UPDATE operations                | 1, 4         | useDatabase, uuid-utils       |
| entry-validation       | API/Validation    | Entry input validation                  | 1, 4         | date-utils, validation-errors |
| date-utils             | Shared/Util       | Date formatting, arithmetic, validation | 3            | Native Date API               |
| uuid-utils             | Shared/Util       | UUID v4 generation wrapper              | 1            | crypto.randomUUID             |
| validation-errors      | Shared/Validation | Validation error messages and constants | 1, 4         | —                             |
| use-keyboard-shortcuts | Shared/Composable | Global keyboard shortcut registration   | 7            | Vue lifecycle hooks           |
| Entry (type)           | Shared/Type       | TypeScript interface for record entity  | All          | —                             |

---

## API Layer: /api/entrys

### entry-queries

| Field        | Detail                              |
| ------------ | ----------------------------------- |
| Intent       | SELECT operations for record entrys |
| Requirements | 2.1-2.7                             |

**Responsibilities & Constraints**

- Query entrys by assigned day
- Query single entry by ID
- File size: Under 250 lines (Repository limit)

**Dependencies**

- Outbound: useDatabase — database access (P0)
- External: Entry type — return type (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
/**
 * Find all record entrys for a specific day, ordered by order_position
 * @param db - SQLite database instance
 * @param assignedDay - ISO date string (YYYY-MM-DD)
 * @returns Array of record entrys, empty if none found
 */
export function findByDay(db: Database, assignedDay: string): Entry[]

/**
 * Find single record entry by ID
 * @param db - SQLite database instance
 * @param id - Item UUID
 * @returns Record entry or null if not found
 */
export function findById(db: Database, id: string): Entry | null
```

- **Preconditions**: Database initialized, assignedDay valid ISO string, id valid UUID
- **Postconditions**: Returns record entrys or empty array/null, excludes soft-deleted entrys
- **Invariants**: Results always ordered by order_position ASC

**Implementation Notes**

- **Integration**:
  - `findByDay` SQL: `SELECT * FROM entries WHERE assigned_day = ? AND is_deleted = 0 ORDER BY order_position ASC`
  - `findById` SQL: `SELECT * FROM entries WHERE id = ? AND is_deleted = 0 LIMIT 1`
- **Validation**:
  - No validation (assume parameters valid from composable layer)
- **Risks**:
  - Large day lists could be slow — add index on `assigned_day` in migration (already included)

---

### entry-mutations

| Field        | Detail                                     |
| ------------ | ------------------------------------------ |
| Intent       | INSERT/UPDATE operations for record entrys |
| Requirements | 1.1-1.8, 4.1-4.14                          |

**Responsibilities & Constraints**

- Create new record entry with UUID, timestamps
- Update existing entry (content, assigned day, order position)
- Soft delete entry (set is_deleted flag)
- File size: Under 250 lines (Repository limit)
- **Note**: Validation logic extracted to entry-validation.ts

**Dependencies**

- Outbound: useDatabase — database access (P0)
- Outbound: uuid-utils.generateUUID — UUID generation (P0)
- Outbound: entry-validation — input validation (P0)
- External: Entry, CreateEntryInput, UpdateEntryInput types (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
/**
 * Create new record entry
 * @param db - SQLite database instance
 * @param input - Item creation data
 * @returns Newly created record entry
 */
export function createEntry(db: Database, input: CreateEntryInput): Entry

/**
 * Update existing record entry
 * @param db - SQLite database instance
 * @param id - Item UUID
 * @param input - Partial update data
 * @returns Updated record entry
 */
export function updateEntry(
  db: Database,
  id: string,
  input: UpdateEntryInput
): Entry

/**
 * Update order position of entry (for reordering)
 * @param db - SQLite database instance
 * @param id - Item UUID
 * @param newOrderPosition - New order position value
 * @returns Updated record entry
 */
export function updateOrderPosition(
  db: Database,
  id: string,
  newOrderPosition: number
): Entry

/**
 * Soft delete record entry
 * @param db - SQLite database instance
 * @param id - Item UUID
 * @returns void
 */
export function softDeleteEntry(db: Database, id: string): void
```

- **Preconditions**: Database initialized, input data validated, IDs valid UUIDs
- **Postconditions**: Database rows inserted/updated, timestamps set correctly
- **Invariants**: created_at never changes after creation, updated_at always set on update

**Implementation Notes**

- **Integration**:
  - `createEntry` generates UUID, sets created_at and updated_at to current timestamp, calculates initial order_position
  - `updateEntry` sets updated_at to current timestamp, preserves created_at
  - `updateOrderPosition` only updates order_position field (used for reordering swaps)
  - `softDeleteEntry` sets is_deleted = 1, updated_at = current timestamp
- **Validation**:
  - No validation (assume parameters validated at UI/composable layer)
- **Risks**:
  - UUID collision extremely unlikely but theoretically possible — accept risk for MVP

#### Position Initialization Contract (createEntry)

**Position Assignment Contract**:

- New entries are automatically appended to the end of the day's list
- First entry in a day receives position 0
- Subsequent entries receive position max + 1
- Positions are independent per day (each day starts from 0)
- Soft-deleted entries do not affect new position calculation

**Behavior Examples**:

- Day 2026-01-15 has no entries → First entry gets position 0
- Second entry created → Gets position 1
- Third entry created → Gets position 2
- If entry with position 1 is deleted (soft delete), next new entry → Gets position 3 (not 1)

**Design Rationale**:

- Sequential positions avoid gaps and collisions
- Simpler than renumbering existing entries
- Soft-deleted entries don't interfere with new positions
- Each day has independent position sequence

**Implementation**: See `createEntry()` in `entry-mutations.ts`

---

## Shared Utilities

### date-utils

| Field        | Detail                                      |
| ------------ | ------------------------------------------- |
| Intent       | Date formatting, arithmetic, and validation |
| Requirements | 3.1-3.7                                     |

**Responsibilities & Constraints**

- Format dates for display (short, long, relative)
- Date arithmetic (add/subtract days)
- Validate ISO date strings
- File size: Small utility (under 100 lines expected)

**Dependencies**

- External: Native JavaScript Date API (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
/**
 * Format date as ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string

/**
 * Format date as long string (e.g., "Monday, January 15, 2026")
 */
export function formatDateLong(date: string | Date): string

/**
 * Format date as short string (e.g., "Jan 15")
 */
export function formatDateShort(date: string | Date): string

/**
 * Add days to date
 */
export function addDays(date: string | Date, days: number): string

/**
 * Subtract days from date
 */
export function subtractDays(date: string | Date, days: number): string

/**
 * Get today's date as ISO string
 */
export function getToday(): string

/**
 * Validate ISO date string format (YYYY-MM-DD)
 * Checks format validity and date existence
 * Validates year range (1900-2100)
 */
export function isValidISODate(dateString: string): boolean

/**
 * Parse ISO date string to Date object
 */
export function parseISODate(dateString: string): Date
```

- **Preconditions**: Date parameters are valid Date objects or ISO strings
- **Postconditions**: Returns formatted strings or Date objects, validation returns boolean
- **Invariants**: All returned date strings are ISO format (YYYY-MM-DD)

**Implementation Notes**

- **Integration**:
  - Use native JavaScript Date API (no external libraries)
  - Format as local timezone (no UTC conversion for MVP)
  - `isValidISODate` validates regex format, date existence, and reasonable year range (1900-2100)
- **Validation**:
  - `isValidISODate` checks YYYY-MM-DD format (strict regex), validates date exists (e.g., rejects Feb 31), and validates year within 1900-2100
- **Risks**:
  - Timezone handling simplistic (local only) — accept for MVP

---

### entry-validation

| Field        | Detail                           |
| ------------ | -------------------------------- |
| Intent       | Entry input validation functions |
| Requirements | 1.1-1.8, 4.1-4.14                |

**Responsibilities & Constraints**

- Validate entry content (non-empty, type check)
- Validate assigned day format
- Custom validation error class
- File size: Small utility (under 100 lines)
- **Note**: Extracted from entry-mutations.ts to maintain file size limits

**Dependencies**

- Outbound: date-utils.isValidISODate — date validation (P0)
- Outbound: validation-errors — error messages (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
/**
 * Custom error for entry validation failures
 */
export class EntryValidationError extends Error {
  constructor(field: string, message: string)
}

/**
 * Validate entry input data
 * @throws {EntryValidationError} If validation fails
 * @throws {TypeError} If content is not a string
 */
export function validateEntryInput(input: {
  content?: string
  assignedDay?: string
}): void
```

- **Preconditions**: Input object provided
- **Postconditions**: Throws error if validation fails, returns void if valid
- **Invariants**: Content must be non-empty string, assigned day must be valid ISO date

**Implementation Notes**

- **Integration**:
  - Used by entry mutations before database operations
  - Error messages sourced from validation-errors constants
- **Validation**:
  - Content: Type check (must be string), non-empty after trim
  - Assigned day: YYYY-MM-DD format via isValidISODate
- **Rationale**:
  - Extracted to separate file to keep entry-mutations.ts under 250 lines
  - Single source of validation logic for all entry mutations

---

### validation-errors

| Field        | Detail                                |
| ------------ | ------------------------------------- |
| Intent       | Centralized validation error messages |
| Requirements | 1.1-1.8, 4.1-4.14                     |

**Responsibilities & Constraints**

- Define validation error messages
- Define validation constants (date ranges, etc.)
- Enable consistent error messaging
- Support future i18n

**Dependencies**: None

**Contracts**: Constants ☑

#### Constants

```typescript
export const ENTRY_VALIDATION_ERRORS = {
  CONTENT_EMPTY: 'Please enter some content for your entry',
  CONTENT_TYPE: 'Content must be a string',
  DATE_FORMAT: 'Please enter a valid date in YYYY-MM-DD format'
} as const

export const DATE_VALIDATION_CONSTRAINTS = {
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
  MIN_MONTH: 1,
  MAX_MONTH: 12,
  MIN_DAY: 1,
  MAX_DAY: 31
} as const
```

**Design Rationale**:

- Centralize error messages for consistency
- Easy to update messaging across application
- Prepares for future i18n support
- Self-documenting validation rules

---

### uuid-utils

| Field        | Detail                     |
| ------------ | -------------------------- |
| Intent       | UUID v4 generation wrapper |
| Requirements | 1.7, 5.2                   |

**Responsibilities & Constraints**

- Generate UUID v4 strings
- Thin wrapper around `crypto.randomUUID()`
- File size: Minimal (under 20 lines expected)

**Dependencies**

- External: `crypto.randomUUID()` (Web Crypto API) (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
/**
 * Generate UUID v4 string
 * @returns UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateUUID(): string
```

- **Preconditions**: Browser supports Web Crypto API (all modern browsers)
- **Postconditions**: Returns valid RFC 4122 v4 UUID string
- **Invariants**: UUIDs are globally unique (collision probability negligible)

**Implementation Notes**

- **Integration**: Called by entry-mutations.createEntry
- **Validation**: None (crypto.randomUUID guarantees valid format)
- **Risks**: None (Web Crypto API widely supported)

---

### use-keyboard-shortcuts

| Field        | Detail                                             |
| ------------ | -------------------------------------------------- |
| Intent       | Global keyboard shortcut registration and handling |
| Requirements | 7.1-7.6, 11.7                                      |

**Responsibilities & Constraints**

- Register global shortcuts (Cmd+N for new, J/K for navigation, G for date picker, Cmd+S for save, Escape for cancel)
- Prevent default browser behavior where appropriate
- Clean up listeners on unmount
- File size: Under 200 lines (Composable limit)

**Dependencies**

- External: Vue onMounted, onUnmounted lifecycle hooks (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
interface KeyboardShortcut {
  /** Key combination (e.g., "cmd+n", "k", "escape", "g") */
  key: string
  /** Callback function */
  handler: (event: KeyboardEvent) => void
  /** Prevent default browser behavior */
  preventDefault?: boolean
}

/**
 * Register global keyboard shortcuts
 * @param shortcuts - Array of shortcuts to register
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void
```

- **Preconditions**: Shortcuts array provided with valid key combinations
- **Postconditions**: Document-level event listeners registered, cleaned up on unmount
- **Invariants**: Shortcuts only active when no input fields focused (unless explicitly allowed)

**Keyboard Shortcuts Reference**:

| Shortcut     | Action           | Context                                                     |
| ------------ | ---------------- | ----------------------------------------------------------- |
| `Cmd/Ctrl+N` | Create new entry | Global (except input fields)                                |
| `J` or `↓`   | Next day         | Global (except input fields)                                |
| `K` or `↑`   | Previous day     | Global (except input fields)                                |
| `G`          | Open date picker | Global (except input fields)                                |
| `Cmd/Ctrl+S` | Save entry       | Active textarea (both create form AND edit mode)            |
| `Escape`     | Cancel/Clear     | Create form: clear content; Edit mode: exit without saving; |
|              |                  | Date picker: close without navigation                       |

**Context-Aware Behavior** (addresses Validation Observation 2):

- **Navigation shortcuts (J/K, G)**: Only trigger when no input/textarea has focus
  - Check: `document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'`
  - Exception: None (never trigger during text entry)
- **Save shortcut (Cmd/Ctrl+S)**:
  - **Create form context**: If textarea in create form is focused → trigger save (create new entry)
  - **Edit mode context**: If textarea in editor is focused → trigger save (update existing entry)
  - Implementation: Shortcut handler detects which textarea is focused and calls appropriate save function
- **Escape shortcut**:
  - **Create form context**: If textarea in create form is focused → clear content (soft reset, form stays visible)
  - **Edit mode context**: If in edit mode → exit edit mode without saving (discard changes)
  - **Date picker context**: If date picker is open → close dialog without navigation
  - **Other contexts**: No action (Escape does nothing if not in active edit state)

**Implementation Notes**

- **Integration**: Called by EntryDayViewRoot in onMounted
- Key combinations parsed: "cmd+n" → Cmd/Ctrl+N, "g" → G key
- Cmd/Ctrl detection: Check both `event.metaKey` (Mac) and `event.ctrlKey` (Windows/Linux)
- Context detection: Check `document.activeElement` to determine which component has focus
- **Validation**: Key combination validation (warn if invalid format)
- **Risks**: Conflicts with browser shortcuts (e.g., Cmd+N opens new window) — use preventDefault

---

## Shared Types

### Entry

**Type Definition**:

```typescript
/**
 * Record entry entity
 */
export interface Entry {
  /** UUID v4 primary key */
  id: string
  /** Entry content (any length) */
  content: string
  /** Creation timestamp (Unix milliseconds) */
  createdAt: number
  /** Last update timestamp (Unix milliseconds) */
  updatedAt: number
  /** Assigned day (ISO string YYYY-MM-DD) */
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
  /** Entry content */
  content: string
  /** Assigned day (ISO string YYYY-MM-DD) */
  assignedDay: string
}

/**
 * Input for updating existing record entry
 */
export interface UpdateEntryInput {
  /** Entry content (optional) */
  content?: string
  /** Assigned day (optional) */
  assignedDay?: string
  /** Order position (optional) */
  orderPosition?: number
}
```

**Implementation Notes**

- All timestamp fields use Unix milliseconds (JavaScript `Date.now()`)
- Snake case in database (`created_at`), camelCase in TypeScript (`createdAt`)
- Repository layer handles case conversion

---

_Part of journal-core-mvp design • See [design.md](design.md) for navigation_
