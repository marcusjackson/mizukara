# Addendum: Requirements 10 & 11 Implementation

**Feature**: journal-core-mvp  
**Added**: 2026-02-14  
**Status**: Ready for Implementation  
**Scope**: Home page redirect and direct date navigation

---

## Purpose

This addendum isolates the implementation work for **Requirements 10 and 11** from the already-completed Requirements 1-9. The core MVP (requirements 1-9) is **fully implemented and tested**. This document defines only the incremental work needed for the two new requirements.

---

## Context: What's Already Done

### ✅ Completed (Requirements 1-9)

The following are **fully implemented, tested, and working**:

- **Database & API Layer** (Tasks 1-2)
  - `journal_items` table with all fields
  - Entry queries (findById, findByDay, findAll)
  - Entry mutations (create, update, updateOrderPosition, updateAssignedDay)
  - Repository pattern with clean contracts

- **Shared Utilities** (Tasks 3-4)
  - Entry types and interfaces
  - Date utilities (parseDate, formatDate, formatDateLong, addDays)
  - Keyboard shortcuts infrastructure

- **UI Components** (Tasks 5-8)
  - EntryDayViewEntryCard (read mode)
  - EntryDayViewEntryEditor (edit mode)
  - EntryDayViewNavigator (prev/next buttons, date display)
  - EntryDayViewCreateForm (new entry creation)

- **Module Composables** (Tasks 9-10)
  - useDayNavigation (date state, route sync, navigation)
  - useEntryReorder (move up/down logic)

- **Orchestration** (Tasks 11-14, partial)
  - EntryDayViewSectionNavigation
  - EntryDayViewSectionList
  - EntryDayViewRoot (orchestration, keyboard shortcuts for Cmd+N, J/K, Cmd+S, Escape)
  - EntryDayPage
  - Route `/entries/:date?` (likely already configured)

- **E2E Tests** (Tasks 15.1-15.6, 16.1-16.5)
  - Entry creation, editing, reordering, day reassignment flows
  - Day navigation, offline functionality
  - Keyboard shortcuts (Cmd+N, J/K, Cmd+S, Escape)
  - Responsive design (mobile/desktop)
  - Visual regression testing (existing components)

---

## Scope: What's New (Requirements 10 & 11)

### 📋 Summary of New Work

**6 implementation tasks** + **VRT updates**:

1. Create EntryDayViewDatePicker component (new)
2. Create HomePage component (new)
3. Modify EntryDayViewNavigator (add date picker trigger button)
4. Modify EntryDayViewRoot (add date picker state management + `G` shortcut)
5. Add home route `/` to router configuration (new)
6. E2E test: Home redirect (new)
7. E2E test: Date picker navigation (new)
8. Update VRT for date picker component (new)

---

## New Work Breakdown

### Task A: Create EntryDayViewDatePicker Component

**Location**: `/src/modules/entry-day-view/components/EntryDayViewDatePicker.vue`

**Corresponds to**: Task 7.5.1 from tasks-ui.md

**Requirements**: 11.1-11.10

**Implementation Checklist**:

- [ ] Create modal dialog using BaseDialog
- [ ] Accept props: `open` (boolean), `initialDate` (ISO string YYYY-MM-DD)
- [ ] Title: "Jump to Date"
- [ ] HTML5 date input (native picker on mobile)
- [ ] Label: "Select date" with format hint "(YYYY-MM-DD)"
- [ ] Pre-fill input with initialDate on open
- [ ] Focus date input when dialog opens
- [ ] Validate ISO format (YYYY-MM-DD) before emitting
- [ ] Show validation error below input if invalid
- [ ] Primary button: "Go to Date" (confirm)
- [ ] Secondary button: "Cancel" (close)
- [ ] Button layout: horizontal, right-aligned, 12px gap, 44x44px touch targets
- [ ] Emit `date-selected` with valid ISO date on confirm
- [ ] Emit `close` on cancel
- [ ] Keyboard: Enter confirms, Escape cancels
- [ ] Max-width 400px desktop, full-width padding mobile
- [ ] Padding: 24px (`--spacing-6`)
- [ ] Use CSS variables for all styling
- [ ] Proper ARIA attributes for accessibility
- [ ] File size: Under 200 lines (UI component limit)

