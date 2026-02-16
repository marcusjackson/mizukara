# Implementation Gap Analysis: journal-core-mvp

**Specification:** journal-core-mvp  
**Language:** en  
**Generated:** 2026-02-02  
**Status:** Point-in-time reference (not maintained)

---

## Executive Summary

This analysis examines the implementation gap for the journal-core-mvp feature. The codebase contains substantial infrastructure copied from a sibling kanji dictionary app, including:

- ✅ **Database layer**: SQLite via sql.js with IndexedDB persistence
- ✅ **Base UI components**: Form inputs, buttons, textarea components
- ✅ **Repository pattern**: BaseRepository abstract class for data access
- ✅ **Router foundation**: vue-router configured with basic routes
- ✅ **Design tokens**: Comprehensive CSS variable system
- ✅ **PWA setup**: Service worker, offline support configured

**Key Gaps:**

- ❌ No journal-specific database schema or migrations
- ❌ No journal modules (components, composables, API repositories)
- ❌ No UUID utility (crypto.randomUUID() available in browsers)
- ❌ No day navigation logic or date handling utilities
- ❌ No drag-and-drop or reordering mechanisms

**Recommended Approach:** Hybrid (Option C) — Create new journal module while extending existing database/API infrastructure.

**Estimated Effort:** M-L (5-10 days)  
**Risk Level:** Low-Medium

---

## 1. Current State Investigation

### 1.1 Existing Assets

#### Database Layer (`src/db/`)

**Files:**

- `init.ts` — Database initialization, sql.js loading, migration runner
- `indexeddb.ts` — IndexedDB persistence with debounced auto-save
- `lifecycle.ts` — Browser lifecycle listeners for persistence
- `migrations/index.ts` — Migration runner (currently empty, ready for migrations)

**Status:** ✅ **Functional and ready to use**

The database layer is well-structured with:

- SQLite via sql.js (WebAssembly)
- IndexedDB persistence with debouncing
- Lifecycle management (beforeunload, visibilitychange)
- Migration framework in place

**Potential Issues:**

- IndexedDB names reference "kanji-dictionary" (should update to "record-pwa")
- No migrations defined yet — needs journal_items table creation

#### API Layer (`src/api/`)

**Files:**

- `base-repository.ts` — Abstract repository base class with CRUD helpers
- `types.ts` — Generic repository types
- `persistence.ts` — Persistence helpers
- `vocabulary.ts` — Stub vocabulary types (kanji-app legacy, can ignore)

**Status:** ✅ **Ready to extend with journal repositories**

The `BaseRepository` provides:

- `resultToEntity()`, `resultToList()` — Query result mapping
- `rowToObject()` — Column-to-object conversion
- `camelToSnake()`, `snakeToCamel()` — Case conversion utilities

**Pattern Example:**

```typescript
export class JournalRepository extends BaseRepository<JournalItem> {
  protected tableName = 'journal_items'
  protected mapRow(row: Record<string, unknown>): JournalItem {
    /* ... */
  }
}
```

#### Base UI Components (`src/base/components/`)

**Available:**

- `BaseButton.vue` — Primary/secondary/ghost/danger variants
- `BaseInput.vue` — Text input with label, error states
- `BaseTextarea.vue` — Multi-line text input (perfect for journal content)
- `BaseDialog.vue` — Modal dialog (for edit mode, day picker)
- `BaseSpinner.vue` — Loading indicator

**Status:** ✅ **Directly usable for journal UI**

All components:

- Follow design token system
- Support vee-validate integration
- Have keyboard accessibility
- Include colocated tests

#### Router (`src/router/`)

**Files:**

- `routes.ts` — Route path constants with `buildRoute()` helper
- `index.ts` — Vue Router configuration

**Current routes:**

```typescript
{
  HOME: '/',
  RECORD_LIST: '/records',
  RECORD_DETAIL: '/records/:id',
  SETTINGS: '/settings',
  COMING_SOON: '/coming-soon'
}
```

**Status:** ⚠️ **Routes exist but not yet wired to components**

