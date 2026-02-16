# Tasks: Orchestration & Integration

**Part of**: [journal-core-mvp tasks](tasks.md)  
**Theme**: Section components, root orchestration, page, routing

**⚠️ Requirements 10-11 Updates**: Tasks 13.1-13.2 (Root) and 14.5-14.6 (HomePage) need implementation. See [addendum-req-10-11.md](addendum-req-10-11.md) for complete details.

**Related files**:

- [tasks.md](tasks.md) — Overview and navigation
- [tasks-ui.md](tasks-ui.md) — UI components (Tasks 5-8)
- [tasks-composables.md](tasks-composables.md) — Module composables (Tasks 9-10)
- [tasks-testing.md](tasks-testing.md) — E2E tests (Tasks 15-16)

**Prerequisites**: Tasks 1-10 complete (all components and composables ready)

---

## Task 11: Navigation Section Component

- [x] 11.1 Implement EntryDayViewSectionNavigation component
  - Create section component to coordinate day navigation
  - Accept props: currentDate (ISO string), onPrevDay handler, onNextDay handler
  - Render EntryDayViewNavigator child component
  - Pass currentDate and navigation handlers to navigator
  - Thin wrapper with no business logic (pure coordination)
  - Use CSS variables for any section-level styling
  - Keep under 250 lines (Section limit)
  - Place in `/src/modules/entry-day-view/components/EntryDayViewSectionNavigation.vue`
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 11.2\* Unit tests for EntryDayViewSectionNavigation
  - Test section renders navigator component
  - Test currentDate prop passed to navigator
  - Test prev-day event bubbles to parent
  - Test next-day event bubbles to parent
  - Place tests in `/src/modules/entry-day-view/components/EntryDayViewSectionNavigation.test.ts`
  - _Requirements: 3.1, 3.2_

---

## Task 12: List Section Component

- [x] 12.1 Implement EntryDayViewSectionList component
  - Create section component to manage entry list display and modes
  - Accept props: items (Entry[]), currentDate (ISO string), onRefetch (callback)
  - Manage view/reorder mode state (mode: 'view' | 'reorder')
  - Manage editing state (editingItemId: string | null)
  - Render EntryDayViewCreateForm at top (always visible)
  - Render entry list below create form
  - Render EntryDayViewEntryCard for each entry in view mode
  - Replace card with EntryDayViewEntryEditor when entry is being edited
  - Show empty state message when no entries: "No entries yet. Start writing to capture this day's memories."
  - Empty state styling: sans-serif, muted color, 32px vertical padding, centered
  - Empty state appears below create form (form always visible)
  - Handle entry-created event from create form (call onRefetch)
  - Handle edit-requested event from cards (set editingItemId)
  - Handle entry-updated event from editor (call onRefetch, clear editingItemId)
  - Handle edit-cancelled event from editor (clear editingItemId)
  - Use useEntryReorder composable for reorder mode
  - Show up/down buttons in reorder mode (disable based on canMoveUp/canMoveDown)
  - Disable edit buttons when one entry is being edited (single-editor mode)
  - Use CSS variables for styling
  - Keep under 250 lines (Section limit)
  - Place in `/src/modules/entry-day-view/components/EntryDayViewSectionList.vue`
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 4.1, 4.2, 4.4, 4.5, 4.9, 4.10, 8.1_

- [x] 12.2\* Unit tests for EntryDayViewSectionList
  - Test section renders create form at top
  - Test section renders entry cards for each item
  - Test empty state displays when no entries
  - Test empty state message matches specification
  - Test edit mode replaces card with editor
  - Test only one entry editable at a time
  - Test entry-created event triggers refetch
  - Test entry-updated event triggers refetch and exits edit mode
  - Test edit-cancelled event exits edit mode without refetch
  - Test reorder mode shows up/down buttons
  - Test boundary checks disable buttons correctly
  - Place tests in `/src/modules/entry-day-view/components/EntryDayViewSectionList.test.ts`
  - _Requirements: 1.5, 2.2, 2.3, 4.1, 4.9, 4.10_

---

## Task 13: Root Orchestration Component

