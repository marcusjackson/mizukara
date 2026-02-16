# Research & Design Decisions: journal-core-mvp

---

**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

---

## Summary

- **Feature**: `journal-core-mvp`
- **Discovery Scope**: Extension (new domain module extending existing database/UI infrastructure)
- **Key Findings**:
  - Existing database layer (sql.js + IndexedDB) fully supports journaling requirements without modification
  - Base UI components (BaseTextarea, BaseButton, BaseDialog) provide all primitives needed for journal UI
  - Repository pattern established in `/src/api/` — journal domain will follow the same pattern
  - No external dependencies required — all functionality can be implemented with existing stack
  - Browser native `crypto.randomUUID()` provides UUID v4 generation without additional libraries

## Research Log

### Database Layer Compatibility

- **Context**: Verify that existing sql.js + IndexedDB setup supports journal item persistence requirements
- **Sources Consulted**:
  - `/src/db/init.ts` — Database initialization and migration runner
  - `/src/db/indexeddb.ts` — IndexedDB persistence with debouncing
  - `/src/db/lifecycle.ts` — Browser lifecycle handlers
  - `/src/db/migrations/index.ts` — Migration framework
- **Findings**:
  - SQLite via sql.js already initialized and persisted to IndexedDB
  - Migration framework in place — ready for journal_items table creation
  - Auto-persist strategy (debounced + visibility change + beforeunload) ensures data durability
  - IndexedDB database name currently references "kanji-dictionary" (minor cosmetic issue, not blocking)
- **Implications**:
  - Database layer requires zero modifications
  - Journal domain only needs to add migration file and repository layer
  - Persistence strategy already handles Android PWA session kill scenario

### Repository Pattern Analysis

- **Context**: Determine how to structure journal data access layer following existing patterns
- **Sources Consulted**:
  - `/src/api/base-repository.ts` — Abstract repository base class
  - `/src/api/types.ts` — Generic repository types
  - Gap analysis recommendations for repository splitting
- **Findings**:
  - `BaseRepository<T>` provides helper methods for query result mapping
  - Existing pattern: `rowToObject()`, `resultToEntity()`, `resultToList()`, case conversion utilities
  - File size limits enforce splitting queries/mutations into separate files for maintainability
- **Implications**:
  - Journal repository should follow split pattern from the start:
    - `/src/api/record-items/record-item-queries.ts` — SELECT operations
    - `/src/api/record-items/record-item-mutations.ts` — INSERT/UPDATE operations
  - No need for abstract base class extension — direct function exports are cleaner for split pattern
  - Type safety achieved through explicit parameter/return types

### UI Component Inventory

- **Context**: Identify which existing base components can be reused for journal UI
- **Sources Consulted**:
  - `/src/base/components/` directory listing
  - Component test files for understanding component APIs
- **Findings**:
  - `BaseTextarea.vue` — Perfect for journal item content input (multiline, vee-validate integration)
  - `BaseButton.vue` — Primary/secondary/ghost variants for actions
  - `BaseDialog.vue` — Modal dialogs (could be used for edit mode or date picker)
  - `BaseSpinner.vue` — Loading states
  - All components support keyboard accessibility and design tokens
- **Implications**:
  - Zero new base components needed
  - Journal UI can be built entirely from existing primitives
  - Consistent UX patterns maintained

### Date Handling Strategy

- **Context**: Evaluate date library needs for day navigation and date arithmetic
- **Sources Consulted**:
  - MDN JavaScript Date API documentation
  - date-fns library documentation (not currently in project)
- **Findings**:
  - Native JavaScript Date API sufficient for:
    - ISO date string formatting (`toISOString().split('T')[0]`)
    - Date arithmetic (add/subtract days via getTime() + milliseconds)
    - Date parsing and validation
  - date-fns would add ~15KB gzipped for features already covered by native API
  - No timezone complexity (assigned_day is ISO date string, not datetime)
- **Implications**:
  - No external date library needed
  - Create `/src/shared/utils/date-utils.ts` for date formatting and arithmetic helpers
  - Keeps bundle size minimal, aligns with offline-first philosophy

### UUID Generation Approach

- **Context**: Determine UUID v4 generation strategy for item IDs
- **Sources Consulted**:
  - MDN `crypto.randomUUID()` documentation
  - Browser compatibility (Can I Use)
- **Findings**:
  - `crypto.randomUUID()` is standard Web Crypto API, supported in all modern browsers
  - Available in all target environments (Chrome, Safari, Firefox, Edge)
  - Returns RFC 4122 v4 UUID string
  - No polyfill needed for PWA target
- **Implications**:
  - No external uuid library needed
  - Simple wrapper function in `/src/shared/utils/uuid-utils.ts`
  - Eliminates dependency, reduces bundle size

### Keyboard Shortcuts Strategy

