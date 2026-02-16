# Research & Design Decisions

---

**Feature**: app-settings
**Discovery Scope**: Extension (composables and theme already exist; adding UI layer and wiring)
**Key Findings**:

- `useTheme` and `useDatabaseExport` composables already exist in `src/shared/composables/`
- `__APP_VERSION__` is already defined in Vite config and typed in `env.d.ts`
- No dedicated settings page or route exists yet; the router has a commented-out `/settings` route
- No `SharedConfirmDialog` component exists; `BaseDialog` from Reka UI is available as a foundation

## Research Log

### Existing Infrastructure Audit

- **Context**: Determine how much of the settings feature already exists in the codebase.
- **Findings**:
  - `useTheme` composable provides `theme`, `toggleTheme`, `setTheme` with localStorage persistence and system preference fallback. Storage key: `'mizukara-theme'`.
  - `useDatabaseExport` composable provides `exportDatabase`, `importDatabase`, `validateDatabaseFile`, `clearDatabase` with loading states. However, it references legacy table names (`kanjis`, `component_grouping_members`, etc.) and filename pattern (`kanji-dictionary-*.db`) from a prior project — requires adaptation.
  - `useToast` composable and `BaseToast` component are fully operational.
  - `BaseDialog` (Reka UI) exists but has no confirmation variant. A `SharedConfirmDialog` is needed.
  - `BaseSwitch` (Reka UI) exists for theme toggle.
  - `BaseButton` supports `loading`, `disabled`, `variant` props.
- **Implications**: Core composable logic exists, but `useDatabaseExport` needs significant rework for the correct table names, filename pattern, and validation logic. UI components need to be created.

### Settings UI Approach Evaluation

- **Context**: The requirements intentionally leave the settings access mechanism open. Evaluate options for this app's minimalist, calm aesthetic.
- **Findings**:
  - Current app has no global header or navigation bar — `App.vue` renders only `<RouterView />`.
  - The entry-day-view is the primary (and currently only) feature page.
  - A full settings page with its own route aligns with the existing thin-page pattern.
  - A settings icon in the entry-day-view navigation bar provides natural access without global navigation overhead.
  - A modal overlay would keep the user in context but adds complexity for database operations that may reload the app.
- **Implications**: A dedicated `/settings` route with a thin page wrapper (matching `EntryDayPage` pattern) is the most consistent approach. Access via an icon button in the day navigation section.

### Database Clear Strategy

- **Context**: The current `clearDatabase` in `useDatabaseExport` references many tables from a prior project that do not exist in this codebase.
- **Findings**:
  - This app has a single table: `entries` (from `001-create-entries.sql`).
  - Clear operation only needs: `DELETE FROM entries`.
  - After clearing, persist to IndexedDB and trigger app state refresh.
- **Implications**: `useDatabaseExport` must be updated to reference the correct table and use the correct filename pattern (`mizukara-YYYY-MM-DD-HHMM.db`).

### Database Validation Strategy

- **Context**: Import validation currently checks for a `kanjis` table (wrong project).
- **Findings**:
  - Validation should check for the `entries` table instead.
  - The migration runner handles schema evolution, so imported databases from older versions will be upgraded.
- **Implications**: Update `validateSqliteData` to check for `entries` table.

## Design Decisions

### Decision: Dedicated Settings Page (vs Modal)

- **Context**: Settings access mechanism for a minimalist journaling app.
- **Alternatives Considered**:
  1. Settings modal overlay from the day view
  2. Dedicated `/settings` route and page
  3. Settings drawer/panel embedded in the day view
- **Selected Approach**: Dedicated `/settings` route with a settings page
- **Rationale**:
  - Matches existing thin-page-wrapper pattern (`EntryDayPage`)
  - Database operations (import/clear) may trigger app reload — a separate page is safer
  - Provides room for future settings expansion without crowding the day view
  - Simpler component hierarchy than an overlay managing async database operations
- **Trade-offs**: Requires navigation away from the day view; mitigated by simple back navigation
- **Follow-up**: Include a back/return link on the settings page

### Decision: Settings Icon in Day Navigation

- **Context**: How to access settings from the main view.
- **Alternatives Considered**:
  1. Add a gear icon in the existing day navigation bar
  2. Add a hamburger menu / sidebar
  3. Add a global header with settings link
- **Selected Approach**: Gear/settings icon in the day navigation area
- **Rationale**:
  - Minimal UI footprint, consistent with calm aesthetic
  - No global navigation framework needed
  - Natural placement near existing navigation controls
- **Trade-offs**: Settings discovery may be less obvious; acceptable for a personal tool

### Decision: SharedConfirmDialog Component

- **Context**: Database import and clear require confirmation with destructive action warnings.
- **Alternatives Considered**:
  1. Inline confirmation (show/hide confirm buttons)
  2. Dedicated `SharedConfirmDialog` built on `BaseDialog`
  3. Browser `window.confirm()` dialogs
- **Selected Approach**: `SharedConfirmDialog` component extending `BaseDialog`
- **Rationale**:
  - Consistent with Reka UI patterns already in use
  - Accessible (focus trapping, keyboard navigation) out of the box
  - Reusable for future destructive actions
  - Matches calm aesthetic with styled dialogs over browser defaults
- **Trade-offs**: Additional shared component to maintain
- **Follow-up**: Include `variant: 'danger'` support for destructive styling

### Decision: Fix useDatabaseExport Composable In-Place

- **Context**: The existing composable has incorrect table and file references from a prior project.
- **Alternatives Considered**:
  1. Create a new composable from scratch
  2. Fix the existing composable in-place
- **Selected Approach**: Fix existing composable in-place
- **Rationale**:
  - Structure and pattern are correct; only domain-specific values need updating
  - Avoids orphaned composable
  - Test coverage already exists for the pattern shape
- **Trade-offs**: Must update existing tests alongside
- **Follow-up**: Update filename pattern, table references, and validation logic

## Risks & Mitigations

- **Database import corrupts app state** — Validate imported file before replacing; preserve existing DB on validation failure
- **Clear operation is irreversible** — Require explicit confirmation with destructive styling and clear warning text
- **Theme flash on load** — Theme is applied at module load time (before first render) via singleton pattern; mitigated by existing `useTheme` implementation
- **Settings discovered late by user** — Acceptable for a personal tool; the gear icon is a universally recognized pattern

---

_Created: 2026-02-15_
_Feature: app-settings_
_Status: Research complete_