The route structure aligns well with requirements:

- `/records` → Day list view
- Could be `/records/:date` → Specific day view
- `/records/:id` → Individual item detail (optional for MVP)

#### Design Tokens (`src/styles/tokens.css`)

**Status:** ✅ **Comprehensive token system ready**

Includes:

- Colors (background, text, primary, semantic, borders)
- Typography (font families, sizes, weights, line heights)
- Spacing (0-32 scale)
- Shadows, transitions, borders, radii, z-index

No hardcoded values needed — all design requirements can use tokens.

#### Shared Composables (`src/shared/composables/`)

**Available:**

- `use-database.ts` — Database singleton with `exec()`, `run()`, `persist()`
- `use-toast.ts` — Toast notifications (good for save confirmations, errors)
- `use-theme.ts` — Theme management

**Status:** ✅ **Core infrastructure composables ready**

### 1.2 Architecture Patterns

**Repository Pattern:**

- All database access flows through `src/api/` layer
- Components never write SQL directly
- Repositories extend `BaseRepository<T>`

**Component Hierarchy:**

- Root (200 lines max) — Data fetching, orchestration
- Section (250 lines max) — Layout, mode management
- UI (200 lines max) — Presentation only

**Module Organization:**

```
modules/journal-list/
├── components/        # Vue components
├── composables/       # use-*.ts
├── schemas/           # Zod validation
├── utils/             # Helpers
├── journal-list-types.ts
└── index.ts
```

**Import Order:**

1. Vue/framework
2. Third-party
3. Base (`@/base`)
4. API (`@/api`)
5. Shared (`@/shared`)
6. Module (relative)
7. Types

### 1.3 Testing Infrastructure

**Unit Tests:** Vitest + Testing Library (colocated `.test.ts` files)  
**E2E Tests:** Playwright (Chromium)  
**Commands:** `pnpm test`, `pnpm test:e2e`, `pnpm ci:full`

**Test Helpers:**

- `test/helpers/database.ts` — Database test utilities
- `test/helpers/render.ts` — Component test rendering
- `test/helpers/with-setup.ts` — Composable testing

**Status:** ✅ **Testing framework ready, patterns established**

---

## 2. Requirements Feasibility Analysis

### 2.1 Technical Needs by Requirement

#### Requirement 1: Item Creation

**Needs:**

- Journal item data model (TypeScript type)
- Database table: `journal_items` (UUID PK, content, timestamps, assigned_day, order_position)
- Repository: `createJournalItem()`, `generateUUID()`
- Composable: `use-journal-mutations.ts` with create logic
- Component: Journal creation form (textarea + save/cancel buttons)
- Route: `/records` or `/records/:date` with creation UI

**Gaps:**

- ❌ No UUID generation utility
- ❌ No journal_items table migration
- ❌ No journal repository
- ❌ No journal module/components

**Unknowns:**

- Should creation be inline (in list view) or modal dialog?
- Should date picker be visible during creation or default to current view day?

#### Requirement 2: Item Viewing (Day-Based List)

**Needs:**

- Repository: `findByDay(date: string): JournalItem[]`
- Composable: `use-journal-queries.ts` with day query
- Component: List view with item cards, empty state
- Date handling: Parse/format ISO dates

**Gaps:**

- ❌ No date formatting utilities
- ❌ No list view component
- ❌ No empty state component

**Unknowns:**

- How to display metadata (timestamp format)?
- Should items be clickable or inline-expandable?

#### Requirement 3: Day Navigation

**Needs:**

- Date arithmetic (add/subtract days)
- URL state management (`/records/:date` route param)
- Navigation UI (prev/next buttons, date display)
- Keyboard shortcuts (arrow keys or j/k)

**Gaps:**

- ❌ No date utilities
- ❌ No navigation component
- ❌ No keyboard shortcut system

**Research Needed:**

- Date library? (date-fns, dayjs) vs. native Date API
- Keyboard shortcut library or custom implementation?

#### Requirement 4: Item Editing

**Needs:**

