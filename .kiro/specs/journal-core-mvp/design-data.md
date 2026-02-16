# Design: Data Models & Schema

**Part of**: [journal-core-mvp design](design.md)  
**Theme**: Data models, database schema, migrations

**Related files**:

- [design.md](design.md) — Overview and navigation
- [design-architecture.md](design-architecture.md) — Architecture patterns
- [design-components.md](design-components.md) — Component specifications

---

## Domain Model

**Aggregate Root**: Entry

**Entities**:

- Entry — Core entity representing a single record/note/entry

**Value Objects**:

- AssignedDay (ISO date string) — Conceptual time context, not creation time
- OrderPosition (integer) — Relative position within a day for custom ordering

**Domain Events** (future consideration, not MVP):

- EntryCreated
- EntryUpdated
- EntryDeleted
- EntryReordered
- EntryDayReassigned

**Business Rules & Invariants**:

- Content cannot be empty
- AssignedDay must be valid ISO date (YYYY-MM-DD)
- OrderPosition must be non-negative integer
- CreatedAt timestamp immutable after creation
- UpdatedAt timestamp set on every modification
- Soft deletes only (is_deleted flag, never hard delete)

**Relationships**:

- Entry has no relationships in MVP (future: tags, links, projects)

---

## Logical Data Model

**Entity**: Entry

**Attributes**:

- `id` (TEXT, UUID v4) — Primary key
- `content` (TEXT) — Entry content, variable length
- `created_at` (INTEGER) — Creation timestamp (Unix ms)
- `updated_at` (INTEGER) — Last update timestamp (Unix ms)
- `assigned_day` (TEXT) — ISO date string (YYYY-MM-DD)
- `order_position` (INTEGER) — Custom order within day
- `is_deleted` (INTEGER) — Soft delete flag (0 or 1)

**Consistency & Integrity**:

- **Transaction Boundaries**: Single-item operations (create, update, delete) are atomic
- **Referential Integrity**: None (no foreign keys in MVP)
- **Temporal Aspects**:
  - `created_at` immutable after creation
  - `updated_at` updated on every modification
  - Soft deletes preserve temporal history

---

## Physical Data Model

**Database**: SQLite (sql.js WebAssembly)

### Table Definition

**Schema Location**: `/src/db/migrations/001-create-entries.sql`

**Design Decisions**:

