# Design: UI Components & Module Layer

**Part of**: [journal-core-mvp design](design.md)  
**Theme**: Vue components (Page, Root, Section, UI) and module composables

**Related files**:

- [design.md](design.md) — Overview and navigation
- [design-architecture.md](design-architecture.md) — Architecture patterns
- [design-api.md](design-api.md) — API layer and shared utilities
- [design-data.md](design-data.md) — Data models and schema

---

## Component Summary

| Component                     | Domain/Layer      | Intent                                      | Req Coverage | Key Dependencies (P0)                                 |
| ----------------------------- | ----------------- | ------------------------------------------- | ------------ | ----------------------------------------------------- |
| HomePage                      | Page              | Redirect to today's entry view              | 10           | vue-router, date-utils                                |
| EntryDayPage                  | Page              | Route entry point                           | All          | EntryDayViewRoot                                      |
| EntryDayViewRoot              | Module/Root       | Orchestrate day view, fetch data, shortcuts | 2, 3, 7, 11  | use-day-navigation, findByDay, use-keyboard-shortcuts |
| EntryDayViewSectionNavigation | Module/Section    | Day navigation controls, date display       | 3, 11        | EntryDayViewNavigator, use-day-navigation             |
| EntryDayViewSectionList       | Module/Section    | Entry list layout, mode management          | 1, 2, 4      | EntryDayViewEntryCard, EntryDayViewEntryEditor        |
| EntryDayViewEntryCard         | Module/UI         | Display single entry in read mode           | 2            | Entry type                                            |
| EntryDayViewEntryEditor       | Module/UI         | Edit entry content, assigned day            | 4            | updateEntry, BaseTextarea                             |
| EntryDayViewNavigator         | Module/UI         | Day navigation buttons and date display     | 3, 11        | use-day-navigation, date-utils                        |
| EntryDayViewDatePicker        | Module/UI         | Direct date selection dialog                | 11           | BaseDialog, date-utils                                |
| EntryDayViewCreateForm        | Module/UI         | Inline entry creation                       | 1            | createEntry, BaseTextarea                             |
| use-day-navigation            | Module/Composable | Date state, navigation, route sync          | 3            | date-utils                                            |
| use-entry-reorder             | Module/Composable | Reorder logic (move up/down)                | 4            | updateOrderPosition                                   |

---

## Page Layer

### HomePage

| Field        | Detail                             |
| ------------ | ---------------------------------- |
| Intent       | Redirect to today's entry day view |
| Requirements | 10.1-10.5                          |

**Responsibilities & Constraints**

- Immediately redirect to `/entries` with today's date
- Use local timezone to determine "today"
- Client-side navigation (no page reload)
- No UI rendering, just redirect logic
- File size: Under 100 lines (Page limit)

**Dependencies**

- External: vue-router useRouter — programmatic navigation (P0)
- External: date-utils getToday — current date in user's timezone (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
// No props or emits — pure redirect component