- Edit mode state management
- Repository: `updateJournalItem()`, `updateField()`
- Composable: `use-journal-mutations.ts` with update logic
- Component: Inline editor or modal form
- Unsaved changes warning (beforeunload event)
- Reordering: Drag-and-drop or up/down buttons
- Day reassignment: Date picker in edit mode

**Gaps:**

- ❌ No edit mode component
- ❌ No reordering mechanism
- ❌ No date picker component
- ❌ No unsaved changes detection

**Research Needed:**

- Drag-and-drop library for reordering? (dnd-kit, Sortable.js)
- Mobile-friendly reordering UX (drag on desktop, buttons on mobile?)
- Date picker: Build custom or use Reka UI date components?

#### Requirement 5: Database Schema & Persistence

**Needs:**

- Migration file: `001-create-journal-items.sql`
- Schema:
  ```sql
  CREATE TABLE journal_items (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    assigned_day TEXT NOT NULL,
    order_position INTEGER,
    is_deleted INTEGER DEFAULT 0
  );
  CREATE INDEX idx_journal_assigned_day ON journal_items(assigned_day);
  ```

**Gaps:**

- ❌ No migration file created

**Status:** ✅ Migration framework exists, just needs SQL file

#### Requirement 6: Offline-First Operation

**Status:** ✅ **Already implemented**

- PWA service worker configured
- Database operations fully offline (SQLite in memory + IndexedDB)
- No network requests in normal operation

**No gaps** — existing infrastructure satisfies this requirement.

#### Requirement 7: Keyboard Accessibility

**Needs:**

- Keyboard event listeners
- Shortcut registry/documentation
- Focus management in edit mode
- Tab order in UI components

**Gaps:**

- ❌ No keyboard shortcut system
- ❌ No help/reference for shortcuts

**Unknowns:**

- Shortcut keys: `Cmd+N` for new? `Cmd+S` for save? Arrow keys for navigation?
- Conflicts with browser shortcuts?

#### Requirement 8: Visual Design & Tokens

**Status:** ✅ **Design token system complete**

All requirements satisfied by existing `tokens.css`:

- CSS variables for all visual properties
- No hardcoded values needed

**No gaps** — existing infrastructure satisfies this requirement.

#### Requirement 9: Responsive Design & Mobile Support

**Needs:**

- Mobile-optimized layouts (CSS media queries)
- Touch-friendly tap targets (44x44px minimum)
- Mobile reordering mechanism (alternative to desktop drag-and-drop)
- Responsive navigation controls

**Gaps:**

- ❌ No responsive layout patterns established yet
- ❌ No mobile-specific components

**Unknowns:**

- Breakpoints: 320-767px (mobile), 768-1023px (tablet), 1024+ (desktop)?
- Reordering on mobile: Drag-and-drop or up/down buttons?

### 2.2 Constraints from Existing Architecture

1. **File Size Limits (ESLint enforced):**
   - Root: 200 lines max
   - Section: 250 lines max
   - UI: 200 lines max
   - Composable: 200 lines max
   - Repository: 250 lines max

   **Implication:** Must decompose early. Split queries/mutations, extract handlers, separate view/edit modes.

2. **No Pinia/Vuex:**
   - State management via composables + SQLite as source of truth
   - Reactive state in components, not global store

   **Implication:** Day selection state lives in route params or URL query.

3. **Repository Pattern:**
   - All SQL in `src/api/` layer
   - Components call repositories via composables

   **Implication:** Clear separation — journal module doesn't touch database directly.

4. **Base vs Shared:**
   - Generic code (`base/`) must work in any Vue project
   - App-specific code (`shared/`) can reference journal concepts

   **Implication:** Date utilities, keyboard shortcuts likely go in `shared/`.

5. **Colocated Tests:**
   - Every `.ts`/`.vue` file needs `.test.ts` alongside
   - No separate `__tests__` directories

   **Implication:** Testing is mandatory and visible.

---

## 3. Implementation Approach Options

### Option A: Extend Existing Components ❌ (Not Applicable)