- **Context**: Determine approach for keyboard shortcuts (Requirement 7)
- **Sources Consulted**:
  - Vue event handling documentation
  - Existing codebase search for keyboard handling patterns
- **Findings**:
  - No existing keyboard shortcut system in codebase
  - Requirements specify shortcuts for:
    - New item creation (e.g., `Cmd+N`)
    - Day navigation (e.g., arrow keys, `j`/`k`)
    - Save in edit mode (e.g., `Cmd+S`)
    - Cancel edit with `Escape`
  - Vue `@keydown`/`@keyup` directives sufficient for component-level shortcuts
  - Global shortcuts need document-level listener
- **Implications**:
  - Create `/src/shared/composables/use-keyboard-shortcuts.ts` for global shortcuts
  - Component-level shortcuts handled with `@keydown` directives
  - No external library needed (keep bundle small)

### Reordering Mechanism (Mobile & Desktop)

- **Context**: Design reordering UX that works on both mobile and desktop without accidental mutations
- **Sources Consulted**:
  - Concept document emphasis on "safe reading mode"
  - Gap analysis mobile reordering discussion
  - dnd-kit, Sortable.js library documentation (external research, not needed)
- **Findings**:
  - Requirements explicitly prohibit accidental reordering during reading (Requirement 2.7)
  - Mobile drag-and-drop is fragile and gesture-prone
  - Simpler approach: Manual reorder mode with up/down buttons
  - Desktop could use drag-and-drop in explicit "reorder mode" but not required for MVP
- **Implications**:
  - **MVP approach**: Reorder buttons (up/down arrows) visible only in explicit "reorder mode"
  - Mode activation: Explicit "Reorder" button in toolbar
  - Mode indication: Visual cue (background color change, button styling)
  - No drag-and-drop library needed for MVP
  - Defer drag-and-drop to post-MVP enhancement

### Date Picker Component

- **Context**: Determine date picker strategy for day reassignment in edit mode
- **Sources Consulted**:
  - Reka UI documentation (headless component library in use)
  - HTML5 `<input type="date">` support (MDN)
- **Findings**:
  - Reka UI does not include date picker component
  - Native HTML5 `<input type="date">` has excellent mobile support
  - Consistent native UX across platforms
  - No styling conflicts (design tokens apply to container, not native picker)
- **Implications**:
  - Use HTML5 `<input type="date">` for MVP
  - Wrap in `BaseDateInput.vue` for consistent API with other base components
  - No external date picker library needed
  - Future enhancement: Custom date picker if native UX proves insufficient

## Architecture Pattern Evaluation

| Option                    | Description                                                   | Strengths                                  | Risks / Limitations                               | Notes                                       |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------- | ------------------------------------------- |
| Modular Domain (Selected) | Self-contained `/src/modules/record-*` modules with API layer | Clear boundaries, follows existing pattern | Requires multiple modules for list/day/edit views | Aligns with steering structure.md principle |
| Single Module             | All journal logic in `/src/modules/journal/`                  | Simpler file structure                     | High risk of file size violations                 | Violates file size limits, not sustainable  |
| Page-Centric              | Logic distributed across page components                      | Minimal abstraction                        | Logic duplication, testing difficulty             | Violates steering architecture principles   |

**Selected**: Modular Domain pattern with clean page/module separation

## Design Decisions

### Decision: Module Boundaries (One Module per Page)

- **Context**: User preference for clean separation: "two separate pages would generally not use the same module for all of their code"
- **Alternatives Considered**:
  1. Single `journal` module for all journal functionality
  2. Split by feature (list, edit, create) with shared types
  3. **Split by page** — each route gets own module
- **Selected Approach**: Split by page with separate modules
  - `/src/modules/record-day-view/` — Day view with list + navigation + inline creation
  - Shared types and utilities go in `/src/shared/` not module-level
- **Rationale**:
  - Aligns with user's stated preference for page-module coupling
  - Prevents circular dependencies between modules
  - Shared code (date utils, record item types) naturally belongs in `shared/`
  - Future detail view could be separate module when needed
- **Trade-offs**:
  - More initial file creation
  - Clear boundaries prevent coupling issues
- **Follow-up**: Verify during implementation that shared types don't create import confusion

### Decision: Neutral Domain Language ("Record Items" not "Journal Entries")

- **Context**: User feedback: "I'd prefer entries to be more neutral on length"
- **Alternatives Considered**:
  1. Use "journal" terminology throughout (domain-specific)
  2. Use "entry" (implies writing/diary connotation)
  3. Use "record" or "item" (neutral, length-agnostic)
- **Selected Approach**: Use "record" and "item" terminology
  - Database: `record_items` table
  - API: `/src/api/record-items/`
  - Module: `/src/modules/record-day-view/`
  - Types: `RecordItem`, `CreateRecordItemInput`
  - Route: `/records` (plural, neutral)
