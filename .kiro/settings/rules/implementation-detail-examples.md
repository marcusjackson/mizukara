# Implementation Detail Examples

Concrete examples of what to exclude from specifications and how to replace with contract-focused descriptions.

## Overview

Specifications should define **contracts** (inputs, outputs, behaviors, rules) not **implementation** (code, queries, algorithms). This document provides clear examples of common violations and proper alternatives.

## SQL Queries & Database Schema

### ❌ Bad: Full SQL in Specs

````markdown
**Database Schema**:

```sql
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  assigned_day TEXT NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_entries_assigned_day
  ON entries(assigned_day, is_deleted, order_position);
```
````

````

**Problem**: Duplicates schema definition from migration file. Changes require updates in both spec and migration.

### ✅ Good: Reference with Design Decisions

```markdown
**Database Schema**:

**Location**: `/src/db/migrations/001-create-entries.sql`

**Design Decisions**:

- UUID primary keys (TEXT) enable future device sync without ID conflicts
- Soft deletes (`is_deleted` flag) preserve temporal history for audit
- Composite index (assigned_day, is_deleted, order_position) optimizes day-view queries

**Key Fields**:

- `id` (TEXT, PK) - UUID v4 identifier
- `content` (TEXT, NOT NULL) - Entry content, unlimited length
- `created_at` (INTEGER, NOT NULL) - Creation timestamp (Unix ms)
- `assigned_day` (TEXT, NOT NULL) - ISO date (YYYY-MM-DD)
- `order_position` (INTEGER, DEFAULT 0) - Position within day
- `is_deleted` (INTEGER, DEFAULT 0) - Soft delete flag (0 or 1)

See migration file for complete schema definition and constraints.
````

**Why Better**: Single source of truth, explains WHY decisions were made, focuses on contracts.

---

## Algorithms & Step-by-Step Procedures

### ❌ Bad: Algorithm Pseudocode

````markdown
**Position Initialization Algorithm**:

1. Query maximum `order_position` for the assigned day:
   ```sql
   SELECT MAX(order_position) as max_pos FROM entries
   WHERE assigned_day = ? AND is_deleted = 0
   ```
````

2. If `max_pos` is NULL (no entries for that day), set `order_position = 0`
3. Otherwise, set `order_position = max_pos + 1`
4. Insert the entry using parameterized query with these exact field names

````

**Problem**: This is implementation documentation, not specification. Belongs in code comments.

### ✅ Good: Contract Description

```markdown
**Position Assignment Contract**:

- New entries are automatically appended to the end of the day's list
- First entry in a day receives position 0
- Subsequent entries receive position max + 1
- Positions are independent per day (each day starts from 0)
- Soft-deleted entries do not affect new position calculation

**Behavior Examples**:

- Day 2026-01-15 has no entries → First entry gets position 0
- Second entry created → Gets position 1
- Entry with position 1 soft-deleted → Next new entry gets position 2 (not 1)

**Implementation**: See `createEntry()` in `entry-mutations.ts`
````

**Why Better**: Describes behavior and rules without prescribing implementation. Focuses on WHAT happens, not HOW.

---

## Function Bodies & Code Structure

### ❌ Bad: Implementation Code in Specs

````markdown
**Function: validateEntry()**

```typescript
function validateEntry(content: string): boolean {
  if (!content) return false
  if (content.trim().length === 0) return false
  if (content.length > 50000) return false
  return true
}
```
````

````

**Problem**: Shows implementation code instead of contract. Code changes require spec updates.

### ✅ Good: Function Contract

```markdown
**Function: validateEntry()**

**Contract**:

```typescript
function validateEntry(content: string): Result<void, ValidationError>
````

**Validation Rules**:

- Content must not be empty or whitespace-only
- Content must not exceed 50,000 characters
- Returns validation error with field-specific message on failure

**Error Cases**:

- `ValidationError.EMPTY_CONTENT` - Content is empty or whitespace
- `ValidationError.CONTENT_TOO_LONG` - Content exceeds maximum length

**Implementation**: See `validateEntry()` in `entry-validation.ts`

````

**Why Better**: Defines contract (inputs, outputs, errors) without showing implementation.

---

## Configuration & Implementation Details

### ❌ Bad: Detailed Configuration Values