**Rationale:** Journal functionality is entirely new domain. No existing components to extend. This option doesn't apply.

---

### Option B: Create New Module (Pure Greenfield) ✅

**When to use:** Start from scratch with new journal module.

**Structure:**

```
src/modules/journal/
├── components/
│   ├── JournalRootDayView.vue          # Root: Day view orchestrator
│   ├── JournalSectionItemList.vue      # Section: List layout
│   ├── JournalItemCard.vue             # UI: Single item display
│   ├── JournalItemEditor.vue           # UI: Edit form
│   ├── JournalDayNavigator.vue         # UI: Prev/next day controls
│   └── JournalCreateForm.vue           # UI: New item form
├── composables/
│   ├── use-journal-queries.ts          # Read operations
│   ├── use-journal-mutations.ts        # Write operations
│   ├── use-day-navigation.ts           # Date state/navigation
│   └── use-journal-reorder.ts          # Reorder logic
├── schemas/
│   └── journal-item-schema.ts          # Zod validation
├── utils/
│   ├── date-utils.ts                   # Date formatting, arithmetic
│   └── uuid-utils.ts                   # UUID generation
├── journal-types.ts                    # TypeScript types
└── index.ts                            # Public exports

src/api/journal/
├── journal-queries.ts                  # SELECT operations
├── journal-mutations.ts                # INSERT/UPDATE operations
└── journal-types.ts                    # Repository types

src/pages/
└── JournalDayPage.vue                  # Route entry point

src/db/migrations/
└── 001-create-journal-items.sql        # Schema migration
```

**Integration Points:**

- Use `useDatabase()` from `@/shared/composables/use-database`
- Use base components: `BaseTextarea`, `BaseButton`, `BaseDialog`
- Use design tokens from `tokens.css`
- Register routes in `src/router/routes.ts`

**Responsibility Boundaries:**

- **Journal module:** Journal-specific logic, UI, state
- **API layer:** Database access, repository pattern
- **Shared composables:** Database connection, toasts
- **Base components:** Generic UI primitives

**Trade-offs:**

- ✅ Clean separation of concerns
- ✅ Easy to test in isolation
- ✅ Clear ownership of journal domain
- ❌ More files to create (~15-20 new files)
- ❌ Requires careful interface design with existing infrastructure

**Complexity:** Medium — New module, but clear patterns to follow.

---

### Option C: Hybrid Approach (Recommended) ✅

**When to use:** Create new journal module while extending database/API infrastructure.

**Strategy:**

**Phase 1: Foundation (Days 1-2)**

1. Create database migration (`001-create-journal-items.sql`)
2. Create API layer (`src/api/journal/`)
   - `journal-queries.ts` — SELECT operations
   - `journal-mutations.ts` — INSERT/UPDATE operations
3. Create journal types (`src/modules/journal/journal-types.ts`)
4. Create date utilities (`src/shared/utils/date-utils.ts`)
5. Run migration, test API layer

**Phase 2: Core Viewing & Creation (Days 3-5)**

1. Create journal module structure
2. Build day view components:
   - `JournalRootDayView.vue` — Orchestrates day view
   - `JournalSectionItemList.vue` — List layout
   - `JournalItemCard.vue` — Single item display
   - `JournalDayNavigator.vue` — Prev/next controls
   - `JournalCreateForm.vue` — New item form
3. Build composables:
   - `use-journal-queries.ts` — Read operations
   - `use-journal-mutations.ts` — Create/update operations
   - `use-day-navigation.ts` — Date state
4. Wire up route (`/records/:date`)
5. Test: Create items, view by day, navigate days

**Phase 3: Editing & Reordering (Days 6-8)**

1. Build edit mode:
   - `JournalItemEditor.vue` — Edit form component
   - Unsaved changes warning
2. Implement reordering:
   - `use-journal-reorder.ts` — Reorder logic
   - Drag-and-drop or button-based reordering
   - Research needed: Drag library selection
3. Implement day reassignment:
   - Date picker in edit mode (research: Reka UI date components)