interface HomePageBehavior {
  /** Lifecycle: onMounted triggers immediate redirect */
  onMounted: () => void
}
```

- **Preconditions**: Router ready, date utility available
- **Postconditions**: User navigated to `/entries` with today's date
- **Invariants**: Always redirects, never displays content

**Implementation Notes**: Use `onMounted` to trigger redirect, `router.replace` for no history entry, format date as ISO string (YYYY-MM-DD), validate getToday() returns valid date.

### EntryDayPage

| Field        | Detail                            |
| ------------ | --------------------------------- |
| Intent       | Route entry point for day view    |
| Requirements | All (delegates to root component) |

**Responsibilities & Constraints**

- Thin wrapper around EntryDayViewRoot
- Extracts route parameter (date) and passes to root
- No business logic or state management
- File size: Under 100 lines (Page limit)

**Dependencies**

- Outbound: EntryDayViewRoot — main orchestrator (P0)
- External: vue-router useRoute — route parameter extraction (P0)

**Implementation Notes**: Register route `/entries/:date?`, pass null for missing date param (root defaults to today), delegate loading/error to root.

---

## Module: entry-day-view (Root/Orchestration)

### EntryDayViewRoot

| Field        | Detail                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------- |
| Intent       | Orchestrate day view: fetch items, manage date state, handle keyboard shortcuts, date picker |
| Requirements | 2.1-2.7, 3.1-3.7, 7.1-7.6, 11.1-11.10                                                        |

**Responsibilities & Constraints**

- Load entries for currently selected day
- Coordinate navigation state with day navigator
- Register global keyboard shortcuts (including date picker trigger)
- Manage date picker dialog state (open/close)
- Handle direct date navigation from date picker
- Provide refetch callback to section for mutations
- File size: Under 200 lines (Root limit)

**Dependencies**

- Inbound: EntryDayPage — receives date prop (P0)
- Outbound: EntryDayViewSectionNavigation — passes current date and navigation handlers (P0)
- Outbound: EntryDayViewSectionList — passes entries and refetch callback (P0)
- Outbound: EntryDayViewDatePicker — passes open state, current date, handles selection (P0)
- Outbound: use-day-navigation — date state management (P0)
- Outbound: entry-queries.findByDay — data fetch (P0)
- Outbound: use-keyboard-shortcuts — global shortcuts (P0)

**Contracts**: Service ☑ State ☑

#### Service Interface

```typescript
interface EntryDayViewRootProps {
  /** Initial date from route param (ISO string YYYY-MM-DD) or null for today */
  initialDate?: string | null
}

interface EntryDayViewRootEmits {
  // No events — self-contained view
}
```

- **Preconditions**: Database initialized, route param valid ISO date or null
- **Postconditions**: Items loaded and passed to section, keyboard shortcuts registered, date picker ready
- **Invariants**: Current date always valid ISO string, date picker state managed correctly

#### State Management

- **State Model**:
  - `currentDate: Ref<string>` — ISO date string (YYYY-MM-DD)
  - `items: Ref<Entry[]>` — Items for current day
  - `isLoading: Ref<boolean>` — Fetch in progress
  - `error: Ref<Error | null>` — Fetch error if any
  - `datePickerOpen: Ref<boolean>` — Whether date picker dialog is open
- **Persistence**: Date persisted to URL (route param), entries fetched from SQLite, date picker state ephemeral
- **Concurrency Strategy**: Sequential (one fetch at a time, ignore stale requests)

**Implementation Notes**: `watch(currentDate)` triggers refetch, `onMounted/Unmounted` handles shortcuts lifecycle, validate ISO date (fallback to today), debounce rapid navigation, keyboard shortcuts include: Cmd/Ctrl+N (new entry), J/K or ↓/↑ (next/prev day, no input focus), Cmd/Ctrl+S (save), Escape (cancel), **G (open date picker, no input focus)**.

---

### EntryDayViewSectionNavigation

| Field        | Detail                                           |
| ------------ | ------------------------------------------------ |
| Intent       | Day navigation controls and current date display |
| Requirements | 3.1-3.7                                          |

**Responsibilities & Constraints**

- Display current date prominently
- Provide previous/next day navigation buttons
- Show EntryDayViewNavigator UI component
- File size: Under 250 lines (Section limit)

**Dependencies**

- Inbound: EntryDayViewRoot — receives current date and navigation handlers (P0)
- Outbound: EntryDayViewNavigator — date display and navigation buttons (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
interface EntryDayViewSectionNavigationProps {
  /** Current date being viewed (ISO string YYYY-MM-DD) */
  currentDate: string
  /** Handler for previous day navigation */
  onPrevDay: () => void
  /** Handler for next day navigation */
  onNextDay: () => void
}

interface EntryDayViewSectionNavigationEmits {
  // No events — uses prop handlers instead
}
```

- **Preconditions**: currentDate is valid ISO string, handlers provided
- **Postconditions**: UI displays current date, navigation buttons trigger handlers
- **Invariants**: Date always valid ISO format

**Implementation Notes**: Thin wrapper around EntryDayViewNavigator, separates navigation from list concerns, no validation (delegated to root).

---

## Module: entry-day-view (Section/Layout)