```markdown
**API Configuration**:

```typescript
const config = {
  timeout: 5000,
  retries: 3,
  retryDelay: 1000,
  maxConcurrent: 10,
  endpoints: {
    create: '/api/entries',
    update: '/api/entries/:id',
    delete: '/api/entries/:id'
  }
}
````

````

**Problem**: Implementation configuration details that frequently change.

### ✅ Good: Configuration Contract

```markdown
**API Configuration Requirements**:

- Request timeout: 5 seconds to prevent hanging requests
- Retry strategy: Up to 3 attempts with exponential backoff
- Concurrency limit: Maximum 10 concurrent requests to prevent overload
- Endpoints follow RESTful pattern: `/api/entries` and `/api/entries/:id`

**Implementation**: See `api-config.ts` for complete configuration
````

**Why Better**: Explains requirements and rationale without hardcoding values that may change.

---

## Query Methods & Implementation Logic

### ❌ Bad: Query Implementation

````markdown
**Query: findByDay()**

Implementation:

```typescript
export function findByDay(db: Database, assignedDay: string): Entry[] {
  const stmt = db.prepare(
    'SELECT * FROM entries WHERE assigned_day = ? AND is_deleted = 0 ORDER BY order_position ASC'
  )
  const rows = stmt.all(assignedDay)
  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignedDay: row.assigned_day,
    orderPosition: row.order_position,
    isDeleted: row.is_deleted === 1
  }))
}
```
````

````

**Problem**: Shows complete implementation including SQL and mapping logic.

### ✅ Good: Query Contract

```markdown
**Query: findByDay()**

**Contract**:

```typescript
function findByDay(db: Database, assignedDay: string): Entry[]
````

**Behavior**:

- Returns all active entries for the specified day
- Excludes soft-deleted entries (`is_deleted = 1`)
- Results ordered by `order_position` ascending
- Returns empty array if no entries found for day

**Input**:

- `assignedDay`: ISO date string (YYYY-MM-DD)

**Output**:

- Array of `Entry` objects with all fields populated

**Implementation**: See `findByDay()` in `entry-queries.ts`

````

**Why Better**: Describes contract without showing SQL or mapping code.

---

## Migration & Data Transformation

### ❌ Bad: Detailed Migration Steps

```markdown
**Migration Process**:

1. Create backup table: `CREATE TABLE entries_backup AS SELECT * FROM entries`
2. Add new column: `ALTER TABLE entries ADD COLUMN new_field TEXT`
3. Migrate data: `UPDATE entries SET new_field = (SELECT ... FROM ...)`
4. Validate data: Check row counts match: `SELECT COUNT(*) FROM entries` = `SELECT COUNT(*) FROM entries_backup`
5. Drop backup: `DROP TABLE entries_backup`
````

**Problem**: Step-by-step migration implementation belongs in migration script.

### ✅ Good: Migration Contract

```markdown
**Migration: Add Entry Metadata Field**

**Location**: `/src/db/migrations/002-add-entry-metadata.sql`

**Changes**:

- Adds `metadata` field (TEXT, nullable) to `entries` table
- Populates existing entries with empty JSON object `{}`
- Maintains data integrity - no data loss

**Rollback Strategy**:

- Migration can be rolled back safely
- Dropping `metadata` column doesn't affect existing functionality

**Validation**:

- All existing entries receive default metadata value
- No null values in `metadata` field after migration

See migration file for complete implementation and validation queries.
```

**Why Better**: Describes changes and contracts without implementation steps.

---

## Summary Guidelines

### What to Include (WHAT/WHY)

✅ Function signatures and contracts
✅ Input/output data shapes
✅ Business rules and invariants
✅ Error conditions and handling
✅ Expected behaviors and examples
✅ Component responsibilities
✅ Design decisions and rationale

### What to Exclude (HOW)

❌ SQL queries (reference migration files)
❌ Algorithm pseudocode
❌ Step-by-step procedures
❌ Function bodies and implementation code
❌ Detailed configuration values
❌ Specific file organization beyond modules

### How to Replace

1. **Describe contract**: Inputs, outputs, errors, rules
2. **Explain behavior**: What happens, not how it's done
3. **Reference implementation**: Point to actual code file
4. **Focus on decisions**: WHY choices were made, not HOW implemented

---

**Related Documents**:

- `.kiro/steering/specs.md` - Living documentation philosophy
- `.github/instructions/spec-writing.instructions.md` - Spec writing guidelines
- `.kiro/settings/rules/design-principles.md` - Design vs implementation principles