4. Test: Edit content, reorder items, change assigned day

**Phase 4: Polish & Responsive (Days 9-10)**

1. Responsive layouts (mobile/tablet/desktop)
2. Keyboard shortcuts (Cmd+N, arrow keys, Escape)
3. Empty states, loading states
4. E2E tests (Playwright)
5. Performance optimization (query indexing)

**Integration with Existing:**

- ✅ Extend database layer (add migration)
- ✅ Extend API layer (new journal repositories)
- ✅ Use base components (BaseTextarea, BaseButton, BaseDialog)
- ✅ Use shared composables (useDatabase, useToast)
- ✅ Follow existing patterns (repository, component hierarchy, file sizes)

**Trade-offs:**

- ✅ Balanced approach — new module + infrastructure extension
- ✅ Incremental delivery — each phase is usable
- ✅ Allows iteration — can refine based on Phase 2 learnings
- ❌ Requires phased planning and discipline
- ❌ Risk of scope creep if not careful

**Risk Mitigation:**

- Start with Phase 1-2 for MVP (viewing + creation)
- Phase 3-4 can be separate iterations if needed
- Use feature flags if deploying incrementally

**Complexity:** Medium-High — Requires coordination across layers, but clear milestones.

---

## 4. Implementation Complexity & Risk

### 4.1 Effort Estimation

**Overall: M-L (5-10 days)**

Breakdown:

- Foundation (DB, API, types): **S (1-2 days)**
- Core viewing + creation: **M (3-4 days)**
- Editing + reordering: **M (3-4 days)**
- Polish + responsive: **S (1-2 days)**

**Rationale:**

- Database layer exists — just needs migration
- Base components ready — minimal UI building
- Repository pattern clear — straightforward API implementation
- Module patterns established — follow existing conventions
- Reordering adds complexity (research + implementation)
- Responsive design adds testing time

**Assumptions:**

- Developer familiar with Vue 3 Composition API
- No major infrastructure changes needed
- Reordering library integration is straightforward
- Date utilities can use native Date API (no library)

### 4.2 Risk Assessment

**Overall Risk: Low-Medium**

#### High Risk Areas:

**1. Reordering Mechanism (Medium Risk)**

- **Challenge:** Touch-friendly drag-and-drop on mobile
- **Unknowns:** Library selection (dnd-kit, Sortable.js, vue-draggable-next)
- **Mitigation:** Research phase, fallback to button-based reordering

**2. Date Picker Integration (Medium Risk)**

- **Challenge:** Reka UI date components may not exist or may be incomplete
- **Unknowns:** Need to research Reka UI date support
- **Mitigation:** Build custom date picker or use third-party library (react-datepicker has Vue port)

#### Medium Risk Areas:

**3. Keyboard Shortcuts (Low-Medium Risk)**

- **Challenge:** Preventing conflicts with browser shortcuts
- **Unknowns:** Cross-browser compatibility
- **Mitigation:** Use standard shortcuts (Cmd+N, Escape), test thoroughly

**4. Mobile Responsiveness (Low-Medium Risk)**

- **Challenge:** Ensuring usable UX on small screens
- **Unknowns:** Reordering UX on mobile
- **Mitigation:** Test on real devices, fallback to buttons if drag fails

#### Low Risk Areas:

**5. Database Schema (Low Risk)**

- **Challenge:** Minimal — migration framework exists
- **Mitigation:** Follow existing kanji-app patterns

**6. Repository Pattern (Low Risk)**

- **Challenge:** Minimal — BaseRepository provides structure
- **Mitigation:** Follow existing patterns, extend BaseRepository

**7. Base Components (Low Risk)**

- **Challenge:** Minimal — components ready and tested
- **Mitigation:** Use as-is, minimal customization needed

### 4.3 Technical Debt Considerations

**Inherited from Kanji App:**

1. IndexedDB database name is "kanji-dictionary" — should rename to "record-pwa"
2. Some stub types in `api/vocabulary.ts` can be removed
3. Base URL handling references "/jisaku/" (kanji app path) — should update

