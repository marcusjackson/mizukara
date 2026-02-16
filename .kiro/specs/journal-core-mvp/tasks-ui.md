# Tasks: UI Components

**Part of**: [journal-core-mvp tasks](tasks.md)  
**Theme**: UI layer components (card, editor, navigator, create form)

**⚠️ Requirements 10-11 Updates**: Tasks 7.1-7.2 need modifications for date picker trigger. See [addendum-req-10-11.md](addendum-req-10-11.md#task-b-modify-entrydayviewnavigator-component) for details.

**Related files**:

- [tasks.md](tasks.md) — Overview and navigation
- [tasks-shared.md](tasks-shared.md) — Shared utilities (Tasks 3-4)
- [tasks-composables.md](tasks-composables.md) — Module composables (Tasks 9-10)

**Prerequisites**: Tasks 1-4 complete (API layer, types, utilities available)

---

## Task 5: Entry Card Component

- [x] 5.1 (P) Implement EntryDayViewEntryCard component
  - Create presentational component to display single entry in read-only mode
  - Show content with serif font, 18px desktop / 16px mobile (per visual design)
  - Show metadata row: created timestamp (formatted), updated indicator if modified
  - Style as card: white background, subtle shadow, 8px border radius
  - Padding: 20px desktop, 16px mobile
  - Add Edit button: hover-reveal desktop, always visible mobile, 44x44px touch target
  - Emit `edit-requested` event with entry ID when Edit clicked
  - Use CSS variables for all colors, spacing, typography (no hardcoded values)
  - Ensure keyboard focus visible on Edit button
  - Handle long content with word-break CSS
  - Place in `/src/modules/entry-day-view/components/EntryDayViewEntryCard.vue`
  - _Requirements: 2.3, 2.4, 2.7, 8.1, 8.2, 8.3, 9.2, 9.3_

- [x] 5.2\* Unit tests for EntryDayViewEntryCard
  - Test component renders entry content
  - Test metadata displays created timestamp
  - Test updated indicator shows when entry modified (updatedAt > createdAt)
  - Test Edit button emits event with correct entry ID
  - Test visual styling uses CSS variables
  - Test responsive behavior (desktop vs mobile)
  - Place tests in `/src/modules/entry-day-view/components/EntryDayViewEntryCard.test.ts`
  - _Requirements: 2.3, 2.4, 8.1, 9.2_

---

## Task 6: Entry Editor Component

- [x] 6.1 (P) Implement EntryDayViewEntryEditor component
  - Create inline editor component (replaces card when editing)
  - Show editable textarea with BaseTextarea, sans-serif 16px
  - Show HTML5 date input for assigned day (labeled, below textarea)
  - Add Save button (primary style) and Cancel button (secondary style)
  - Visual distinction: 2px teal-gray border, optional background tint
  - Validate content is non-empty using vee-validate + zod schema
  - Display inline error below textarea if validation fails
  - Call `updateEntry` mutation on save
  - Emit `entry-updated` event on successful save
  - Emit `edit-cancelled` event on cancel
  - Warn user before navigating away with unsaved changes (beforeunload)
  - Auto-resize textarea for long content
  - Focus textarea on component mount
  - Support Escape key to cancel
  - Use CSS variables for styling
  - Buttons: 44x44px touch targets, proper spacing
  - Place in `/src/modules/entry-day-view/components/EntryDayViewEntryEditor.vue`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.12, 4.13, 8.1, 8.4, 9.2, 9.5_

- [x] 6.2\* Unit tests for EntryDayViewEntryEditor
  - Test component renders with entry data
  - Test textarea contains entry content
  - Test date input shows assigned day
  - Test validation prevents empty content save
  - Test Save button calls updateEntry with correct data
  - Test Cancel button emits edit-cancelled event
  - Test unsaved changes warning (beforeunload event)
  - Test Escape key cancels editing
  - Test visual styling uses CSS variables
  - Place tests in `/src/modules/entry-day-view/components/EntryDayViewEntryEditor.test.ts`
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 8.1, 9.5_

---

## Task 7: Day Navigator Component

- [x] 7.1 (P) Implement EntryDayViewNavigator component
  - Create navigation UI with four sections: [← Prev] [Current Date + Picker Icon] [Next →]
  - Display current date using formatDateLong (e.g., "Monday, February 9, 2026")
  - Make entire date display interactive (clickable button to open date picker)
  - Add calendar icon or dropdown indicator (▼) next to date text
  - Mobile: shorten to "Mon, Feb 9, 2026" if space constrained
  - Previous/Next buttons: icon-only (← →), muted gray, 44x44px touch targets
  - Layout: horizontal flexbox with space-between
  - Optional: sticky positioning for mobile (position: sticky; top: 0;)
  - Optional: 1px border-bottom separator
  - Emit `prev-day`, `next-day`, and `open-date-picker` events (no direct route manipulation)
  - Use CSS variables for styling
  - Ensure keyboard focus visible on buttons and date picker trigger
  - Place in `/src/modules/entry-day-view/components/EntryDayViewNavigator.vue`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.1, 8.1, 9.2, 9.6_

- [x] 7.2\* Unit tests for EntryDayViewNavigator
  - Test component displays formatted date
  - Test Previous button emits prev-day event
  - Test Next button emits next-day event
  - Test date picker trigger emits open-date-picker event
  - Test visual styling uses CSS variables
  - Test responsive behavior (desktop vs mobile)
  - Test keyboard accessibility (focus, tab order)
  - Place tests in `/src/modules/entry-day-view/components/EntryDayViewNavigator.test.ts`
  - _Requirements: 3.1, 3.2, 3.4, 11.1, 8.1, 9.6_

---

## Task 7.5: Date Picker Component

- [ ] 7.5.1 (P) Implement EntryDayViewDatePicker component
  - Create modal dialog component for date selection using BaseDialog
  - Accept props: open (boolean), initialDate (ISO string YYYY-MM-DD)
  - Title: "Jump to Date" (sans-serif, semibold)
  - HTML5 date input (native picker on mobile for best UX)
  - Desktop: Date input with fallback to text input if browser doesn't support
  - Label: "Select date" above input
  - Show format hint "(YYYY-MM-DD)" below input if text input used
  - Pre-fill input with initialDate on open
  - Focus date input when dialog opens
  - Validate ISO format (YYYY-MM-DD) before emitting
  - Show validation error below input if invalid date entered
  - Primary button: "Go to Date" (confirm selection)
  - Secondary button: "Cancel" (close without navigation)
  - Button layout: horizontal row, right-aligned, 12px gap, 44x44px touch targets
  - Emit `date-selected` with valid ISO date string on confirm
  - Emit `close` on cancel
  - Keyboard: Enter confirms, Escape cancels
  - Max-width 400px desktop, full-width padding mobile
  - Padding: 24px (`--spacing-6`)
  - Use CSS variables for styling
  - Proper ARIA attributes for accessibility
  - Place in `/src/modules/entry-day-view/components/EntryDayViewDatePicker.vue`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9, 11.10, 8.1, 9.2_

- [ ] 7.5.2\* Unit tests for EntryDayViewDatePicker
  - Test dialog opens when open prop is true
  - Test input pre-filled with initialDate
  - Test date-selected event emits valid ISO date on confirm
  - Test close event emits on cancel
  - Test validation error shows for invalid date format
  - Test validation prevents invalid date submission
  - Test Enter key confirms, Escape key cancels
  - Test focus management (input focused on open)
  - Test visual styling uses CSS variables
  - Test responsive behavior (desktop vs mobile)
  - Place tests in `/src/modules/entry-day-view/components/EntryDayViewDatePicker.test.ts`
  - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.8, 8.1, 9.2_

---

## Task 8: Create Form Component

- [x] 8.1 (P) Implement EntryDayViewCreateForm component
  - Create inline creation form (always visible at top of list)
  - Show textarea with BaseTextarea, sans-serif 16px, 3 rows initially
  - Placeholder: "What happened today?" or similar calm text (not pushy)
  - Placeholder color: muted (--color-text-muted)
  - Show "New Entry" button (primary style) below textarea with 12px gap
  - Disable Save button if textarea empty
  - Validate content is non-empty using vee-validate + zod schema
  - Call `createEntry` mutation with content and defaultAssignedDay prop
  - Emit `entry-created` event on success
  - Clear textarea after successful save
  - Focus returns to textarea after save (ready for next entry)
  - Support Cmd/Ctrl+S shortcut to save
  - Support Escape key to clear content (soft reset, form stays visible)
  - Style as card: white background, subtle shadow, same padding as entry cards
  - No border unless focused (2px teal-gray focus border)
  - Auto-expand textarea for longer content
  - Use CSS variables for styling
  - Place in `/src/modules/entry-day-view/components/EntryDayViewCreateForm.vue`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.5, 9.2, 9.5_

- [x] 8.2\* Unit tests for EntryDayViewCreateForm
  - Test form renders with textarea and button
  - Test Save button disabled when textarea empty
  - Test validation prevents empty content save
  - Test createEntry called with correct data (content, assignedDay)
  - Test entry-created event emitted on success
  - Test textarea clears after successful save
  - Test focus returns to textarea after save
  - Test Cmd/Ctrl+S shortcut triggers save
  - Test Escape key clears content
  - Test visual styling uses CSS variables
  - Place tests in `/src/modules/entry-day-view/components/EntryDayViewCreateForm.test.ts`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 9.5_

---

**Prerequisites**: Tasks 1-4 complete (API, types, utilities)

**Next**: [tasks-composables.md](tasks-composables.md) for module composables (Tasks 9-10)