### EntryDayViewSectionList

| Field        | Detail                                                                          |
| ------------ | ------------------------------------------------------------------------------- |
| Intent       | Display list of items, manage view/reorder modes, coordinate create/edit/delete |
| Requirements | 1.1-1.8, 2.1-2.7, 4.1-4.14                                                      |

**Responsibilities & Constraints**

- Render list of entries (EntryDayViewEntryCard components)
- Toggle between view mode and reorder mode
- Show inline creation form
- Coordinate entry updates with root refetch callback
- File size: Under 250 lines (Section limit)

**Dependencies**

- Inbound: EntryDayViewRoot — receives items, refetch callback, current date (P0)
- Outbound: EntryDayViewEntryCard — entry display (P0)
- Outbound: EntryDayViewEntryEditor — entry editing (P0)
- Outbound: EntryDayViewCreateForm — entry creation (P0)
- Outbound: use-entry-reorder — reorder logic (P0)
- Outbound: entry-mutations — update/delete operations (P0)

**Contracts**: Service ☑ State ☑

#### Service Interface

```typescript
interface EntryDayViewSectionListProps {
  /** Items to display */
  items: Entry[]
  /** Current date (for default assigned day in create form) */
  currentDate: string
  /** Callback to refetch entries after mutations */
  onRefetch: () => Promise<void>
}

interface EntryDayViewSectionListEmits {
  // No events — uses refetch callback instead
}
```

- **Preconditions**: Items array provided (may be empty), currentDate valid ISO string
- **Postconditions**: UI reflects entry list state, modes (view/reorder) are mutually exclusive
- **Invariants**: Only one mode active at a time (view or reorder)

#### State Management

- **State Model**:
  - `mode: Ref<'view' | 'reorder'>` — Current list mode
  - `editingItemId: Ref<string | null>` — Item currently being edited (inline)
- **Persistence**: Ephemeral (no persistence)
- **Concurrency Strategy**: Single-editor at a time (disable edit buttons when one entry editing)

**Implementation Notes**: Reorder mode shows up/down buttons, view mode shows read-only cards with Edit button, create form always visible at top. No validation (delegated). Consider virtualization for large lists (post-MVP).

---

## Module: entry-day-view (UI Components)

### EntryDayViewEntryCard

| Field        | Detail                                        |
| ------------ | --------------------------------------------- |
| Intent       | Display single record entry in read-only mode |
| Requirements | 2.3, 2.4, 2.7                                 |

**Responsibilities & Constraints**

- Show entry content (full text, no truncation)
- Show metadata (created timestamp, updated indicator if modified)
- Provide "Edit" button (emits event, no inline editing logic)
- File size: Under 200 lines (UI limit)

**Dependencies**

- Inbound: EntryDayViewSectionList — receives entry prop (P0)
- External: Entry type — entry data structure (P0)

**Contracts**: None (pure presentation)

**Visual Specifications** (see `.kiro/steering/visual-design.md` for complete patterns):

- Entry card with white background, subtle shadow, serif content (18px desktop/16px mobile)
- Metadata: sans-serif 14px, muted gray, horizontal row below content
- Edit button: hover-reveal (desktop), always visible (mobile), 44x44px touch target
- Spacing: `--spacing-5` padding (desktop), `--spacing-4` (mobile), `--spacing-3` content-to-metadata gap

**Implementation Notes**: Emits `edit-requested` with entry ID, no validation (displays as-is), Edit button needs visible focus indicator, CSS word-break handles long content.

---

### EntryDayViewEntryEditor

| Field        | Detail                                                |
| ------------ | ----------------------------------------------------- |
| Intent       | Edit entry content, assigned day, and metadata inline |
| Requirements | 4.1-4.8, 4.12-4.14                                    |

**Responsibilities & Constraints**

- Inline editor (replaces EntryDayViewEntryCard when active)
- Edit content (textarea), assigned day (date picker), metadata display
- Save/Cancel actions
- Warn on unsaved changes (beforeunload)
- File size: Under 200 lines (UI limit)

**Dependencies**