**Design Reference**: [design-components.md](design-components.md#L440-L520)

**Unit Tests** (Task 7.5.2):

- [ ] Create `/src/modules/entry-day-view/components/EntryDayViewDatePicker.test.ts`
- [ ] Test dialog opens when open prop is true
- [ ] Test input pre-filled with initialDate
- [ ] Test date-selected event emits valid ISO date on confirm
- [ ] Test close event emits on cancel
- [ ] Test validation error shows for invalid date format
- [ ] Test validation prevents invalid date submission
- [ ] Test Enter key confirms, Escape key cancels
- [ ] Test focus management (input focused on open)
- [ ] Test visual styling uses CSS variables
- [ ] Test responsive behavior (desktop vs mobile)

---

### Task B: Modify EntryDayViewNavigator Component

**Location**: `/src/modules/entry-day-view/components/EntryDayViewNavigator.vue` (existing file)

**Corresponds to**: Updates to Task 7.1 from tasks-ui.md

**Requirements**: 11.1

**Changes Needed**:

- [ ] Make entire date display interactive (clickable button)
- [ ] Add calendar icon or dropdown indicator (▼) next to date text
- [ ] Emit `open-date-picker` event when date display clicked
- [ ] Ensure button has proper keyboard focus styling
- [ ] Maintain existing prev/next day functionality (no changes)
- [ ] Update existing styling to accommodate interactive date

**Implementation Notes**:

- Keep existing date formatting (formatDateLong)
- Keep existing responsive behavior
- Keep file under 200 lines

**Unit Tests Updates** (Task 7.2):

- [ ] Update `/src/modules/entry-day-view/components/EntryDayViewNavigator.test.ts`
- [ ] Add test: Date display emits open-date-picker event when clicked
- [ ] Add test: Keyboard accessibility for date picker trigger
- [ ] Ensure existing tests still pass

---

### Task C: Modify EntryDayViewRoot Component

**Location**: `/src/modules/entry-day-view/components/EntryDayViewRoot.vue` (existing file)

**Corresponds to**: Updates to Task 13.1 from tasks-orchestration.md

**Requirements**: 11.1, 11.4, 11.7

**Changes Needed**:

- [ ] Add date picker state: `datePickerOpen: Ref<boolean>` (default false)
- [ ] Add `G` keyboard shortcut to open date picker (only when no input focused)
- [ ] Handle `open-date-picker` event from EntryDayViewNavigator
- [ ] Handle `date-selected` event from EntryDayViewDatePicker
- [ ] Handle `close` event from EntryDayViewDatePicker
- [ ] Navigate to selected date when date-selected fires
- [ ] Render EntryDayViewDatePicker component with appropriate props
- [ ] Update Escape key handler to close date picker if open (context-aware)
- [ ] Maintain existing keyboard shortcuts (no changes to Cmd+N, J/K, Cmd+S)
- [ ] Keep file under 200 lines (extract handlers if needed)

**Implementation Notes**:

- Date picker should close after successful date selection
- Date picker should receive currentDate as initialDate
- Existing orchestration logic remains unchanged

**Unit Tests Updates** (Task 13.2):

- [ ] Update `/src/modules/entry-day-view/components/EntryDayViewRoot.test.ts`
- [ ] Add test: `G` key opens date picker
- [ ] Add test: Date picker open state managed correctly
- [ ] Add test: Date selection navigates to correct date
- [ ] Add test: Date picker closes on cancel
- [ ] Add test: Escape closes date picker when open
- [ ] Ensure existing tests still pass

---

### Task D: Create HomePage Component

**Location**: `/src/pages/HomePage.vue`

**Corresponds to**: Task 14.5 from tasks-orchestration.md

**Requirements**: 10.1-10.5

**Implementation Checklist**:

- [ ] Create page component with immediate redirect logic
- [ ] Use `useRouter` from vue-router for programmatic navigation
- [ ] Use `getToday()` from date-utils to get current date in user's timezone
- [ ] Redirect to `/entries` (no date parameter)
- [ ] Use `router.replace()` (not push) to avoid history entry
- [ ] Trigger redirect in `onMounted` lifecycle hook
- [ ] No UI rendering (pure redirect logic)
- [ ] Validate `getToday()` returns valid ISO date string
- [ ] File size: Under 100 lines (Page limit)

**Design Reference**: [design-components.md](design-components.md#L36-L68)

**Unit Tests** (Task 14.6):

- [ ] Create `/src/pages/HomePage.test.ts`
- [ ] Test page redirects on mount
- [ ] Test redirect uses router.replace (not push)
- [ ] Test redirect path is `/entries`
- [ ] Test getToday() called to determine current date

---

### Task E: Add Home Route Configuration

**Location**: `/src/router/routes.ts` (existing file)

**Corresponds to**: New route for Task 14.5

**Requirements**: 10.1, 10.5

**Changes Needed**:

- [ ] **Verify** route `/entries/:date?` already exists (should be present)
- [ ] **Add** route `/` (home page)
  - Path: `/`
  - Component: HomePage
  - Name: `home`
- [ ] Ensure route order is correct (home before entries)

**Implementation Notes**:

- Do NOT re-implement `/entries/:date?` route (already exists)
- Only add the new `/` home route

---

### Task F: E2E Test - Home Redirect

**Location**: `/e2e/home-redirect.test.ts` (new file)

**Corresponds to**: Task 15.7 from tasks-testing.md

**Requirements**: 10.1-10.5

**Test Cases**:

- [ ] Navigate to home page root path `/`
- [ ] Verify immediate redirect to `/entries`
- [ ] Verify no intermediate content visible
- [ ] Verify entry day view loads correctly
- [ ] Verify current date displays today's date
- [ ] Verify redirect uses client-side navigation (no page reload)
- [ ] Test works when installed as PWA (if PWA install tested)

---

### Task G: E2E Test - Date Picker Navigation

**Location**: `/e2e/date-picker.test.ts` (new file)

**Corresponds to**: Task 15.8 from tasks-testing.md

**Requirements**: 11.1-11.10

**Test Cases**:

- [ ] Navigate to entry day view (today)
- [ ] Click date picker trigger button
- [ ] Verify date picker dialog opens
- [ ] Verify date input pre-filled with current date
- [ ] Enter future date (e.g., 2026-03-01)
- [ ] Click "Go to Date" button
- [ ] Verify dialog closes
- [ ] Verify page navigates to entered date
- [ ] Verify entries for that date load
- [ ] Open date picker again, click Cancel
- [ ] Verify dialog closes without navigation
- [ ] Open date picker using keyboard shortcut (`G` key)
- [ ] Verify dialog opens
- [ ] Enter invalid date format
- [ ] Verify validation error displays
- [ ] Verify cannot submit invalid date
- [ ] Press Escape key
- [ ] Verify dialog closes
- [ ] Test on mobile viewport (native date input)

---

### Task H: Update Visual Regression Testing

**Location**: `/e2e/visual-regression.test.ts` (existing file)

**Corresponds to**: Update to Task 16.5 from tasks-testing.md

**Requirements**: 11.1-11.10 (visual appearance)

**VRT Updates Needed**:

- [ ] Add element-level screenshot: Date picker dialog (normal state)
- [ ] Add element-level screenshot: Date picker with validation error
- [ ] Add element-level screenshot: Date picker focus state
- [ ] Test date picker at mobile breakpoint (375x667)
- [ ] Test date picker at desktop breakpoint (1280x800)
- [ ] Mask dynamic content (initialDate value if needed)
- [ ] Use threshold 0.01 (1%) for component-level screenshots

**Implementation Notes**:

- Follow existing VRT patterns in visual-regression.test.ts
- Disable animations via `page.addStyleTag()`
- Wait for fonts: `page.evaluate(() => document.fonts.ready)`
- Hide cursor: `page.mouse.move(0, 0)`
- Generate baselines: `pnpm test:e2e visual-regression.test.ts --update-snapshots`
- Follow guidelines in `.github/instructions/vrt-testing.instructions.md`

**VRT Cases for Date Picker**:

```typescript
test('date picker dialog - desktop', async ({ page }) => {
  // Navigate to entries, open date picker
  await page.goto('/entries')
  await page.getByRole('button', { name: /jump to date/i }).click()

  // Wait for dialog
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible' })

  // Screenshot
  await expect(dialog).toHaveScreenshot('date-picker-desktop.png', {
    threshold: 0.01
  })
})

test('date picker validation error - desktop', async ({ page }) => {
  // Navigate, open picker, enter invalid date
  await page.goto('/entries')
  await page.getByRole('button', { name: /jump to date/i }).click()

  const dialog = page.getByRole('dialog')
  const input = dialog.getByLabel(/select date/i)
  await input.fill('invalid-date')
  await dialog.getByRole('button', { name: /go to date/i }).click()

  // Wait for error message
  await dialog.getByText(/invalid/i).waitFor({ state: 'visible' })

  // Screenshot
  await expect(dialog).toHaveScreenshot('date-picker-error-desktop.png', {
    threshold: 0.01
  })
})

test('date picker dialog - mobile', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 })

  // Navigate, open picker
  await page.goto('/entries')
  await page.getByRole('button', { name: /jump to date/i }).click()

  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible' })

  // Screenshot
  await expect(dialog).toHaveScreenshot('date-picker-mobile.png', {
    threshold: 0.01
  })
})
```

---

### Task I: Update Keyboard Shortcuts E2E Test

**Location**: `/e2e/keyboard-shortcuts.test.ts` (existing file)

**Corresponds to**: Updates to Task 16.1 from tasks-testing.md

**Requirements**: 11.7

**Changes Needed**:

- [ ] Add test case: Press `G` key to open date picker
- [ ] Verify date picker dialog opens
- [ ] Add test case: Press `G` key when input focused (should NOT open picker)
- [ ] Verify `G` respects input focus context
- [ ] Ensure existing keyboard shortcut tests still pass

**Implementation Notes**:

- Follow existing test patterns in keyboard-shortcuts.test.ts
- Test `G` key both with and without input focus

---

## Implementation Order

**Recommended sequence**:

1. **Task A**: Create EntryDayViewDatePicker component + tests (new, no dependencies)
2. **Task B**: Modify EntryDayViewNavigator + update tests (depends on understanding picker contract)
3. **Task C**: Modify EntryDayViewRoot + update tests (depends on A and B)
4. **Task D**: Create HomePage component + tests (independent)
5. **Task E**: Add home route `/` (depends on D)
6. **Task F**: E2E test - Home redirect (depends on D, E)
7. **Task G**: E2E test - Date picker navigation (depends on A, B, C)
8. **Task I**: Update keyboard shortcuts test for `G` key (depends on C)
9. **Task H**: Update VRT for date picker (depends on A, best done last)

---

## Validation Checklist

After completing all tasks:

- [ ] All new unit tests passing
- [ ] All existing unit tests still passing (no regressions)
- [ ] All new E2E tests passing (home redirect, date picker)
- [ ] All existing E2E tests still passing (no regressions)
- [ ] No TypeScript errors (`make type-check`)
- [ ] No ESLint errors (`make lint`)
- [ ] File size limits respected for modified files
- [ ] VRT baselines generated and committed
- [ ] Keyboard shortcut `G` works correctly
- [ ] Date picker accessible via both click and keyboard
- [ ] Home page redirects immediately to today's entries
- [ ] Date picker validation works (invalid dates rejected)
- [ ] Native date picker appears on mobile devices
- [ ] All components use CSS variables (no hardcoded values)

---

## Files to Create (New)

1. `/src/modules/entry-day-view/components/EntryDayViewDatePicker.vue`
2. `/src/modules/entry-day-view/components/EntryDayViewDatePicker.test.ts`
3. `/src/pages/HomePage.vue`
4. `/src/pages/HomePage.test.ts`
5. `/e2e/home-redirect.test.ts`
6. `/e2e/date-picker.test.ts`

---

## Files to Modify (Existing)

1. `/src/modules/entry-day-view/components/EntryDayViewNavigator.vue`
2. `/src/modules/entry-day-view/components/EntryDayViewNavigator.test.ts`
3. `/src/modules/entry-day-view/components/EntryDayViewRoot.vue`
4. `/src/modules/entry-day-view/components/EntryDayViewRoot.test.ts`
5. `/src/router/routes.ts` (add home route only)
6. `/e2e/keyboard-shortcuts.test.ts` (add `G` key test)
7. `/e2e/visual-regression.test.ts` (add date picker VRT)

---

## Design Reference Files

- [requirements.md](requirements.md#L146-L200) - Requirements 10 & 11
- [design-components.md](design-components.md#L36-L68) - HomePage spec
- [design-components.md](design-components.md#L440-L520) - DatePicker spec
- [tasks-ui.md](tasks-ui.md#L113-L156) - Task 7.5 (date picker)
- [tasks-orchestration.md](tasks-orchestration.md#L146-L171) - Tasks 14.5-14.6 (home page)
- [tasks-testing.md](tasks-testing.md#L100-L135) - Tasks 15.7-15.8 (E2E tests)

---

_Generated: 2026-02-14_  
_Status: Ready for Implementation_