- **UUID TEXT Primary Key**: Supports future device sync (no ID collisions across devices)
- **INTEGER Timestamps**: SQLite-efficient, JavaScript `Date.now()` compatible
- **TEXT Assigned Day**: ISO format enables lexicographic sorting, human-readable
- **Soft Deletes**: Required for sync (can't propagate hard deletes across devices)
- **Order Position**: Explicit ordering within day (not reliant on timestamp)

**Key Fields**:

| Field          | Type    | Purpose                                                        |
| -------------- | ------- | -------------------------------------------------------------- |
| id             | TEXT    | UUID v4 identifier for entries                                 |
| content        | TEXT    | Entry content, unlimited length for flexibility                |
| created_at     | INTEGER | Creation timestamp (Unix ms), immutable after creation         |
| updated_at     | INTEGER | Last update timestamp (Unix ms), updated on every modification |
| assigned_day   | TEXT    | ISO date (YYYY-MM-DD) for day-based organization               |
| order_position | INTEGER | Position within day (0, 1, 2...), supports custom ordering     |
| is_deleted     | INTEGER | Soft delete flag: 0 = active, 1 = deleted                      |

**Index Strategy**:

- **Composite index** (assigned_day, is_deleted, order_position): Optimizes day view queries (primary access pattern)
  - Covers WHERE clause and ORDER BY in single index scan
  - Most frequent operation: fetch all active entries for a day
- **Single-column index** (is_deleted): Supports future "show deleted items" feature
  - Minimal overhead, infrequently updated

See migration file for complete schema definition, constraints, and index creation statements.

---

## Migration Strategy

### Migration

**Location**: `/src/db/migrations/001-create-entries.sql`

**Migration Properties**:

- **Idempotent**: Uses `IF NOT EXISTS` clauses, safe to re-run
- **No Rollback**: Project doesn't support down migrations
- **Version**: 001 (first migration in project)
- **Creates**: entries table with all fields and indexes

**Migration Runner**:

- Existing at `/src/db/migrations/index.ts`
- Runs on database initialization
- Tracks completed migrations (future enhancement)

See migration file for complete SQL statements.

---

## Data Contracts & Integration

### Repository Result Mapping

**Database to TypeScript**:

```typescript
// Database row (snake_case)
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  content: "Sample entry content",
  created_at: 1735689600000,
  updated_at: 1735689600000,
  assigned_day: "2026-01-15",
  order_position: 0,
  is_deleted: 0
}

// TypeScript entity (camelCase)
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  content: "Sample record item",
  createdAt: 1735689600000,
  updatedAt: 1735689600000,
  assignedDay: "2026-01-15",
  orderPosition: 0,
  isDeleted: false
}
```

**Case Conversion**:

- Snake case in database (SQL convention)
- Camel case in TypeScript (JavaScript convention)
- Repository layer handles conversion via helper functions
- Boolean conversion: INTEGER 0/1 → boolean false/true

### API Data Transfer

**CreateEntryInput**:

```typescript
interface CreateEntryInput {
  content: string // Required, non-empty
  assignedDay: string // Required, ISO date YYYY-MM-DD
}
```

**UpdateEntryInput**:

```typescript
interface UpdateEntryInput {
  content?: string // Optional, non-empty if provided
  assignedDay?: string // Optional, ISO date YYYY-MM-DD if provided
  orderPosition?: number // Optional, non-negative integer if provided
}
```

**Entry (Full Entity)**:

```typescript
interface Entry {
  id: string // UUID v4
  content: string
  createdAt: number // Unix ms
  updatedAt: number // Unix ms
  assignedDay: string // ISO date YYYY-MM-DD
  orderPosition: number
  isDeleted: boolean
}
```

---

## Query Patterns

### Query Contracts

**Find by Day** (most frequent operation):

- **Input**: ISO date string (YYYY-MM-DD)
- **Output**: Array of entries assigned to that day
- **Filtering**: Excludes soft-deleted entries
- **Ordering**: Primary by `order_position` ASC, secondary by `created_at` ASC
- **Edge Cases**: Duplicate positions resolved by creation time (oldest first)
- **Performance**: Indexed query, optimized for small result sets (typical: 10-50 entries/day)
- **Implementation**: See `findByDay()` in `/src/api/entries/entry-queries.ts`

**Find by ID** (single entry lookup):

- **Input**: Entry UUID
- **Output**: Single entry or null if not found
- **Filtering**: Excludes soft-deleted entries
- **Performance**: Primary key lookup (O(1))
- **Implementation**: See `findById()` in `/src/api/entries/entry-queries.ts`

### Mutation Contracts

**Create Entry**:

- **Input**: Content (string), assigned day (ISO date)
- **Generated Fields**: UUID (crypto.randomUUID), timestamps (Date.now())
- **Position Assignment**: New entries appended to end of day's list (max position + 1, or 0 for first entry)
- **Output**: Newly created entry with all fields populated
- **Invariants**: Each day has independent position sequence starting from 0
- **Implementation**: See `createEntry()` in `/src/api/entries/entry-mutations.ts`

**Update Entry**:

- **Input**: Entry ID, optional fields (content, assigned day, order position)
- **Auto-Updated**: `updated_at` timestamp set to current time
- **Preserved**: `created_at` never changes after creation
- **Output**: Updated entry
- **Implementation**: See `updateEntry()` in `/src/api/entries/entry-mutations.ts`

**Update Order Position** (reordering operation):

- **Behavior**: Swaps position values between two adjacent entries
- **Atomicity**: Both entries updated in same operation
- **Invariants**: No gaps introduced in position sequence
- **Output**: Both entries updated with new positions
- **Implementation**: See `updateOrderPosition()` in `/src/api/entries/entry-mutations.ts`

**Soft Delete**:

- **Behavior**: Sets `is_deleted` flag to true, updates timestamp
- **Design Rationale**: Enables sync and potential undo functionality
- **Output**: Entry marked as deleted (excluded from queries)
- **Implementation**: See `softDeleteEntry()` in `/src/api/entries/entry-mutations.ts`

---

## Performance Considerations

### Query Performance Targets

| Operation     | Target | Index Used               | Notes                        |
| ------------- | ------ | ------------------------ | ---------------------------- |
| Find by day   | < 5ms  | idx_entries_assigned_day | For < 50 entries             |
| Find by ID    | < 1ms  | PRIMARY KEY              | Single row lookup            |
| Create entry  | < 10ms | None (INSERT)            | Includes UUID generation     |
| Update entry  | < 5ms  | PRIMARY KEY              | Single row update            |
| Reorder entry | < 10ms | PRIMARY KEY              | Two updates (swap positions) |

### Scalability Estimates

**Typical User Data**:

- Average entries per day: 10-20
- Days with data per year: 200-300
- Total entries per year: 2,000-6,000
- 10-year dataset: 20,000-60,000 items

**Performance Projections**:

- SQLite handles 100k+ rows efficiently in browser
- Day queries remain fast (indexed, small result sets)
- Full-text search (future) would require FTS5 extension

**Optimization Strategies** (if needed):

- Virtualization for long day lists (100+ items)
- Pagination for "all items" views (future feature)
- FTS5 for full-text search (future feature)
- Archive old data to separate table (multi-year usage)

---

## Future Schema Considerations

**Prepared for Future Features**:

1. **Tags/Categories** (post-MVP):
   - New table: `tags` (id, name, color)
   - Junction table: `record_item_tags` (item_id, tag_id)

2. **Full-Text Search** (post-MVP):
   - FTS5 virtual table: `entries_fts`
   - Synced with entries via triggers

3. **Links Between Items** (post-MVP):
   - New table: `record_item_links` (from_id, to_id, link_type)

4. **Projects/Groupings** (post-MVP):
   - New table: `projects` (id, name, description)
   - Foreign key: `entries.project_id`

5. **Device Sync Metadata** (post-MVP):
   - New column: `device_id TEXT` (origin device)
   - New table: `sync_log` (id, device_id, synced_at)

**Schema Migration Path**:

- Add columns with ALTER TABLE (backward compatible)
- Create new tables with foreign keys pointing to entries
- Use migration versioning (002-add-tags.sql, 003-add-search.sql, etc.)

---

_Part of journal-core-mvp design • See [design.md](design.md) for navigation_
