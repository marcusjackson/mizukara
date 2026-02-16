# Tasks: Setup & Foundation

**Part of**: [journal-core-mvp tasks](tasks.md)  
**Theme**: Database setup, migrations, API layer foundation

**Related files**:

- [tasks.md](tasks.md) — Overview and navigation
- [tasks-shared.md](tasks-shared.md) — Shared utilities (Tasks 3-4)
- [tasks-ui.md](tasks-ui.md) — UI components (Tasks 5-8)

---

## Task 1: Database Schema & Migration

- [x] 1.1 (P) Create entries table migration
  - Define entries table schema with UUID primary key, content, timestamps, assigned_day, order_position, is_deleted
  - Create composite index on (assigned_day, is_deleted, order_position) for day queries
  - Create index on is_deleted for future soft delete filtering
  - Use `IF NOT EXISTS` clauses for idempotency
  - Place migration in `/src/db/migrations/001-create-entries.sql`
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 1.2 (P) Verify migration execution
  - Write unit test to verify migration runs successfully
  - Verify table schema matches design specification
  - Verify indexes created correctly
  - Test idempotency (migration safe to re-run)
  - Place test in `/src/db/migrations/001-create-entries.test.ts`
  - _Requirements: 5.1, 5.7_

---

## Task 2: API Layer - Entry Queries & Mutations

- [x] 2.1 (P) Implement entry query functions
  - Create `findByDay(db, assignedDay)` to query entries for specific day
  - Use composite index, filter by `is_deleted = 0`, order by `order_position ASC, created_at ASC`
  - Create `findById(db, id)` to query single entry by UUID
  - Filter soft-deleted entries from results
  - Map database snake_case to TypeScript camelCase
  - Convert is_deleted INTEGER (0/1) to boolean (false/true)
  - Place in `/src/api/entries/entry-queries.ts`
  - _Requirements: 2.1, 2.6_

- [x] 2.2\* Unit tests for entry queries
  - Test findByDay returns entries for correct day only
  - Test findByDay excludes soft-deleted entries
  - Test findByDay orders by order_position then created_at
  - Test findByDay returns empty array for day with no entries
  - Test findById returns entry when exists, null when not found
  - Test findById excludes soft-deleted entries
  - Place tests in `/src/api/entries/entry-queries.test.ts`
  - _Requirements: 2.1, 2.6_

- [x] 2.3 (P) Implement entry mutation functions
  - Create `createEntry(db, input)` to insert new entry
  - Generate UUID v4, set created_at and updated_at to current timestamp
  - Calculate initial order_position: query max for assigned day, set to max+1 or 0
  - Create `updateEntry(db, id, input)` to update existing entry
  - Update only provided fields, always set updated_at to current timestamp
  - Create `updateOrderPosition(db, id, newOrderPosition)` for reordering
  - Create `softDeleteEntry(db, id)` to set is_deleted flag
  - Map TypeScript camelCase to database snake_case
  - Place in `/src/api/entries/entry-mutations.ts`
  - _Requirements: 1.1, 1.3, 1.4, 1.7, 4.3, 4.10, 4.13, 5.3, 5.4_

- [x] 2.4\* Unit tests for entry mutations
  - Test createEntry generates valid UUID
  - Test createEntry sets timestamps correctly
  - Test createEntry calculates order_position (0 for first, max+1 for subsequent)
  - Test updateEntry preserves created_at, updates updated_at
  - Test updateEntry accepts partial input
  - Test updateOrderPosition updates only order_position field
  - Test softDeleteEntry sets is_deleted flag and updated_at
  - Place tests in `/src/api/entries/entry-mutations.test.ts`
  - _Requirements: 1.3, 1.4, 4.3, 4.10, 4.13, 5.3, 5.4_

---

**Prerequisites**: None (foundation tasks)

**Next**: [tasks-shared.md](tasks-shared.md) for shared utilities (Tasks 3-4)