- **Rationale**:
  - "Record" is neutral — can be a word, a paragraph, or a page
  - Aligns with concept document: "Items may represent things that happened, thoughts, questions, feelings"
  - Avoids diary/journal connotation that implies long-form writing
  - PWA name "Record PWA" already uses this terminology
- **Trade-offs**:
  - Slightly less intuitive than "journal" for new developers
  - Requires documentation to clarify domain terminology
- **Follow-up**: Ensure terminology consistency across all documentation and code

### Decision: Database Migration Strategy

- **Context**: Need to create `record_items` table following sync-ready schema patterns
- **Alternatives Considered**:
  1. TypeORM-style migrations with up/down methods
  2. Raw SQL migration files (current project pattern)
  3. Schema-first with code generation
- **Selected Approach**: Raw SQL migration file following existing pattern
  - File: `/src/db/migrations/001-create-record-items.sql`
  - Migration runner already in place at `/src/db/migrations/index.ts`
  - Sync-ready schema: UUID PK, timestamps, soft deletes
- **Rationale**:
  - Matches existing migration pattern (consistency)
  - Simple, transparent, no abstraction overhead
  - SQL is declarative and reviewable
- **Trade-offs**:
  - No down migrations (project doesn't support rollback)
  - Manual index creation (not auto-generated)
- **Follow-up**: Validate schema supports future sync requirements during implementation

### Decision: Reordering UX (Buttons, Not Drag-and-Drop)

- **Context**: Requirement 4.9-4.11 specify reordering within a day, but concept document emphasizes "safe reading mode"
- **Alternatives Considered**:
  1. Always-on drag-and-drop (Sortable.js, dnd-kit)
  2. Drag-and-drop in explicit "reorder mode"
  3. **Up/down arrow buttons** in explicit reorder mode
- **Selected Approach**: Up/down arrow buttons in explicit reorder mode
  - "Reorder" button in toolbar activates mode
  - Up/down arrows appear next to each item in reorder mode
  - Buttons disabled when at top/bottom of list
  - "Done" or "Cancel" exits reorder mode
- **Rationale**:
  - Aligns with "safe reading mode" — no accidental mutations
  - Works identically on mobile and desktop (no touch gestures)
  - No external library needed (simpler, smaller bundle)
  - Explicit mode prevents Notion-style fragility
- **Trade-offs**:
  - Slightly slower than drag-and-drop for multi-item reordering
  - Less "modern" UX than drag-and-drop
- **Follow-up**: Post-MVP, consider adding drag-and-drop in reorder mode for desktop power users

### Decision: Component Hierarchy Strategy

- **Context**: File size limits (Root 200, Section 250, UI 200) require proactive decomposition
- **Alternatives Considered**:
  1. Start simple, refactor when hitting limits
  2. **Pre-decompose** based on responsibility patterns
- **Selected Approach**: Pre-decompose from start
  - Root: `RecordRootDayView.vue` (data fetch, state orchestration)
  - Section: `RecordSectionItemList.vue` (list layout, mode management)
  - UI: `RecordItemCard.vue`, `RecordItemEditor.vue`, `RecordDayNavigator.vue`, `RecordCreateForm.vue`
  - Composables: Split queries/mutations from start
- **Rationale**:
  - Gap analysis warns about 60+ handlers in kanji-app root components
  - Easier to decompose upfront than refactor later
  - Aligns with established project patterns
- **Trade-offs**:
  - More files initially
  - Clear structure prevents future pain
- **Follow-up**: Monitor file sizes during implementation to validate decomposition strategy

## Risks & Mitigations

- **Risk**: IndexedDB database name references "kanji-dictionary" (cosmetic issue) — **Mitigation**: Update database name in future housekeeping task, not blocking for MVP
- **Risk**: Native `<input type="date">` UX may be insufficient for power users — **Mitigation**: MVP uses native picker, defer custom picker to post-MVP if feedback warrants
- **Risk**: Manual reorder buttons feel cumbersome compared to drag-and-drop — **Mitigation**: Validate UX in testing, add drag-and-drop as enhancement if needed
- **Risk**: File size limits may still be exceeded as features grow — **Mitigation**: ESLint enforces limits, clear decomposition patterns documented in gap analysis and design
- **Risk**: Keyboard shortcuts may conflict with browser shortcuts — **Mitigation**: Use `Cmd+K` prefix for app shortcuts (industry standard), test across browsers

## References

- [MDN JavaScript Date API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) — Native date handling
- [MDN Web Crypto API - randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — UUID generation
- [MDN HTML5 input type=date](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date) — Native date picker
- [Vue Keyboard Event Handling](https://vuejs.org/guide/essentials/event-handling.html#key-modifiers) — Keyboard shortcuts
- Project steering documents:
  - `/docs/concept-design-rationale.md` — Philosophy and design constraints
  - `.kiro/steering/structure.md` — Module organization patterns
  - `.kiro/steering/database.md` — Sync-ready schema requirements
