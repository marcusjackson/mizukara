# Known Issue: E2E Tests with vee-validate Date Inputs

**Status:** Resolved  
**Created:** 2026-02-14  
**Resolved:** 2026-02-14  
**Affects:** E2E tests for entry day reassignment

## Problem

Playwright E2E tests that interact with date inputs bound to vee-validate `useField` via `v-model` didn't trigger the necessary events for vee-validate to update its internal state. This caused the form submission to use stale values.

## Root Cause

Using `v-model` on `<input type="date">` with vee-validate's `useField` value ref didn't reliably detect value changes from Playwright's `fill()` method. While `fill()` does dispatch `input` and `change` events, the `v-model` directive's internal handling didn't always sync correctly with vee-validate's form state.

## Solution

Replaced `v-model` with explicit `:value` + `@input`/`@change` handlers that call vee-validate's `setFieldValue` API directly:

```vue
<!-- Before: v-model binding (unreliable with Playwright fill()) -->
<input v-model="assignedDayValue" type="date" />

<!-- After: Explicit event handling with setFieldValue -->
<input
  :value="assignedDayValue"
  type="date"
  @change="onDateChange"
  @input="onDateChange"
/>
```

```typescript
// Handler uses setFieldValue for guaranteed form state update
const onDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  updateAssignedDay(target.value) // calls setFieldValue('assignedDay', value)
}
```

## Files Changed

- `src/modules/entry-day-view/composables/use-entry-editor.ts` — Added `updateAssignedDay` using `setFieldValue`
- `src/modules/entry-day-view/components/EntryDayViewEntryEditor.vue` — Replaced `v-model` with explicit handlers
- `e2e/entry-day-reassignment.test.ts` — Cleaned up: removed `evaluate()` hack and `waitForTimeout()` calls

## Lesson Learned

When form libraries (like vee-validate) manage their own reactive state, prefer using their explicit APIs (`setFieldValue`) over `v-model` for inputs that need to work with E2E testing tools. This ensures programmatic value changes are properly detected by the form state management system.