- Inbound: EntryDayViewSectionList — receives entry prop, edit mode flag (P0)
- Outbound: BaseTextarea — content input (P0)
- Outbound: BaseButton — Save/Cancel buttons (P0)
- Outbound: entry-mutations.updateEntry — persist changes (P0)
- External: Entry type — entry data structure (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
interface EntryDayViewEntryEditorProps {
  /** Item being edited */
  item: Entry
}

interface EntryDayViewEntryEditorEmits {
  /** Emitted after successful save */
  'item-updated': (item: Entry) => void
  /** Emitted when user cancels editing */
  'edit-cancelled': () => void
}
```

- **Preconditions**: Item provided with valid ID
- **Postconditions**: Changes persisted to database or discarded on cancel
- **Invariants**: Content cannot be empty (validation enforced)

**Visual Specifications** (see `.kiro/steering/visual-design.md` for complete patterns):

- Inline editor replaces card, same dimensions
- Visual distinction: 2px teal-gray border (`--color-border-focus`), optional background tint
- Textarea: sans-serif 16px, auto-expand, internal padding 16px
- Date picker: HTML5 native input, labeled, below textarea
- Buttons: Primary Save, Secondary Cancel, 44x44px touch targets, horizontal row at bottom
- Spacing: 16px padding, 12px gaps between elements

**Implementation Notes**: vee-validate for non-empty content, HTML5 date input, unsaved changes warning (`onBeforeUnmount`/`beforeunload`), focus to textarea on activate, Escape cancels, auto-resize for long content.

---

### EntryDayViewNavigator

| Field        | Detail                                                          |
| ------------ | --------------------------------------------------------------- |
| Intent       | Navigate between days (prev/next buttons), display current date |
| Requirements | 3.1-3.7, 11.1-11.10                                             |

**Responsibilities & Constraints**

- Display current date prominently (readable format)
- Provide prev/next day buttons (clear affordance)
- Provide date picker trigger button for direct date selection
- Emit navigation events (no direct route manipulation)
- Emit date picker open event
- File size: Under 200 lines (UI limit)

**Visual Design** (per `.kiro/steering/visual-design.md`):

- **Layout**: Horizontal flexbox with four sections: `[← Prev] [Current Date + Picker Icon] [Next →]`
- **Container**:
  - Background: `--color-surface` (white) or transparent (depends on page layout)
  - Padding: `--spacing-4` (16px) vertical, `--spacing-5` (20px) horizontal
  - Border-bottom: `1px solid var(--color-border)` to separate from entry list
  - Sticky positioning: Consider `position: sticky; top: 0;` for mobile scrolling
- **Current Date Display**:
  - Font: Sans-serif (`--font-family-sans`), `--font-size-xl` (20px), `--font-weight-semibold`
  - Color: `--color-text-primary`
  - Format: "Sunday, February 9, 2026" (full weekday + month name + year)
  - Mobile: Shorten to "Sun, Feb 9, 2026" if space constrained
  - Centered horizontally between nav buttons
  - Interactive: Entire date display acts as button to open date picker
- **Date Picker Trigger**:
  - Icon: Calendar icon or dropdown indicator (▼) next to date text
  - Style: Same as date text but interactive (pointer cursor)
  - Behavior: Click opens EntryDayViewDatePicker dialog
  - Touch target: Minimum 44x44px for mobile
- **Navigation Buttons**:
  - Style: Icon-only (← and →), secondary ghost buttons
  - Color: `--color-text-secondary` (muted, unobtrusive)
  - Size: 44x44px touch targets minimum (mobile requirement)
  - Desktop: 40x40px buttons with hover state
- **Integration**:
  - Emits `prev-day`, `next-day`, and `open-date-picker` events (handled by root)
  - Date display format: `formatDateLong(date)` from date-utils
- **Validation**: None (date provided by root, assumed valid)
- **Risks**: None (simple UI component)

**Dependencies**

- Inbound: EntryDayViewSectionNavigation — receives currentDate, navigation handlers (P0)
- Outbound: date-utils.formatDateLong — date formatting (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
interface EntryDayViewNavigatorProps {
  /** Current date being viewed (ISO string YYYY-MM-DD) */
  currentDate: string
}

interface EntryDayViewNavigatorEmits {
  /** User clicked previous day */
  'prev-day': () => void
  /** User clicked next day */
  'next-day': () => void
  /** User clicked date picker trigger */
  'open-date-picker': () => void
}
```

- **Preconditions**: currentDate is valid ISO string
- **Postconditions**: UI displays date and navigation controls, events emitted on interaction
- **Invariants**: Date always valid ISO format

**Implementation Notes**: Date display is clickable button, calendar icon indicates interactivity, uses formatDateLong for display, responsive layout for mobile.

---

### EntryDayViewDatePicker

| Field        | Detail                                                         |
| ------------ | -------------------------------------------------------------- |
| Intent       | Direct date selection dialog with input and calendar interface |
| Requirements | 11.1-11.10                                                     |

**Responsibilities & Constraints**

- Display modal/dialog for date selection
- Support text input (YYYY-MM-DD format) and native date picker
- Default to currently viewed date
- Validate date input
- Emit event on date selection confirmation
- File size: Under 200 lines (UI limit)

**Dependencies**

- Inbound: EntryDayViewRoot — receives currentDate, open state (P0)
- Outbound: BaseDialog — modal container (P0)
- Outbound: BaseButton — Confirm/Cancel buttons (P0)
- Outbound: date-utils — date validation and formatting (P0)

**Contracts**: Service ☑ State ☑

#### Service Interface

```typescript
interface EntryDayViewDatePickerProps {
  /** Whether date picker is open */
  open: boolean
  /** Initial date to show in picker (ISO string YYYY-MM-DD) */
  initialDate: string
}

interface EntryDayViewDatePickerEmits {
  /** User confirmed date selection */
  'date-selected': (date: string) => void
  /** User cancelled date selection */
  close: () => void
}
```

- **Preconditions**: initialDate is valid ISO string, open is boolean
- **Postconditions**: Valid date emitted on confirm, dialog closes on cancel
- **Invariants**: Emitted date is always valid ISO string (YYYY-MM-DD)

#### State Management

- **State Model**:
  - `selectedDate: Ref<string>` — Currently selected date in picker (ISO string)
  - `validationError: Ref<string | null>` — Error message if invalid date entered
- **Persistence**: Ephemeral (no persistence)
- **Concurrency Strategy**: N/A (modal dialog)

**Visual Design** (per `.kiro/steering/visual-design.md`):

- **Container**:
  - BaseDialog modal with max-width 400px (desktop), full-width padding (mobile)
  - Title: "Jump to Date" (sans-serif, semibold)
  - Padding: `--spacing-6` (24px)
- **Date Input**:
  - Desktop: HTML5 date input with fallback to text input
  - Mobile: Native date picker (optimal mobile UX per Requirement 11.9)
  - Label: "Select date" (above input)
  - Format hint: "(YYYY-MM-DD)" below input if text input used
  - Validation: Show error message below input if invalid format entered
- **Buttons**:
  - Primary: "Go to Date" (confirm selection)
  - Secondary: "Cancel" (close without navigation)
  - Layout: Horizontal row, right-aligned, 12px gap
  - Touch targets: Minimum 44x44px for mobile
- **Behavior**:
  - On open: Focus date input, pre-fill with initialDate
  - On confirm: Validate date, emit date-selected if valid, show error if invalid
  - On cancel: Emit close without validation
  - Keyboard: Enter confirms, Escape cancels

**Implementation Notes**: Use native HTML5 date input for best mobile experience, validate ISO format before emitting, focus management on open/close, accessible dialog with proper ARIA attributes.

---

### EntryDayViewCreateForm

| Field        | Detail                                 |
| ------------ | -------------------------------------- |
| Intent       | Inline form to create new record entry |
| Requirements | 1.1-1.8                                |

**Responsibilities & Constraints**

- Textarea for content input
- Default assigned day to currently viewed day (passed as prop)
- Save/Cancel buttons
- Emit event on successful creation
- File size: Under 200 lines (UI limit)

**Dependencies**

- Inbound: EntryDayViewSectionList — receives currentDate (default assigned day) (P0)
- Outbound: BaseTextarea — content input (P0)
- Outbound: BaseButton — Save/Cancel buttons (P0)
- Outbound: entry-mutations.createEntry — persist new entry (P0)
- Outbound: uuid-utils — generate ID (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
interface EntryDayViewCreateFormProps {
  /** Default assigned day (ISO string YYYY-MM-DD) */
  defaultAssignedDay: string
}

interface EntryDayViewCreateFormEmits {
  /** Emitted after successful creation */
  'item-created': (item: Entry) => void
}
```

- **Preconditions**: defaultAssignedDay is valid ISO date string
- **Postconditions**: New entry persisted to database with generated UUID and timestamps
- **Invariants**: Content cannot be empty (validation enforced)

**Visual Design** (per `.kiro/steering/visual-design.md`):

- **Container**:
  - Background: `--color-surface` (white), same styling as entry cards
  - Shadow: `--shadow-sm` (subtle elevation)
  - Border-radius: `--radius-md` (8px)
  - Padding: `--spacing-5` (20px) on desktop, `--spacing-4` (16px) on mobile
  - Position: Top of entry list (always visible, not modal)
- **Content Textarea**:
  - Font: Sans-serif (`--font-family-sans`), `--font-size-base` (16px) — UI mode, not content yet
  - Placeholder: "What happened today?" or "Capture a thought..." (calm, not pushy)
  - Placeholder color: `--color-text-muted` (low contrast, unobtrusive)
  - Rows: 3 initially, auto-expand to fit content
  - Border: None when empty/blurred, `2px solid var(--color-border-focus)` when focused
  - Background: Transparent (blends into card background)
- **Save Button**:
  - Label: "New Entry" (verb, not imperative like "Start Writing!")
  - Style: Primary button (`--color-primary` background, white text)
  - Size: `--font-size-base`, medium padding
  - Position: Below textarea with `--spacing-3` (12px) gap
  - Disabled state: If textarea is empty (button grayed out, not clickable)
- **Behavior**:
  - After save: Clear textarea, show brief success feedback (subtle), maintain form visibility
  - No "Cancel" button (clearing is non-destructive, just backspace)
  - Focus returns to textarea after successful save (ready for next entry)

**Empty State Specification** (addresses Validation Observation 3):

When no entries exist for the selected day (`entries.length === 0`):

- **Message**: "No entries yet. Start writing to capture this day's memories."
- **Styling**:
  - Font: Sans-serif, `--font-size-base`, `--color-text-secondary`
  - Padding: `--spacing-8` (32px) vertical, centered horizontally
  - No border or background (just text on page background)

**Specifications** (see `.kiro/steering/visual-design.md` for complete patterns):

- Inline form (always visible at top of list, same card styling as entries)
- Textarea: sans-serif 16px, calm placeholder ("What happened today?"), 3 rows initially
- Save button: "New Entry" label, primary style, below textarea with 12px gap
- Behavior: clear after save, focus returns to textarea
- No borders unless focused (2px teal-gray focus border)

**Empty State** (addresses Validation Observation 3):

- Message: "No entries yet. Start writing to capture this day's memories."
- Styling: Sans-serif, muted color, 32px vertical padding, centered
- Location: Below create form (form always visible above)
- Tone: Calm and neutral (no motivational language
- Outbound: vue-router useRouter, useRoute — route access (P0)
- Outbound: date-utils — date arithmetic (P0)

**Contracts**: Service ☑ State ☑

#### Service Interface

```typescript
interface UseDayNavigationReturn {
  /** Current date (ISO string YYYY-MM-DD) */
  currentDate: Ref<string>
  /** Navigate to previous day */
  goToPrevDay: () => void
  /** Navigate to next day */
  goToNextDay: () => void
  /** Navigate to specific date */
  goToDate: (date: string) => void
}

function useDayNavigation(initialDate?: string | null): UseDayNavigationReturn
```

- **Preconditions**: initialDate is valid ISO string or null (defaults to today)
- **Postconditions**: Route param updated when currentDate changes, browser history works correctly
- **Invariants**: currentDate always valid ISO string

#### State Management

- **State Model**:
  - `currentDate: Ref<string>` — ISO date string (YYYY-MM-DD)
- **Persistence**: Persisted to URL via route parameter
- **Concurrency Strategy**: Sequential (navigation actions are synchronous)

**Implementation Notes**

- **Integration**:
  - Use `router.push({ params: { date: newDate } })` to update route
  - Watch route param changes to update currentDate (handles browser back/forward)
- **Validation**:
  - Date strings validated as ISO format, fallback to today if invalid
- **Risks**:
  - Route sync could cause race conditions with rapid navigation — debounce if needed

---

### use-entry-reorder

| Field        | Detail                                                  |
| ------------ | ------------------------------------------------------- |
| Intent       | Handle entry reordering logic (move up/down within day) |
| Requirements | 4.9-4.11                                                |

**Responsibilities & Constraints**

- Provide `moveEntryUp(entryId)`, `moveEntryDown(entryId)` methods
- Calculate new order_position values when moving entries
- Handle boundary conditions (can't move up if first, can't move down if last)
- Emit refetch event after successful reorder
- File size: Under 200 lines (Composable limit)

**Dependencies**

- Outbound: entry-mutations.updateOrderPosition — persist new order (P0)

**Contracts**: Service ☑

#### Service Interface

```typescript
interface UseEntryReorderReturn {
  /** Move entry up in list (decrease order_position by swapping with previous entry) */
  moveEntryUp: (entryId: string, entries: Entry[]) => Promise<void>
  /** Move entry down in list (increase order_position by swapping with next entry) */
  moveEntryDown: (entryId: string, entries: Entry[]) => Promise<void>
  /** Check if entry can move up (not first in list) */
  canMoveUp: (entryId: string, entries: Entry[]) => boolean
  /** Check if entry can move down (not last in list) */
  canMoveDown: (entryId: string, entries: Entry[]) => boolean
}

function useEntryReorder(onRefetch: () => Promise<void>): UseEntryReorderReturn
```

- **Preconditions**: Entries list sorted by order_position ASC, entryId exists in list, onRefetch callback provided
- **Postconditions**: order_position values swapped in database, UI refetched to reflect new order
- **Invariants**: Only adjacent entries swap positions, no gaps introduced in order sequence

#### Reordering Contract

**Position Management**:

- New entries are appended to end of day's list (sequential positions starting from 0)
- Positions are day-scoped (each day has independent sequence)
- Position values may have gaps or duplicates (creation time used as tiebreaker)

**Move Up/Down Behavior**:

- **Move Up**: Swaps position with previous entry, no-op if already first
- **Move Down**: Swaps position with next entry, no-op if already last
- **Boundary Detection**: Based on array index in current list order
- **Position Swap**: Both entries updated atomically, refetch triggered for UI consistency

**Handling Edge Cases**:

- **Duplicate Positions**: Display order determined by creation time (oldest first)
- **Gaps in Sequence**: New entries append to max + 1 (gaps don't affect new positions)
- **Concurrent Reorders**: Buttons disabled during mutation to prevent race conditions

**Invariants**:

- Only adjacent entries swap positions (no arbitrary jumps)
- Position sequence remains valid after every operation
- Boundary checks prevent invalid moves

**Implementation**: See `use-entry-reorder.ts` in `/src/modules/entry-day-view/composables/`

**Implementation Notes**

- **Integration**:
  - Composable takes `onRefetch` callback as parameter (from Root component)
  - Each move operation updates two database rows (swap positions)
  - UI disables buttons during mutation to prevent race conditions
- **Validation**:
  - Boundary checks prevent invalid moves (no database errors)
  - Entry ID existence checked before mutation
- **Risks**:
  - Rapid clicking could queue multiple mutations — disable buttons during operation
  - Database transaction failure could leave positions inconsistent — rely on refetch to recover

---

_Part of journal-core-mvp design • See [design.md](design.md) for navigation_
