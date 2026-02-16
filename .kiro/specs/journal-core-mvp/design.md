# Technical Design: Record Core MVP

**Feature**: journal-core-mvp  
**Phase**: Design Revision (Post-Validation)  
**Language**: en

---

## Navigation

This design is organized into multiple themed files for readability:

1. **[design.md](design.md)** (this file) — Overview, goals, architecture summary
2. **[design-architecture.md](design-architecture.md)** — Architecture patterns, technology stack, system flows
3. **[design-components.md](design-components.md)** — Component specifications, interfaces, and contracts
4. **[design-api.md](design-api.md)** — API repositories, shared utilities, and type definitions
5. **[design-data.md](design-data.md)** — Data models, database schema, migrations

**For complete context**, also see:

- **[requirements.md](requirements.md)** — Feature requirements (approved)
- **[\_reference/research.md](_reference/research.md)** — Discovery findings and decision rationale
- **[\_reference/gap-analysis.md](_reference/gap-analysis.md)** — Existing codebase analysis
- **[\_reference/validation-2026-02-09-1.md](_reference/validation-2026-02-09-1.md)** — Design validation finding some critical issues
- **[\_reference/validation-2026-02-09-2.md](_reference/validation-2026-02-09-2.md)** — Design validation finding critical issues resolved

**Visual design reference**:

- **[.kiro/steering/visual-design.md](../../steering/visual-design.md)** — Visual language, typography, color usage patterns (NEW)

---

## Recent Updates (2026-02-09)

**Visual Design Steering Created**: Added comprehensive visual design principles to project steering (`.kiro/steering/visual-design.md`) defining:

- Typography system (serif for content, sans-serif for UI)
- Color usage patterns (when to use primary, secondary, danger)
- Whitespace and spacing rhythm
- Interaction states and transitions
- Component-specific visual guidelines

**Design File Updates**:

1. **Component Visual Specifications**: Added detailed visual design sections to all UI components in `design-components.md`:
   - EntryDayViewEntryCard: Card structure, typography, metadata styling, edit button behavior
   - EntryDayViewEntryEditor: Visual distinction from read mode, textarea styling, button layout
   - EntryDayViewNavigator: Navigation bar layout, date display formatting, button styling
   - EntryDayViewCreateForm: Form container styling, empty state specification

2. **Keyboard Shortcuts Clarification** (Validation Observation 2): Updated `design-api.md` use-keyboard-shortcuts:
   - Clarified Cmd/Ctrl+S works in both create form AND edit mode (not just edit mode)
   - Specified Escape behavior differs: clear content in create form, exit edit mode in editor
   - Added context-aware behavior explanation with activeElement detection logic

3. **Empty State Specification** (Validation Observation 3): Added empty state details in `design-components.md`:
   - Message: "No entries yet. Start writing to capture this day's memories."
   - Styling: Sans-serif, muted color, centered, no decoration
   - Location: Below create form (form always visible)
   - Tone: Calm and neutral (no motivational language)

---

## Overview

This feature delivers foundational capture, viewing, and editing capabilities for the Record PWA. The implementation enables users to create entries (notes, thoughts, memories of any length), view them organized by day, navigate between days, and edit existing entries including reordering within a day and reassigning to different days.

**Users**: Individual using the PWA for personal recording and reflection will utilize this for daily capture, review, and organization workflows.

**Impact**: Introduces the first user-facing domain module to an existing codebase that currently contains only infrastructure (database layer, base UI components, routing foundation). Creates the `entries` table and establishes patterns for future entry-related features (tagging, search, LLM assistance).

### Goals

- Enable low-friction capture of entries with any content length
- Provide day-based viewing and navigation as primary organizational structure
- Support explicit, safe editing that prevents accidental mutations during reading
- Establish repository patterns and module structure for future entry domain features
- Maintain offline-first operation with all data persisted locally

### Non-Goals

- Authentication or multi-user support (personal tool philosophy)
- Cloud sync or backup (local device sync via WebRTC deferred to future)
- Tagging, categorization, or search functionality (post-MVP)
- LLM-assisted organization (post-MVP)
- Export/import functionality (deferred)
- Custom date picker UI (using native HTML5 date input for MVP)

---

## Architecture Summary

### Existing Infrastructure

The codebase contains substantial infrastructure copied from a sibling kanji dictionary app:

- **Database Layer**: SQLite via sql.js with IndexedDB persistence fully operational
- **API Layer**: `BaseRepository<T>` abstract class, repository pattern established
- **Base UI**: Full set of form primitives (BaseTextarea, BaseButton, BaseDialog)
- **Constraints**: File size limits enforced (Root 200, Section 250, UI 200), no Pinia/Vuex

### Selected Architecture Pattern

**Modular Domain with Page-Module Coupling**

- **One module per page**: `/src/modules/entry-day-view/` owns day view, navigation, list, editing
- **Shared utilities**: Date/UUID utils, keyboard shortcuts, types in `/src/shared/`
- **API layer**: Split queries/mutations in `/src/api/entries/`
- **Domain language**: "Entries" (neutral, length-agnostic) suitable for any content length

**Key Design Decisions**:

- Use browser native APIs (Date, crypto.randomUUID) — no external date/UUID libraries
- Reorder via up/down buttons (not drag-and-drop) for mobile compatibility and safety
- HTML5 `<input type="date">` for MVP date picker
- Pre-decompose components to avoid file size violations

See [design-architecture.md](design-architecture.md) for complete architecture details.

---

## Component Hierarchy

**Page Layer**:

- `EntryDayPage.vue` — Route entry point

**Module Layer** (`/src/modules/entry-day-view/`):