**New Debt Risks:**

1. Reordering implementation may need refactoring if drag library proves suboptimal
2. Date utilities may grow complex — consider date library later
3. File size limits may force premature decomposition

**Mitigation:**

- Address IndexedDB naming in Phase 1
- Remove vocabulary stubs during cleanup
- Monitor file sizes throughout development
- Document technical decisions (ADR style)

---

## 5. Research Items for Design Phase

These items require deeper investigation before finalizing design:

### 5.1 Reordering Mechanism

**Research Questions:**

- Which drag-and-drop library works best with Vue 3 Composition API?
  - `@vueuse/integrations` + Sortable.js?
  - `vue-draggable-next`?
  - `dnd-kit` (React, but has Vue port)?
- How to handle touch-based reordering on mobile?
  - Fallback to up/down buttons?
  - Use native touch events?
- How to persist order in database?
  - `order_position` field (fractional indices)?
  - Separate `item_order` table?

**Recommendation:** Prototype 2-3 libraries, evaluate mobile experience.

### 5.2 Date Picker

**Research Questions:**

- Does Reka UI have date picker components?
  - Check documentation and examples
- If not, build custom or use third-party?
  - `vue3-datepicker`?
  - `v-calendar`?
  - Custom implementation with native `<input type="date">`?

**Recommendation:** Check Reka UI first, fallback to native input for MVP.

### 5.3 Keyboard Shortcuts

**Research Questions:**

- Library or custom implementation?
  - `@vueuse/core` composables (useKeyPress)?
  - `hotkeys-js`?
  - Custom event listeners?
- Which shortcuts to use?
  - Cmd+N (new item) — conflicts with browser new window?
  - Cmd+K (quick actions) — common pattern?
  - Arrow keys (navigate days) — safe?
- How to display shortcuts reference?
  - Tooltip on hover?
  - Help modal?

**Recommendation:** Start with VueUse `useKeyPress`, standard shortcuts.

### 5.4 Date Utilities

**Research Questions:**

- Native Date API sufficient?
  - Add/subtract days
  - Format ISO dates (YYYY-MM-DD)
  - Display formats (locale-aware)
- Or use library?
  - `date-fns` (tree-shakable)
  - `dayjs` (lightweight)
  - `luxon` (feature-rich)

**Recommendation:** Start with native Date API, add library if complexity grows.

### 5.5 Responsive Breakpoints

**Research Questions:**

- Standardize breakpoints across app?
  - Mobile: 320-767px
  - Tablet: 768-1023px
  - Desktop: 1024+
- Document in steering or design tokens?

**Recommendation:** Define in `tokens.css` as CSS custom properties.

---

## 6. Recommendations for Design Phase

### 6.1 Preferred Approach

**Hybrid (Option C)** — Create new journal module while extending database/API infrastructure.

**Rationale:**

- Clear separation of concerns (module, API, database)
- Leverages existing infrastructure (database, base components, design tokens)
- Incremental delivery (usable after each phase)
- Low risk (follows established patterns)

### 6.2 Key Design Decisions Needed

1. **Reordering UX:**
   - Desktop: Drag-and-drop vs. button-based
   - Mobile: Touch-drag vs. buttons vs. hybrid
   - Decide after research phase

2. **Date Picker:**
   - Reka UI components vs. custom vs. third-party
   - Decide after checking Reka UI documentation

3. **Keyboard Shortcuts:**
   - Specific key bindings (Cmd+N, arrow keys, etc.)
   - Conflicts with browser shortcuts
   - Decide after prototyping

4. **Creation UI:**
   - Inline (in list view) vs. modal dialog
   - Recommendation: Inline for low friction

5. **Edit Mode:**
   - Inline vs. modal
   - Recommendation: Inline for continuity

6. **URL Structure:**
   - `/records` (defaults to today) vs. `/records/:date` (explicit date)
   - Recommendation: `/records/:date` with `:date` optional (defaults to today)

### 6.3 Phase 1 Focus: MVP (Days 1-5)

