# Commit Instructions

Guidelines for writing commit messages following Conventional Commits.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

| Type       | Description                             |
| ---------- | --------------------------------------- |
| `feat`     | New feature                             |
| `fix`      | Bug fix                                 |
| `docs`     | Documentation only                      |
| `style`    | Formatting, no code change              |
| `refactor` | Code change that neither fixes nor adds |
| `test`     | Adding or updating tests                |
| `chore`    | Tooling, dependencies, config           |
| `perf`     | Performance improvement                 |

## Scope

Optional. Indicates the area of change:

- `entries` — Entry management module
- `entry-list` — Entry list and day view
- `entry-detail` — Entry detail and editing
- `sync` — Device sync functionality
- `settings` — Settings module
- `base` — Base utilities and components
- `shared` — Shared code
- `db` — Database layer
- `ui` — UI components
- `router` — Routing
- `pwa` — PWA functionality
- `deps` — Dependencies

## Subject

- Imperative mood: "add" not "adds" or "added"
- No capitalization
- No period at end
- Max 50 characters

## Body

- Explain **what** and **why**, not how
- Wrap at 72 characters
- Separate from subject with blank line

## Footer

- Reference issues: `Closes #42` or `Refs #42`
- Breaking changes: `BREAKING CHANGE: description`

## Examples

### Simple Feature

```
feat(entries): add content length validation
```

### Feature with Body

```
feat(entries): add content length validation

Add zod schema validation for content field.
Ensures value is non-empty and under 10000 characters.

Closes #42
```

### Bug Fix

```
fix(entry-list): correct filter reset behavior

Filters were not resetting to default values when
clicking the clear button. Fixed by explicitly
setting each filter to its initial state.

Closes #57
```

### Documentation

```
docs: update architecture with component hierarchy

Add detailed explanation of Root/Section/UI pattern
with code examples for each layer.
```

### Refactor

```
refactor(entries): extract form logic to composable

Move form state and validation from EntryForm.vue
to use-entry-form.ts for better testability.
```

### Chore

```
chore(deps): update vue to 3.5.2
```

### Multiple Scopes

If change spans multiple areas, omit scope or use most relevant:

```
feat: add dark mode support
```

### Breaking Change

```
feat(db)!: change schema for entries table

BREAKING CHANGE: entries table now uses UUID
for id field instead of auto-increment integer.
Run migration 003 before updating.
```

## Commit Principles

### One Logical Change Per Commit

Each commit should represent a single, coherent change:

```
# ✅ Good - separate commits
feat(entries): add form validation
test(entries): add tests for form validation

# ❌ Bad - mixed concerns
feat(entries): add validation and fix list styling
```

### Atomic Commits

Code should work after each commit. Don't commit broken states:

```
# ✅ Good - complete feature
feat(entries): add delete confirmation dialog

# ❌ Bad - incomplete
wip: start working on delete
```

### Use Body for Context

When the subject isn't self-explanatory:

```
fix(entry-list): handle empty search results

Previously, an empty search would show a loading spinner
indefinitely. Now properly shows "No results found" state.

The issue was that the loading state wasn't being reset
when the query returned zero results.

Closes #63
```

## Issue References

Reference GitHub Issues when applicable:

- `Closes #42` — Automatically closes issue when merged
- `Fixes #42` — Same as Closes
- `Refs #42` — References without closing
- `Part of #42` — Partial work toward an issue

```
feat(entries): add status filter

Adds dropdown filter for entry statuses.
Filter state persists in URL query params.

Part of #15
```

## Pre-commit Checklist

Before committing:

- [ ] Changes compile without errors
- [ ] Tests pass
- [ ] Lint passes
- [ ] Commit message follows format
- [ ] One logical change per commit
- [ ] Issue referenced if applicable