- [x] 13.1 Implement EntryDayViewRoot component
  - Create root component to orchestrate day view
  - Accept props: initialDate (ISO string or null, from route param)
  - Use useDayNavigation composable to manage current date state
  - Use findByDay query to fetch entries for current date
  - Watch currentDate changes to refetch entries
  - Provide refetch callback for mutations (create, update, reorder)
  - Manage date picker dialog state (datePickerOpen: Ref<boolean>)
  - Register global keyboard shortcuts using useKeyboardShortcuts:
    - Cmd/Ctrl+N: focus create form textarea
    - J or ↓: next day (only when no input focused)
    - K or ↑: previous day (only when no input focused)
    - G: open date picker (only when no input focused)
    - Cmd/Ctrl+S: context-aware save (create or edit)
    - Escape: context-aware cancel/clear/close date picker
  - Render EntryDayViewSectionNavigation with date and navigation handlers
  - Render EntryDayViewSectionList with entries, currentDate, refetch callback
  - Render EntryDayViewDatePicker with open state, initialDate, handle date-selected
  - Handle loading state (show spinner during fetch)
  - Handle error state (show error message, allow retry)
  - Validate initialDate, fallback to today if invalid
  - Debounce rapid day navigation if needed
  - Use CSS variables for layout styling
  - Keep under 200 lines (Root limit) — extract handlers if approaching limit
  - Place in `/src/modules/entry-day-view/components/EntryDayViewRoot.vue`
  - _Requirements: 2.1, 2.5, 3.1, 3.2, 3.5, 7.1, 7.2, 7.3, 7.4_

- [x] 13.2\* Integration tests for EntryDayViewRoot
  - Test root loads entries for current date on mount
  - Test navigation updates date and refetches entries
  - Test keyboard shortcuts trigger correct actions
  - Test refetch callback updates entry list after mutations
  - Test loading state displays while fetching
  - Test error state displays on fetch failure
  - Test invalid initialDate falls back to today
  - Test J/K shortcuts disabled when input focused
  - Place tests in `/src/modules/entry-day-view/components/EntryDayViewRoot.test.ts`
  - _Requirements: 2.1, 3.1, 3.2, 7.1, 7.2, 7.3_

---

## Task 14: Page & Routing Integration

- [x] 14.1 Implement EntryDayPage component
  - Create thin page wrapper for entry day view route
  - Use useRoute to extract date route parameter
  - Pass date parameter as initialDate prop to EntryDayViewRoot
  - Pass null if date parameter missing (root defaults to today)
  - No business logic or state management
  - Keep under 100 lines (Page limit)
  - Place in `/src/pages/EntryDayPage.vue`
  - _Requirements: 3.5, 3.6_

- [x] 14.2\* Unit tests for EntryDayPage
  - Test page renders root component
  - Test route parameter passed to root as initialDate
  - Test null passed when no route parameter
  - Place tests in `/src/pages/EntryDayPage.test.ts`
  - _Requirements: 3.5_

- [ ] 14.3 Register route for entry day view
  - Add route to vue-router configuration: `/entries/:date?`
  - Date parameter optional (falls back to today)
  - Route component: EntryDayPage
  - Route name: 'entry-day-view'
  - Default route meta (if any)
  - Update router index file at `/src/router/routes.ts`
  - _Requirements: 3.5, 3.6_

- [ ] 14.4\* Unit tests for route configuration
  - Test route registered correctly
  - Test route matches `/entries` (no date)
  - Test route matches `/entries/2026-02-09` (with date)
  - Test route component is EntryDayPage
  - Place tests in `/src/router/routes.test.ts`
  - _Requirements: 3.5_

- [ ] 14.5 Implement HomePage component with redirect
  - Create page component that immediately redirects to today's entries
  - Use useRouter from vue-router for programmatic navigation
  - Use getToday() from date-utils to determine current date in user's timezone
  - Redirect to `/entries` (no date parameter, root will default to today)
  - Use router.replace() (not push) to avoid history entry
  - Trigger redirect in onMounted lifecycle hook
  - No UI rendering (pure redirect logic)
  - Validate getToday() returns valid ISO date string
  - Keep under 100 lines (Page limit)
  - Place in `/src/pages/HomePage.vue`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14.6\* Unit tests for HomePage
  - Test page redirects on mount
  - Test redirect uses router.replace (not push)
  - Test redirect path is `/entries`
  - Test getToday() called to determine current date
  - Place tests in `/src/pages/HomePage.test.ts`
  - _Requirements: 10.1, 10.3_

---

**Prerequisites**: Tasks 1-10 complete (all foundation and components ready)

**Next**: [tasks-testing.md](tasks-testing.md) for E2E tests and validation (Tasks 15-16)
