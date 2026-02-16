# Implementation Plan: journal-core-mvp

**Feature**: journal-core-mvp  
**Phase**: Tasks Generated  
**Language**: en

---

## ⚠️ IMPORTANT: Incremental Implementation

**Requirements 1-9 are fully implemented.** Only Requirements 10-11 need implementation.

**→ See [addendum-req-10-11.md](addendum-req-10-11.md) for clear scope and implementation plan.**

The addendum document isolates the 6 new tasks from the 51 completed tasks, preventing confusion about what's done vs. what needs work.

---

## Task Execution Overview

This implementation is organized into themed task files for readability and maintainability:

1. **[tasks-setup.md](tasks-setup.md)** — Database setup, migrations, API foundation (Tasks 1-2)
2. **[tasks-shared.md](tasks-shared.md)** — Shared utilities, types, keyboard shortcuts (Tasks 3-4)
3. **[tasks-ui.md](tasks-ui.md)** — UI components: card, editor, navigator, date picker, form (Tasks 5-8)
4. **[tasks-composables.md](tasks-composables.md)** — Module composables: navigation, reorder (Tasks 9-10)
5. **[tasks-orchestration.md](tasks-orchestration.md)** — Section and root components, pages, routing (Tasks 11-14)
6. **[tasks-testing.md](tasks-testing.md)** — E2E tests, keyboard shortcuts, responsive validation (Tasks 15-16)

**Total Tasks**: 16 major tasks, 57 sub-tasks (updated with new requirements)

---

## Progress Tracking

### Phase 1: Foundation (Tasks 1-4)

- [ ] Database schema and API layer
- [ ] Shared utilities and types

### Phase 2: UI Components (Tasks 5-8)

- [ ] Entry card, editor, navigator, date picker, create form

### Phase 3: Module Logic (Tasks 9-10)

- [ ] Day navigation and entry reordering

### Phase 4: Integration (Tasks 11-14)

- [ ] Section components, root orchestration, pages (home + entry day), routing

### Phase 5: Testing & Polish (Tasks 15-16)

- [ ] E2E tests, keyboard shortcuts, responsive design validation
- [ ] E2E tests for home redirect and date picker

---

## Dependencies

### Prerequisites Before Starting

- Existing database infrastructure operational
- Base UI components available (BaseTextarea, BaseButton, BaseDialog)
- TypeScript strict mode configured
- Testing infrastructure ready (Vitest, Playwright)

### Task Dependencies

- Tasks 1-2 must complete before any other tasks (foundation)
- Tasks 3-4 (P) can run in parallel with each other after Tasks 1-2
- Tasks 5-8 (P) can run in parallel after Tasks 1-4 complete
- Tasks 9-10 (P) can run in parallel after Tasks 3-4 complete
- Tasks 11-14 are sequential, dependent on previous tasks
- Tasks 15-16 run after all implementation complete

---

## File Size Management

All files respect enforced limits:

- Root components: 200 lines max
- Section components: 250 lines max
- UI components: 200 lines max
- Composables: 200 lines max
- API files: 250 lines max
- Test files: 600 lines max

Components are pre-decomposed to avoid violations.

---

## Next Steps

1. **Review Tasks**: Read all task files for complete understanding
2. **Clear Context**: Before starting implementation, clear conversation history
3. **Execute**: Run `/kiro-spec-impl journal-core-mvp [task-ids]`
   - Recommended: Execute one task at a time, clear context between tasks
   - Example: `/kiro-spec-impl journal-core-mvp 1.1`, then clear and run `1.2`
4. **Validate**: Run `pnpm ci:full` after each major milestone

---

## Validation Checklist

After completing all tasks:

- [ ] All 11 requirements fully implemented (including home redirect and date picker)
- [ ] Database migration runs successfully
- [ ] All unit tests passing (`pnpm test`)
- [ ] All E2E tests passing (`pnpm test:e2e`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] File size limits respected (check ESLint report)
- [ ] Keyboard shortcuts working (Cmd+N, J/K, G for date picker, Cmd+S, Escape)
- [ ] Home page redirects to today's entries
- [ ] Date picker allows jumping to specific dates
- [ ] Responsive on mobile and desktop (test 320px, 768px, 1024px+)
- [ ] Offline functionality verified (disconnect network, test CRUD operations)

---

_Generated: 2026-02-10_  
_Updated: 2026-02-14_  
_Status: Tasks Updated (Pending Implementation)_