**Deliverables:**

- Database migration + API layer
- Day view with item list
- Item creation (inline form)
- Day navigation (prev/next)

**Defer to Phase 2:**

- Content editing
- Reordering
- Day reassignment
- Keyboard shortcuts
- Responsive polish

**Rationale:** Focus on core loop (create → view → navigate) first. Editing and reordering can follow once foundation is solid.

---

## 7. Appendix: File Inventory

### 7.1 Existing Files (Reusable)

**Database:**

- `src/db/init.ts` (127 lines)
- `src/db/indexeddb.ts` (205 lines)
- `src/db/lifecycle.ts` (80 lines)
- `src/db/migrations/index.ts` (41 lines)

**API:**

- `src/api/base-repository.ts` (150 lines)
- `src/api/types.ts` (50 lines)

**Composables:**

- `src/shared/composables/use-database.ts` (150 lines)
- `src/shared/composables/use-toast.ts` (100 lines)

**Base Components:**

- `src/base/components/BaseButton.vue` (196 lines)
- `src/base/components/BaseInput.vue` (146 lines)
- `src/base/components/BaseTextarea.vue` (144 lines)
- `src/base/components/BaseDialog.vue` (200 lines)
- `src/base/components/BaseSpinner.vue` (100 lines)

**Router:**

- `src/router/routes.ts` (35 lines)
- `src/router/index.ts` (60 lines)

**Styles:**

- `src/styles/tokens.css` (284 lines)
- `src/styles/base.css` (158 lines)

**Total Reusable LOC:** ~2,000 lines

### 7.2 Files to Create (New)

**Database:**

- `src/db/migrations/001-create-journal-items.sql` (~30 lines)

**API:**

- `src/api/journal/journal-queries.ts` (~150 lines)
- `src/api/journal/journal-mutations.ts` (~150 lines)
- `src/api/journal/journal-types.ts` (~50 lines)

**Journal Module:**

- `src/modules/journal/journal-types.ts` (~100 lines)
- `src/modules/journal/index.ts` (~20 lines)
- `src/modules/journal/components/JournalRootDayView.vue` (~180 lines)
- `src/modules/journal/components/JournalSectionItemList.vue` (~200 lines)
- `src/modules/journal/components/JournalItemCard.vue` (~150 lines)
- `src/modules/journal/components/JournalItemEditor.vue` (~180 lines)
- `src/modules/journal/components/JournalDayNavigator.vue` (~120 lines)
- `src/modules/journal/components/JournalCreateForm.vue` (~150 lines)
- `src/modules/journal/composables/use-journal-queries.ts` (~180 lines)
- `src/modules/journal/composables/use-journal-mutations.ts` (~180 lines)
- `src/modules/journal/composables/use-day-navigation.ts` (~150 lines)
- `src/modules/journal/composables/use-journal-reorder.ts` (~150 lines)
- `src/modules/journal/schemas/journal-item-schema.ts` (~80 lines)
- `src/modules/journal/utils/date-utils.ts` (~100 lines)
- `src/modules/journal/utils/uuid-utils.ts` (~20 lines)

**Pages:**

- `src/pages/JournalDayPage.vue` (~80 lines)

**Tests:** (~15 test files, ~2,000 lines)

**Total New LOC:** ~4,000-5,000 lines (including tests)

---

## 8. Conclusion

**Summary:**

- Existing infrastructure provides strong foundation (~50% of work done)
- Journal module needs to be built from scratch (~50% new work)
- Hybrid approach (Option C) recommended — create module, extend infrastructure
- Estimated effort: **M-L (5-10 days)** with **Low-Medium risk**
- Research needed: Reordering library, date picker, keyboard shortcuts

**Next Steps:**

1. Review this gap analysis with stakeholders
2. Proceed to design phase: `/kiro-spec-design journal-core-mvp`
3. Address research items during design
4. Create technical design with component specs, API contracts, database schema

---

_Generated: 2026-02-02_  
_Status: Point-in-time reference (not maintained alongside spec)_
