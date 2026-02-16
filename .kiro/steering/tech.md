# Technology Stack

## Architecture

**Modular, offline-first PWA** with SQLite persistence and strict component hierarchy.

This is a **personal tool, not a service**. There are no users, no accounts, no servers. All data lives locally and is fully owned by the individual using the app.

Key principles:

- Feature modules isolated by domain (journal entries, organization, settings, sync)
- Centralized API layer (repository pattern) for all database access
- Three-tier component hierarchy (Root/Section/UI) with enforced file size limits
- Base code (generic) vs Shared code (app-specific) separation
- Device sync via local WebRTC (future feature)

## Core Technologies

- **Language**: TypeScript (strict mode, no `any`)
- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Runtime**: Node.js 20+, browser-based via Vite
- **Database**: SQLite via sql.js (WebAssembly, in-browser)
- **Build**: Vite 6 with PWA plugin
- **Package Manager**: pnpm 9+ (required)

## Key Libraries

- **reka-ui** — Headless accessible components (no opinionated styling)
- **vee-validate + zod** — Form validation and schema-based type safety
- **vue-router** — Client-side routing
- **sql.js** — SQLite engine compiled to WebAssembly

## Development Standards

### Type Safety

- TypeScript strict mode enabled
- No `any` types — explicit types required
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` enforced
- Zod schemas for runtime validation

### Code Quality

- **ESLint**: TypeScript strict, Vue recommended, import sorting
- **Prettier**: Consistent formatting
- **File size limits**: Enforced via ESLint (Root: 200, Section: 250, UI: 200, Composable: 200)
- **Import order**: Vue → third-party → base → api → shared → module → types

### Responsive Design

- **Mobile-first approach**: Design for small screens, enhance for larger
- **Breakpoints**: Mobile (320-767px), Tablet (768-1023px), Desktop (1024+)
- **Touch targets**: Minimum 44x44px for comfortable mobile interaction
- **Adaptive layouts**: Use CSS media queries or container queries
- **Device testing**: Test on real mobile devices, not just browser DevTools

All UI must work seamlessly on both desktop and mobile devices. The app should be usable with mouse, keyboard, and touch input.

### Documentation Standards

**JSDoc Requirements**:

All public APIs (functions exported from modules/composables/API layer) must include comprehensive JSDoc:

- **Function description**: What it does and why
- **Parameter descriptions**: Each parameter with type and purpose
- **Return value description**: What is returned and format
- **Exceptions**: All errors that can be thrown with conditions
- **Usage example**: For complex functions or non-obvious usage

**Example**:

```typescript
/**
 * Create a new journal entry with auto-generated UUID and timestamps
 *
 * Automatically calculates the initial order_position by querying the maximum
 * position for the assigned day and incrementing by 1 (or 0 if first entry).
 *
 * @param db - SQLite database instance
 * @param input - Entry data (content and assignedDay required)
 * @returns Newly created entry with all generated fields populated
 * @throws {EntryValidationError} If content is empty or date format invalid
 * @throws {TypeError} If content is not a string
 *
 * @example
 * const entry = createEntry(db, {
 *   content: 'Had a great day',
 *   assignedDay: '2026-02-11'
 * })
 * console.log(entry.id) // '550e8400-e29b-41d4-a716-446655440000'
 */
export function createEntry(db: Database, input: CreateEntryInput): Entry {
  // ...
}
```

**Private/internal functions**: Documentation optional but encouraged for complex logic.

**Utilities and helpers**: Must have JSDoc explaining purpose, parameters, and return values.

### Accessibility

**WCAG AA compliance required** for all user-facing components:

- **Form inputs with validation**: Must use `aria-describedby` to link inputs with error messages
- **Interactive elements**: Must have visible focus indicators and keyboard accessibility
- **Screen readers**: Semantic HTML and ARIA attributes for complex interactions
- **Color contrast**: 4.5:1 minimum for text, 3:1 for large text and UI elements
- **Motion**: Respect `prefers-reduced-motion` for animations and transitions

### Testing

- **Unit**: Vitest + Testing Library (colocated `.test.ts` files)
- **E2E**: Playwright (Chromium)
- **Commands**: `pnpm test`, `pnpm test:e2e`, `pnpm ci:full`

### CSS

- Design token variables (never hardcode values)
- `--color-*`, `--spacing-*`, `--font-*` patterns
- PostCSS with preset-env

### Utility Function Usage

**Always use project utilities instead of direct API calls** to ensure consistent error handling, type safety, and testability:

- `generateUUID()` from `@/shared/utils/uuid-utils` — not `crypto.randomUUID()` directly
- Date utilities from `@/shared/utils/date-utils` — not inline `new Date()` formatting
- Database helpers from `@/shared/composables/use-database` — not direct sql.js imports

Direct API usage bypasses project-level safety checks and creates inconsistent behavior across the codebase. When in doubt, check if a utility exists before implementing inline.

## Development Environment

### Required Tools

- Node.js 20+
- pnpm 9+ (not npm/yarn)
- Modern browser with WebAssembly support

### Common Commands

```bash
pnpm dev           # Dev server
pnpm build         # Production build
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm ci:full       # All checks + tests
pnpm lint          # Lint + format check
pnpm type-check    # TypeScript validation
```

## Key Technical Decisions

**SQLite in browser via sql.js** — Enables offline-first with full relational database capabilities without server infrastructure.

**Repository pattern in API layer** — Centralizes all database access, preventing SQL scattered throughout components. Modules call repositories, never direct database queries.

**Component file size limits** — Enforces decomposition patterns (handler extraction, mode splitting) to maintain code quality as features grow.

**Base vs Shared separation** — Generic code (`base/`) can be copy-pasted to any Vue project. App-specific code (`shared/`) lives separately. This maintains reusability and clear boundaries.

**No Pinia** — Component state + composables + SQLite as source of truth. Simpler mental model for single-user, offline-first app.

**Personal tool, not service** — Design decisions prioritize individual ownership, privacy, and long-term usability over multi-user features, performance optimization, or cloud integration. This is a tool that should work decades from now without external dependencies.

---

_created: 2026-02-01_
