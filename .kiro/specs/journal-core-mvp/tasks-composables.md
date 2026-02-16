# Tasks: Module Composables

**Part of**: [journal-core-mvp tasks](tasks.md)  
**Theme**: Module-specific composables (navigation, reordering)

**Related files**:

- [tasks.md](tasks.md) — Overview and navigation
- [tasks-shared.md](tasks-shared.md) — Shared utilities (Tasks 3-4)
- [tasks-orchestration.md](tasks-orchestration.md) — Section and root (Tasks 11-14)

**Prerequisites**: Tasks 3-4 complete (date utils, types available)

---

## Task 9: Day Navigation Composable

- [x] 9.1 (P) Implement useDayNavigation composable
  - Create composable to manage current date state and navigation
  - Accept optional initialDate parameter (ISO string or null, defaults to today)
  - Validate initialDate is valid ISO format, fallback to today if invalid
  - Provide reactive `currentDate` ref (ISO string YYYY-MM-DD)
  - Provide `goToPrevDay()` function using subtractDays util
  - Provide `goToNextDay()` function using addDays util
  - Provide `goToDate(date)` function with validation
  - Sync currentDate with route parameter using vue-router
  - Update route when currentDate changes (router.push)
  - Watch route param changes to update currentDate (handles browser back/forward)
  - Use date-utils for date arithmetic and validation
  - Export from `/src/modules/entry-day-view/composables/use-day-navigation.ts`
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7_

- [x] 9.2\* Unit tests for useDayNavigation
  - Test composable initializes with today when no date provided
  - Test composable initializes with provided date
  - Test composable defaults to today when invalid date provided
  - Test goToPrevDay decrements date by one day
  - Test goToNextDay increments date by one day
  - Test goToDate updates to specified date
  - Test route sync (currentDate changes update route param)
  - Test browser back/forward handling (route changes update currentDate)
  - Place tests in `/src/modules/entry-day-view/composables/use-day-navigation.test.ts`
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7_

---

## Task 10: Entry Reorder Composable

- [x] 10.1 (P) Implement useEntryReorder composable
  - Create composable to handle entry reordering logic
  - Accept onRefetch callback parameter (called after position updates)
  - Provide `moveEntryUp(entryId, entries)` function
  - Provide `moveEntryDown(entryId, entries)` function
  - Provide `canMoveUp(entryId, entries)` boundary check
  - Provide `canMoveDown(entryId, entries)` boundary check
  - Move up logic: find entry, swap order_position with previous entry (index - 1)
  - Move down logic: find entry, swap order_position with next entry (index + 1)
  - Boundary checks: canMoveUp returns false if index 0, canMoveDown returns false if last index
  - Call updateOrderPosition mutation twice for position swap (current and adjacent entry)
  - Call onRefetch callback after successful swap
  - Handle edge cases: entry not found, already at boundary
  - Disable operations during mutation (loading state)
  - Export from `/src/modules/entry-day-view/composables/use-entry-reorder.ts`
  - _Requirements: 4.9, 4.10, 4.11_

- [x] 10.2\* Unit tests for useEntryReorder
  - Test moveEntryUp swaps positions correctly
  - Test moveEntryUp does nothing if entry at index 0
  - Test moveEntryDown swaps positions correctly
  - Test moveEntryDown does nothing if entry at last index
  - Test canMoveUp returns correct boundary checks
  - Test canMoveDown returns correct boundary checks
  - Test updateOrderPosition called with correct parameters
  - Test onRefetch callback invoked after successful swap
  - Test handles entry not found gracefully
  - Place tests in `/src/modules/entry-day-view/composables/use-entry-reorder.test.ts`
  - _Requirements: 4.9, 4.10, 4.11_

---

**Prerequisites**: Tasks 3-4 complete (date utils, types)

**Next**: [tasks-orchestration.md](tasks-orchestration.md) for sections and root (Tasks 11-14)
