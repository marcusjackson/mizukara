# Requirements Document

## Project Description (Input)

Implement the foundational journaling features:

- The ability to write down notes/entries (the length doesn't matter) and save them
  - Linked to a certain day (not necessarily the created at timestamp's day)
- The ability to edit previous notes
  - Edit their contents
  - Reorder them within a day
  - Change what day they are linked to
- The ability to view previously written notes/entries with a day by day view
  - You can view one day at a time on a page, which shows a list of all the notes/entries from that day
  - And there's a way to easily switch between previous/next day etc
- Add new note/entry button can be linked by default to whatever the day you are currently viewing is when you press it
- The application should be responsive and easy to use on both PC and mobile

## Introduction

This specification defines the core MVP for the Record PWA journaling application. The focus is on establishing fundamental capture, viewing, and editing capabilities within a day-based organizational structure.

Key design constraints from the concept document:

- **Items, not entries**: No distinction between "short notes" and "long entries" — length is emergent, not a type
- **Low-friction capture**: Default input optimized for quick, small captures
- **Safe reading mode**: Viewing and reading never mutate data; editing is explicit
- **Chronology and recall**: Creation timestamp vs. assigned day context (when it's about, not when it was written)
- **Offline-first**: All functionality works without internet connection
- **Personal tool, not service**: No users, no accounts, no authentication

## Requirements

### Requirement 1: Item Creation

**Objective:** As a person using the journal, I want to create new journal items quickly with minimal friction, so that I can capture thoughts, memories, or notes without ceremony or obligation.

#### Acceptance Criteria

1. When the user initiates item creation, the Journal Creation UI shall display a text input field with focus
2. When the user enters text content (any length), the Journal Creation UI shall accept the input without imposing length restrictions or formatting requirements
3. When the user saves the item, the Journal Service shall store the item with a unique ID, creation timestamp, and the currently viewed day as the assigned day context
4. When the item is saved successfully, the Journal Service shall return the saved item with all generated fields (ID, timestamps)
5. When the item is saved successfully, the Journal List View shall display the new item in the current day's list without requiring page refresh
6. The Journal Creation UI shall assign the currently viewed day as the default day context for new items
7. The Journal Service shall generate UUID v4 for item IDs to support future sync capabilities
8. The Journal Service shall record both `created_at` (when entered) and `assigned_day` (what day it's about) timestamps separately

### Requirement 2: Item Viewing (Day-Based List)

**Objective:** As a person using the journal, I want to view all items from a specific day in a single list view, so that I can scan and read what I've captured for that day.

#### Acceptance Criteria

1. When the day view is loaded, the Journal List View shall display all items assigned to that day in reverse chronological order (newest first)
2. When displaying entries, the Journal List View shall show entry content as readable text without requiring the user to open or expand entries
3. When no items exist for the selected day, the Journal List View shall display an empty state indicating no items for that day
4. When items are displayed, the Journal List View shall show creation timestamp metadata for each item
5. The Journal List View shall support viewing any calendar day (past, present, or future)
6. When the day view is loaded, the Journal Service shall query items by `assigned_day` field, not `created_at`
7. While viewing items in read mode, the Journal List View shall prevent accidental edits or reordering through interaction

### Requirement 3: Day Navigation

**Objective:** As a person using the journal, I want to easily navigate between different days, so that I can review past entries or prepare to write about a different day.

#### Acceptance Criteria

1. When the user clicks "previous day", the Journal Day Navigator shall load the day before the currently viewed day
2. When the user clicks "next day", the Journal Day Navigator shall load the day after the currently viewed day
3. When navigating to a different day, the Journal List View shall update to show items for the newly selected day
4. When a day is selected, the Journal Day Navigator shall display the current day prominently (date format TBD in design phase)
5. The Journal Day Navigator shall default to today's date when the application first loads
6. When navigating between days, the Journal Day Navigator shall preserve the new day selection if the page is refreshed
7. The Journal Day Navigator shall provide keyboard shortcuts for previous/next day navigation (specific keys TBD in design phase)

### Requirement 4: Item Editing

**Objective:** As a person using the journal, I want to edit existing items explicitly and intentionally, so that I can correct mistakes, expand on previous thoughts, reorganize items within a day, or move items to different days without accidentally changing content while reading.

#### Acceptance Criteria

1. When the user initiates edit mode for an entry, the Journal Entry Editor shall display the entry content in an editable text field
2. While in edit mode, the Journal Entry Editor shall allow the user to modify the entry content freely
3. When the user saves changes, the Journal Service shall update the entry content and `updated_at` timestamp
4. When changes are saved successfully, the Journal List View shall display the updated content without requiring page refresh
5. When the user cancels editing, the Journal Item Editor shall discard unsaved changes and return to read mode
6. If the user attempts to navigate away with unsaved changes, the Journal Item Editor shall warn the user before discarding changes
7. When displaying an edited item, the Journal List View shall indicate that the item has been modified (via `updated_at` metadata)
8. The Journal Item Editor shall require an explicit action to enter edit mode (button click, keyboard shortcut, etc.) — viewing shall never enter edit mode unintentionally
9. When the user initiates reorder mode, the Journal List View shall allow the user to change the order of items within the currently viewed day
10. When items are reordered, the Journal Service shall update an `order_position` field (or similar mechanism) to persist the custom order
11. When items are displayed for a day with custom ordering, the Journal List View shall respect the custom order instead of default chronological sorting
12. When the user changes an item's assigned day, the Journal Item Editor shall allow selection of a different date
13. When an item's assigned day is changed, the Journal Service shall update the `assigned_day` field and `updated_at` timestamp
14. When an item is moved to a different day, the Journal List View shall remove it from the current day's list and it shall appear in the target day's list

### Requirement 5: Database Schema & Persistence

**Objective:** As a person using the journal, I want all my journal data persisted reliably in a local database, so that my entries are never lost and can support future sync capabilities.

#### Acceptance Criteria

1. When the application initializes, the Database Service shall create or open a SQLite database using sql.js (WebAssembly)
2. The Database Service shall define a `journal_items` table with UUID TEXT primary key, `content` TEXT, `created_at` INTEGER, `updated_at` INTEGER, `assigned_day` TEXT (ISO date format), `order_position` INTEGER (for custom ordering within a day), and `is_deleted` INTEGER (soft delete flag)
3. When a journal item is created, the Database Service shall insert a record with all required fields populated
4. When a journal item is updated, the Database Service shall update the record and set `updated_at` to the current timestamp
5. When querying items by day, the Database Service shall filter by `assigned_day` field using indexed queries for performance
6. The Database Service shall persist the SQLite database to IndexedDB for long-term storage between sessions
7. When the application closes and reopens, the Database Service shall restore the database from IndexedDB without data loss
8. The Database Service shall use soft deletes (`is_deleted = 1`) instead of hard deletes to support future sync (no delete functionality in this MVP, but schema prepared)

### Requirement 6: Offline-First Operation

**Objective:** As a person using the journal, I want the application to work fully offline without requiring an internet connection, so that I can journal anytime, anywhere, regardless of network availability.

#### Acceptance Criteria

1. When the application is accessed offline, the PWA Service Worker shall serve the application shell and assets from cache
2. When database operations occur offline, the Database Service shall complete all operations using the local SQLite database in browser memory
3. When the application starts, the Database Service shall load the SQLite database from IndexedDB without requiring network access
4. The Journal Application shall not make any network requests during normal operation (create, read, update, navigate)
5. When the application is installed as a PWA, the Journal Application shall function identically to online operation

### Requirement 7: Keyboard Accessibility

**Objective:** As a person using the journal, I want to perform common actions using keyboard shortcuts, so that I can journal efficiently without reaching for the mouse.

#### Acceptance Criteria

1. When the user presses a designated shortcut (TBD in design), the Journal Application shall open the item creation UI with focus on the text input
2. When viewing a day, the user shall be able to navigate to previous/next day using keyboard shortcuts (TBD in design)
3. When in edit mode, the user shall be able to save changes using a keyboard shortcut (TBD in design)
4. When in edit mode, the user shall be able to cancel editing using Escape key
5. The Journal Application shall display a keyboard shortcuts reference (accessible via a help menu or similar)
6. All interactive UI elements shall be keyboard-focusable and follow standard tab order conventions

### Requirement 8: Visual Design & Tokens

**Objective:** As a person using the journal, I want the application interface to be clean, readable, and consistent, so that the tool feels polished and pleasant to use over time.

#### Acceptance Criteria

1. When any UI component uses colors, spacing, or typography, the CSS shall reference design token variables (e.g., `--color-text-primary`, `--spacing-md`) instead of hardcoded values
2. The Journal Application shall define a complete set of design tokens for colors, spacing, typography, and other visual properties
3. When displaying journal items, the Journal List View shall use clear visual hierarchy (headings, spacing, contrast) to distinguish between items
4. When in edit mode, the Journal Item Editor shall visually distinguish editable state from read mode (e.g., border, background color)
5. The Journal Application shall use a clean, minimal design aesthetic consistent with the "personal tool" philosophy
6. When displaying text content, the Journal Application shall use readable font sizes and line heights optimized for extended reading

### Requirement 9: Responsive Design & Mobile Support

**Objective:** As a person using the journal, I want the application to work seamlessly on both desktop computers and mobile devices, so that I can capture thoughts wherever I am using whatever device I have available.

#### Acceptance Criteria

1. When the application is accessed on different screen sizes, the Journal Application shall adapt its layout responsively using CSS media queries or container queries
2. When accessed on mobile devices (viewport width < 768px), the Journal Application shall optimize touch targets to be at least 44x44px for comfortable tapping
3. When accessed on mobile devices, the Journal List View shall use mobile-appropriate spacing and layout (e.g., full-width items, larger tap areas)
4. When accessed on desktop devices (viewport width >= 768px), the Journal Application shall utilize available screen space effectively without excessive white space
5. When the user creates or edits items on mobile, the Journal Creation UI and Journal Item Editor shall work well with on-screen keyboards
6. When the user navigates between days on mobile, the Journal Day Navigator shall provide touch-friendly navigation controls
7. When the user reorders items on mobile, the Journal List View shall support touch-based drag-and-drop or alternative mobile-friendly reordering mechanism
8. The Journal Application shall test layouts at common breakpoints: mobile (320px-767px), tablet (768px-1023px), and desktop (1024px+)

### Requirement 10: Home Page Navigation

**Objective:** As a person using the journal, I want the home page to immediately take me to today's entries, so that I can start capturing thoughts without unnecessary navigation steps.

#### Acceptance Criteria

1. When the user navigates to the home page root path (/), the Journal Application shall redirect to the entry day view route (/entries) with today's date
2. When determining "today", the Journal Application shall use the user's local timezone and current system time
3. When the redirect occurs, the Journal Application shall use client-side navigation (no page reload)
4. When the home page loads, the redirect shall happen immediately without displaying intermediate content
5. The Journal Application shall handle the redirect in a way that works correctly when installed as a PWA

### Requirement 11: Direct Date Navigation

**Objective:** As a person using the journal, I want to jump directly to a specific date without clicking through multiple days, so that I can quickly access entries from dates far in the past or future.

#### Acceptance Criteria

1. When viewing the entry day view, the Journal Day Navigator shall provide a control to trigger date selection
2. When the date selection control is activated, the Journal Date Picker shall display a UI allowing direct date selection
3. When selecting a date, the Journal Date Picker shall support both manual text input (YYYY-MM-DD format) and a graphical date picker interface
4. When the user confirms a date selection, the Journal Application shall navigate to the entry day view for the selected date
5. When the date picker is displayed, the user shall be able to cancel the operation without changing the current date
6. The Journal Date Picker shall default to the currently viewed date when opened
7. The Journal Application shall provide a keyboard shortcut to open the date picker (specific key TBD in design phase)
8. When the user enters an invalid date format via text input, the Journal Date Picker shall display a validation error and prevent navigation
9. When accessed on mobile devices, the Journal Date Picker shall use the native HTML5 date input for optimal mobile experience
10. When accessed on desktop devices, the Journal Date Picker shall provide both keyboard input and a clickable calendar interface

---

_Generated: 2026-02-02_  
_Updated: 2026-02-14_  
_Phase: Requirements Updated_
