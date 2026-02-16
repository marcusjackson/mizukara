# Tasks: Shared Utilities

**Part of**: [journal-core-mvp tasks](tasks.md)  
**Theme**: Shared utilities, types, keyboard shortcuts

**Related files**:

- [tasks.md](tasks.md) — Overview and navigation
- [tasks-setup.md](tasks-setup.md) — Setup tasks (Tasks 1-2)
- [tasks-ui.md](tasks-ui.md) — UI components (Tasks 5-8)

**Prerequisites**: Tasks 1-2 complete (API layer needs types)

---

## Task 3: Shared Type Definitions

- [x] 3.1 (P) Define Entry types and interfaces
  - Define `Entry` interface with id, content, createdAt, updatedAt, assignedDay, orderPosition, isDeleted
  - Define `CreateEntryInput` interface with content, assignedDay
  - Define `UpdateEntryInput` interface with optional content, assignedDay, orderPosition
  - Use strict TypeScript types (no `any`)
  - Export from `/src/shared/types/entry-types.ts`
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 3.2\* Unit tests for type definitions
  - Test type guards or validators if implemented
  - Verify types compile correctly with TypeScript strict mode
  - Place minimal validation tests in `/src/shared/types/entry-types.test.ts`
  - _Requirements: 5.2_

---

## Task 4: Shared Utility Functions

- [x] 4.1 (P) Implement date utility functions
  - Create `formatDateISO(date)` to format Date as YYYY-MM-DD string
  - Create `formatDateLong(date)` to format as "Monday, January 15, 2026"
  - Create `formatDateShort(date)` to format as "Jan 15"
  - Create `addDays(date, days)` and `subtractDays(date, days)` for date arithmetic
  - Create `getToday()` to return today's date as ISO string
  - Create `isValidISODate(dateString)` to validate YYYY-MM-DD format using regex
  - Create `parseISODate(dateString)` to parse ISO string to Date object
  - Use native JavaScript Date API (no external libraries)
  - Handle timezone as local (no UTC conversion for MVP)
  - Export from `/src/shared/utils/date-utils.ts`
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 4.2 (P) Unit tests for date utilities
  - Test formatDateISO returns YYYY-MM-DD format
  - Test formatDateLong returns full date string
  - Test addDays/subtractDays correctly add/subtract days
  - Test getToday returns current date
  - Test isValidISODate validates format correctly (valid and invalid cases)
  - Test parseISODate converts string to Date object
  - Place tests in `/src/shared/utils/date-utils.test.ts`
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 4.3 (P) Implement UUID generation utility
  - Create `generateUUID()` function wrapping `crypto.randomUUID()`
  - Add browser compatibility check (fallback or error if not supported)
  - Export from `/src/shared/utils/uuid-utils.ts`
  - _Requirements: 1.7, 5.2_

- [x] 4.4 (P) Unit tests for UUID utility
  - Test generateUUID returns valid UUID v4 format (regex match)
  - Test generateUUID returns unique values across multiple calls
  - Place tests in `/src/shared/utils/uuid-utils.test.ts`
  - _Requirements: 1.7, 5.2_

- [x] 4.5 (P) Implement keyboard shortcuts composable
  - Create `useKeyboardShortcuts(shortcuts)` composable
  - Accept array of shortcuts with key, handler, preventDefault options
  - Register document-level keydown listeners in onMounted
  - Clean up listeners in onUnmounted
  - Parse key combinations (e.g., "cmd+n" → Cmd/Ctrl+N)
  - Support context-aware behavior: check `document.activeElement` to detect if textarea/input focused
  - Prevent navigation shortcuts (J/K) when input fields focused
  - Support Cmd/Ctrl+S for both create form and edit mode contexts
  - Support Escape for context-specific actions (clear in create form, exit in edit mode)
  - Handle cross-platform (metaKey for Mac, ctrlKey for Windows/Linux)
  - Export from `/src/shared/composables/use-keyboard-shortcuts.ts`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4.6\* Unit tests for keyboard shortcuts
  - Test shortcut registration and cleanup
  - Test key combination parsing (cmd+n, k, escape)
  - Test preventDefault behavior
  - Test context detection (activeElement checks)
  - Test cross-platform Cmd/Ctrl handling
  - Place tests in `/src/shared/composables/use-keyboard-shortcuts.test.ts`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

---

**Prerequisites**: Tasks 1-2 complete (migration and API layer)

**Next**: [tasks-ui.md](tasks-ui.md) for UI components (Tasks 5-8)