- **Root**: `EntryDayViewRoot.vue` — Orchestration, data fetch, keyboard shortcuts
- **Sections**:
  - `EntryDayViewSectionNavigation.vue` — Day navigation controls, date display
  - `EntryDayViewSectionList.vue` — Entry list, mode management
- **UI**: `EntryDayViewEntryCard.vue`, `EntryDayViewEntryEditor.vue`, `EntryDayViewNavigator.vue`, `EntryDayViewCreateForm.vue`
- **Composables**: `use-day-navigation.ts`, `use-entry-reorder.ts`

**API Layer** (`/src/api/entries/`):

- `entry-queries.ts` — SELECT operations (findByDay, findById)
- `entry-mutations.ts` — INSERT/UPDATE operations (create, update, reorder)

**Shared Utilities** (`/src/shared/`):

- `date-utils.ts` — Date formatting, arithmetic, validation
- `uuid-utils.ts` — UUID v4 generation
- `use-keyboard-shortcuts.ts` — Global shortcuts
- `entry-types.ts` — TypeScript interfaces

See [design-components.md](design-components.md) for detailed component specifications.

---

## Data Model Summary

**Primary Entity**: Entry

**Schema Fields**:

- `id` (UUID v4, primary key) — Unique identifier, sync-ready
- `content` (text, required) — Entry content, unlimited length
- `created_at` (timestamp) — Creation time, immutable
- `updated_at` (timestamp) — Last modification time
- `assigned_day` (ISO date) — Day context (YYYY-MM-DD)
- `order_position` (integer) — Custom ordering within day
- `is_deleted` (boolean flag) — Soft delete support

**Key Principles**:

- UUID primary keys (sync-ready)
- Timestamps in Unix milliseconds
- Soft deletes only (`is_deleted` flag)
- Snake case in database, camelCase in TypeScript

**Implementation**: See migration file at `/src/db/migrations/001-create-entries.sql`

See [design-data.md](design-data.md) for complete data model and migration details.

---

## Requirements Traceability

| Requirement | Summary                | Primary Components                                                        |
| ----------- | ---------------------- | ------------------------------------------------------------------------- |
| 1.1-1.8     | Entry creation         | EntryDayViewCreateForm, createEntry mutation                              |
| 2.1-2.7     | Day-based viewing      | EntryDayViewSectionList, EntryDayViewEntryCard, findByDay query           |
| 3.1-3.7     | Day navigation         | EntryDayViewSectionNavigation, use-day-navigation, use-keyboard-shortcuts |
| 4.1-4.14    | Entry editing          | EntryDayViewEntryEditor, updateEntry mutation, use-entry-reorder          |
| 5.1-5.8     | Database schema        | 001-create-record-items.sql migration                                     |
| 6.1-6.5     | Offline-first          | Existing PWA + database infrastructure                                    |
| 7.1-7.6     | Keyboard accessibility | use-keyboard-shortcuts, @keydown handlers                                 |
| 8.1-8.6     | Visual design          | All components use CSS variables                                          |
| 9.1-9.8     | Responsive design      | CSS media queries in all components                                       |

---

## Error Handling

### Error Categories

**User Errors**:

- Empty content → Inline error below textarea
- Invalid date → Inline error below date picker
- Navigation to invalid date → Toast notification, redirect to today

**System Errors**:

- Database initialization failure → Full-page error with retry
- Query/mutation failure → Toast notification, preserve user input
- IndexedDB persistence failure → Warning toast (data still in memory)

**Business Logic Errors**:

- Reorder on non-existent item → Toast notification, refetch list

---

## Testing Strategy

### Unit Tests

- date-utils, uuid-utils, use-day-navigation, use-item-reorder
- record-item-queries, record-item-mutations

### Integration Tests

- RecordRootDayView, RecordSectionItemList, RecordItemEditor, RecordCreateForm

### E2E Tests (Playwright)

- Day view loading, item creation, day navigation, item editing, reordering, keyboard shortcuts

---

## Migration Strategy

**7-Phase Rollout** (6-7 days estimated):

1. **Database Setup** (Day 1) — Migration file, schema validation
2. **API Layer** (Day 1-2) — Queries/mutations, unit tests
3. **Shared Utilities** (Day 2) — Date/UUID/keyboard utils
4. **UI Components** (Day 2-4) — Card, form, navigator, editor
5. **Composables & Orchestration** (Day 4-5) — use-\* composables, section, root
6. **Page & Routing** (Day 5) — Page component, route registration
7. **E2E Testing & Polish** (Day 6-7) — Playwright tests, responsive testing

**Validation Checkpoints**:

- After Phase 2: API unit tests passing
- After Phase 4: UI components rendering
- After Phase 6: Route functional end-to-end
- After Phase 7: All E2E tests passing

---

## Security & Performance

**Security**:

- Local-only data (no auth required)
- Vue template escaping prevents XSS
- Parameterized queries prevent SQL injection

**Performance Targets**:

- Day view load: < 100ms for < 50 items
- Item creation: < 50ms
- Day navigation: < 100ms

**Optimizations**:

- Database index on `assigned_day` for fast queries
- Debounced day navigation for rapid clicking
- Future: Virtualization for long item lists

---

## Next Steps

1. **Review Design**: Carefully review all design files for accuracy and completeness
2. **Optional Validation**: Run `/kiro-validate-design journal-core-mvp` for interactive quality review
3. **Approve Design**: Confirm design meets requirements and project standards
4. **Generate Tasks**: Run `/kiro-spec-tasks journal-core-mvp -y` to create implementation tasks

---

_Generated: 2026-02-02_  
_Status: Design Generated (Pending Approval)_  
_Phase: 3 of 7 (Requirements ✓ | Design ⏳ | Tasks ⏸)_
