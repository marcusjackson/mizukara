---
applyTo: '**/*'
---

# Project Instructions

Project-wide guidelines for Mizukara.

## Project Context

**Mizukara** is a personal, offline-first PWA for journaling and recording about anything.
It is designed as a **tool for individual use**, not a service with users.

### Tech Stack

- Vue 3 (Composition API, `<script setup>`)
- TypeScript (strict mode)
- Vite + PWA
- SQLite via sql.js (browser-based)
- Reka UI (headless accessible components)
- vee-validate + zod (forms/validation)
- Vitest (unit tests) + Playwright (E2E)

### Key Directories

```
src/
├── api/               # API layer (repositories, data access)
├── modules/           # Feature modules
├── base/              # Generic primitives (works in ANY Vue project)
├── shared/            # App-specific shared code
├── pages/             # Route entry points (thin wrappers)
├── db/                # Database setup and migrations
├── styles/            # Global styles, design tokens
docs/                  # Project documentation
.github/instructions/  # Mandatory coding standards
```

### Module Organization

Modules organized by complexity:

- **Simple** (few files): `components/`, `composables/`, `schemas/`, `*-types.ts`, `index.ts`

- **Complex** (supporting files): Add `utils/` for constants/helpers.

## File Size Limits (CRITICAL)

ESLint enforces file size limits automatically. Never disable these rules for specific files—instead, address the issues by refactoring.

**When approaching limits:**

- Root → Extract to `use-*-handlers.ts`
- Section → Split into multiple sections
- Composable → Split queries/mutations

## Folder Structure

**Do NOT create subfolders** unless folder has 25+ files with clear grouping.

Modules flat by default. Exception: Add `schemas/`, `utils/` for supporting files.

## Code Organization

**Directories:**

- **`base/`**: Generic code for any Vue project.
- **`shared/`**: App-specific shared code.

**Decision:** Copy-pasteable? Yes → `base/`, No → `shared/`.

**Import Order:**

1. Vue/framework
2. Third-party
3. Base (`@/base/...`)
4. API (`@/api/...`)
5. Shared (`@/shared/...`)
6. Module (relative)
7. Types (`import type`)

## File Naming

| Type           | Pattern              |
| -------------- | -------------------- |
| Vue components | `PascalCase.vue`     |
| TypeScript     | `kebab-case.ts`      |
| Composables    | `use-[name].ts`      |
| Types          | `[module]-types.ts`  |
| Tests          | `[filename].test.ts` |

## CSS Variables

**Always** use CSS variables. **Never** hardcode values.

```css
/* ✅ Correct */
.element {
  color: var(--color-text-primary);
  padding: var(--spacing-md);
}

/* ❌ Wrong */
.element {
  color: #333;
  padding: 16px;
}
```

## Component Hierarchy

| Tier    | Purpose                   | Max Lines |
| ------- | ------------------------- | --------- |
| Root    | Data fetch, orchestration | 250       |
| Section | Layout, modes             | 250       |
| UI      | Presentation              | 225       |

## Error Handling

| Type            | Treatment                  |
| --------------- | -------------------------- |
| Form validation | Inline errors below fields |
| DB operations   | Toast notification         |
| Not found       | Empty state on page        |

## Before Starting Any Task

1. **Read mandatory instruction files** in `.github/instructions/`
2. **Ensure files you'll modify are within size limits** (ESLint will enforce this)
3. **Plan extraction** if files are approaching limits
4. **Review docs/refactor/** for decomposition patterns

## Mandatory Instruction Files

- `components.instructions.md` — Component hierarchy, extraction patterns
- `composables.instructions.md` — Repository patterns, handler extraction
- `typescript.instructions.md` — Type safety patterns
- `testing.instructions.md` — Testing requirements
- `commit.instructions.md` — Commit message standards
- `spec-writing.instructions.md` — Spec writing guidelines

## Project Documentation

- `docs/concept-design-rationale.md` — Project's concept and design rationale
- `.kiro/steering/specs.md` — Specs as living documentation philosophy
- `.github/instructions/README.md` — Instructions vs Steering distinction

## Development Commands

**Use Makefile commands** (e.g., `make lint`) instead of direct `pnpm`/`npx`. Handles filtering with pnpm.

- **Prefer incremental runs**: Use `make lint-changed` or `make test-changed` for efficiency during development. For specific files, use `make lint FILES="path/to/file.ts"`.
- **Full validation at end**: Run `make ci-full` (lint + unit + E2E tests) to ensure nothing is missed, followed by manual SonarQube analysis (via IDE tool) on changed files and address issues.
- **Efficiency tips**: Run on changed/specific files first for efficiency; full suites are for final checks. Respect file size limits (ESLint enforces them).

### Commands

```bash
make lint              # All checks (Prettier + ESLint + Stylelint + TypeScript)
make lint-fix          # Apply all fixes
make lint FILES="path/to/file.ts"  # Check specific files
make lint-changed      # Check changed files only
make test              # Unit tests
make test FILES="path/to/test.ts"  # Specific unit tests
make test-changed      # Unit tests for changed files
make test-e2e          # E2E tests
make test-e2e FILES="path/to/test.ts"  # Specific E2E tests
make ci                # Lint + unit tests
make ci-full           # Lint + unit + E2E tests
make type-check        # TypeScript type checking only
```

## Testing Requirements

### Before Marking Any Task Complete

1. **Run checks** — `make lint` (or `make lint-changed` for efficiency)
2. **If tests were affected** — Run `make test-changed`
3. **All must pass** — Zero lint/type errors and test failures
4. **Run SonarQube analysis** — Analyze touched files for security issues using SonarLint extension if available

**At session end**: Run `make ci-full` for full validation.

Use `sonarqube_analyze_file` tool for security analysis on specific files if SonarLint extension is installed.

## Common Patterns

### Handler Extraction (Root too large)

Extract handlers to `use-*-handlers.ts` composable.

### Section Splitting (Section too large)

Split into multiple sections.

### Repository Splitting (Composable too large)

Split into queries/mutations files.

## Common Mistakes to Avoid

1. **File exceeds limit** — ESLint will report violations; never disable this rule for a file; instead, refactor to reduce code complexity
2. **Missing handler extraction** — Root with 60+ handlers needs splitting
3. **Monolithic sections** — Sections with view/edit/grouping modes need splitting
4. **No field-level updates** — Repositories need individual field update methods
5. **Arbitrary waits in E2E** — Use `waitFor` state, not `waitForTimeout`

## Code Quality Checklist

- [ ] File under size limit for its type
- [ ] TypeScript strict — no `any`, explicit types
- [ ] CSS uses design token variables
- [ ] Components follow Root/Section/UI hierarchy
- [ ] Handlers extracted if Root approaches limit
- [ ] Modes split if Section approaches limit
- [ ] Tests colocated with source files
- [ ] Loading and error states handled
- [ ] Keyboard accessible
- [ ] No console.log statements
- [ ] Unit tests pass (`make test`)
- [ ] E2E tests pass (`make test:e2e`)
- [ ] No lint errors (`make lint`)
- [ ] No type errors (`make type-check`)

## Before Submitting Code

- [ ] File under size limit for its type
- [ ] TypeScript strict — no `any`
- [ ] CSS uses design tokens
- [ ] Components follow hierarchy
- [ ] Tests colocated
- [ ] Loading/error states handled
- [ ] Keyboard accessible
- [ ] No console.log

## Commit Messages

Follow Conventional Commits:

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore, perf
Scopes: module names, base, shared, db
```

## Package Manager

**pnpm only** — Do not use `npm` or `yarn`.
