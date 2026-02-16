---
applyTo: '**/e2e/**/*.ts'
---

# E2E Testing Instructions

Guidelines for End-to-End testing with Playwright following best practices.

## Core Principles

### 1. Test User-Visible Behavior

Automated tests should verify that the application works for end users. Interact with elements as users do—through visible UI, not implementation details. Avoid manual DOM manipulation via `page.evaluate()` when Playwright locators can achieve the same result—locators dispatch real browser events that Vue's reactivity system detects.

### 2. Make Tests Isolated

**Each test must run independently** with no shared state. Tests should not depend on execution order or previous test outcomes.

```typescript
// ✅ Correct - Each test is isolated
test.beforeEach(async ({ page, context }) => {
  // Clear state before each test
  await context.clearCookies()
  await page.goto('/entries', { waitUntil: 'networkidle' })

  // Wait for app to be ready using web-first assertions
  await expect(page.locator('.create-form')).toBeVisible({ timeout: 10000 })
})
```

### 3. Use Web-First Assertions

Playwright's web-first assertions automatically wait and retry until the expected state is met. This is essential for Vue apps where DOM updates happen asynchronously after reactivity triggers. **Never use `waitForTimeout()`**.

```typescript
// ✅ Correct - Auto-waits for Vue's reactive render cycle to complete
await expect(page.getByRole('button')).toBeEnabled()
await expect(page).toHaveURL(/\/entries\//)

// ❌ Wrong - Arbitrary timing, flaky tests
await page.click('button')
await page.waitForTimeout(500)
```

### 4. Avoid Testing Third-Party Dependencies

Only test what you control. Don't test external services or libraries.

### 5. Vue Reactivity Awareness

Vue updates the DOM asynchronously. When interacting with form inputs (especially those bound via `v-model` or libraries like vee-validate), use Playwright's built-in locator methods (`fill()`, `click()`, `check()`) rather than `page.evaluate()` to set values. Playwright's methods dispatch proper browser events that Vue's event listeners catch.

```typescript
// ✅ Correct - Playwright dispatches real events that Vue detects
await page.getByLabel('Content').fill('New entry content')
await page.getByLabel('Assigned Day').fill('2026-02-14')

// ❌ Wrong - Manual DOM manipulation bypasses Vue's reactivity
await page.evaluate(() => {
  document.querySelector('input').value = '2026-02-14'
})
```

**Known limitation**: If a form library intercepts events in unexpected ways, ensure the component uses explicit `@input`/`@change` handlers with the library's API (e.g., vee-validate's `setFieldValue`) rather than relying solely on `v-model`. See `docs/known-issues/` for documented cases.

## Locator Strategy

Use this priority order when selecting elements:

### Priority 1: Accessible Roles

```typescript
// ✅ Preferred - Resilient, accessible
page.getByRole('button', { name: 'Save' })
page.getByRole('textbox', { name: 'Content' })
page.getByRole('article') // for entry cards
```

### Priority 2: Label Text

```typescript
// ✅ Good for form inputs
page.getByLabel('Content')
page.getByLabel('Assigned Day')
```

### Priority 3: Test IDs

```typescript
// ✅ Acceptable for structural elements
page.getByTestId('entry-card')
page.getByTestId('entry-content')
```

### Priority 4: CSS Selectors (Last Resort)

```typescript
// ⚠️ Only when necessary - fragile to styling changes
page.locator('.entry-card')
```

**Never use:**

- XPath selectors
- Complex CSS selectors tied to DOM structure
- Selectors based on implementation details

## Database Isolation

E2E tests use a persistent IndexedDB database. Ensure isolation between tests:

```typescript
test.beforeEach(async ({ page, context }) => {
  // Clear browser state for each test
  await context.clearCookies()
  await page.goto('/entries', { waitUntil: 'networkidle' })

  // Wait for database initialization
  await expect(page.locator('.create-form')).toBeVisible({ timeout: 10000 })
})
```

**Note:** Currently tests share database state. Future improvement: Add database reset mechanism.

## Common Patterns

### Waiting for Navigation

```typescript
// ✅ Correct - Assert on URL change
await page.getByRole('button', { name: /next/i }).click()
await expect(page).toHaveURL(/\/entries\/\d{4}-\d{2}-\d{2}/)

// ❌ Wrong - Arbitrary timeout
await page.click('.next-button')
await page.waitForTimeout(500)
```

### Waiting for Elements

```typescript
// ✅ Correct - Assertion waits automatically
await page.getByLabel('Content').fill('Test')
await page.getByRole('button', { name: 'New Entry' }).click()
await expect(page.locator('.entry-card').first()).toBeVisible()

// ❌ Wrong - Manual wait function
await page.waitForFunction(() => document.querySelector('.entry-card'))
```

### Checking Element Presence

```typescript
// ✅ Correct - Direct assertion
await expect(page.getByText('No entries found')).toBeVisible()

// ❌ Wrong - Manual counting
const count = await page.locator('.entry-card').count()
if (count === 0) {
  // ...
}
```

### Keyboard Interactions

```typescript
// ✅ Correct - Test actual keyboard behavior
await page.keyboard.press('Escape')
await expect(textarea).toHaveValue('')

// ✅ For cross-platform shortcuts
await page.keyboard.press('Control+s') // Works on all platforms

// ⚠️ Note: Meta+s is Mac-specific
```

### Creating Test Entries

```typescript
// ✅ Extract to helper for consistency
async function createTestEntry(page: Page, content: string) {
  await page.getByLabel('Content').fill(content)
  await page.getByRole('button', { name: 'New Entry' }).click()
  await expect(
    page.locator('.entry-card').filter({ hasText: content })
  ).toBeVisible()
}
```

## Mobile Testing

Tests must work on both desktop and mobile viewports. Avoid hover-dependent interactions:

```typescript
// ❌ Wrong - Doesn't work on mobile
await entryCard.hover()
await editButton.click()

// ✅ Correct - Button accessible without hover
const editButton = entryCard.getByRole('button', { name: /edit/i })
await editButton.click()

// ✅ If hover is required, check viewport
const isMobile = (page.viewportSize()?.width ?? 1024) < 768
if (!isMobile) {
  await entryCard.hover()
}
await editButton.click()
```

## Anti-Patterns

### ❌ NEVER: waitForTimeout()

```typescript
// ❌ NEVER do this - flaky, slow, unreliable
await page.click('.button')
await page.waitForTimeout(500)

// ✅ Use assertions instead
await page.getByRole('button').click()
await expect(page.locator('.result')).toBeVisible()
```

### ❌ NEVER: Manual Element Counting Before Assertions

```typescript
// ❌ Wrong - Unnecessary complexity
const count = await locator.count()
if (count > 0) {
  await expect(locator).toBeVisible()
}

// ✅ Correct - Direct assertion
await expect(locator).toBeVisible()
```

### ❌ NEVER: waitForFunction() Instead of Assertions

```typescript
// ❌ Wrong - Verbose, non-idiomatic
await page.waitForFunction(() => {
  return document.querySelector('.form') !== null
})

// ✅ Correct - Let assertions handle waiting
await expect(page.locator('.form')).toBeVisible()
```

### ❌ NEVER: CSS Class Selectors Without Good Reason

```typescript
// ❌ Fragile - breaks when CSS changes
page.locator('.btn-primary.active')

// ✅ Resilient - based on user-facing attributes
page.getByRole('button', { name: 'Save', pressed: true })
```

## Test Structure

### File Organization

```
e2e/
├── entry-creation.test.ts    # Entry creation flow
├── day-navigation.test.ts    # Day navigation
├── entry-editing.test.ts     # Entry editing
└── helpers/
    ├── test-data.ts          # Shared test constants
    └── test-utils.ts         # Shared utilities
```

### Test File Pattern

```typescript
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup: Clear state, navigate, wait for ready
    await context.clearCookies()
    await page.goto('/entries', { waitUntil: 'networkidle' })
    await expect(page.locator('.create-form')).toBeVisible()
  })

  test('performs action and verifies result', async ({ page }) => {
    // Arrange: Set up test data
    const testContent = 'Test entry content'

    // Act: Perform user actions
    await page.getByLabel('Content').fill(testContent)
    await page.getByRole('button', { name: 'New Entry' }).click()

    // Assert: Verify expected outcomes
    await expect(page.locator('.entry-card').first()).toContainText(testContent)
  })
})
```

## Test Data Management

Use constants for repeated test data:

```typescript
// e2e/helpers/test-data.ts
export const TEST_CONTENT = {
  SIMPLE: 'Test entry content',
  LONG: 'A longer test entry with more detailed information',
  EDITED: 'This content has been edited'
} as const

// In tests
import { TEST_CONTENT } from './helpers/test-data'
await textarea.fill(TEST_CONTENT.SIMPLE)
```

### Date Helpers

Extract date calculations to shared utilities instead of duplicating in test files:

```typescript
// e2e/helpers/test-utils.ts
export function getRelativeDate(daysOffset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString().split('T')[0]!
}

export const getYesterdayDate = () => getRelativeDate(-1)
export const getTomorrowDate = () => getRelativeDate(1)
export const getTodayDate = () => getRelativeDate(0)

// Usage in tests
import { getYesterdayDate } from './helpers/test-utils'

test('reassigns to yesterday', async ({ page }) => {
  const yesterday = getYesterdayDate()
  await dateInput.fill(yesterday)
  // ...
})
```

### Locator Variable Usage

Use consistent patterns for storing and reusing locators:

**Guideline**: Store locator in variable if used 2+ times in same test, otherwise use direct assertion.

**✅ Good - Variable for Reuse**

```typescript
test('preserves metadata when editing', async ({ page }) => {
  const entryCard = await createEntry(page, TEST_CONTENT)
  const originalTimestamp = await entryCard
    .getByTestId('created-at')
    .textContent()

  // Reuse entryCard locator
  await startEditingEntry(entryCard, isMobileViewport(page))
  await saveEntryEdit(page)

  const newTimestamp = await entryCard.getByTestId('created-at').textContent()
  expect(newTimestamp).toBe(originalTimestamp)
})
```

**✅ Good - Direct for Single Use**

```typescript
test('entry disappears after reassignment', async ({ page }) => {
  await createEntry(page, TEST_CONTENT)
  // ...reassignment logic...

  // Single assertion - no variable needed
  await expect(
    page.getByTestId('entry-card').filter({ hasText: TEST_CONTENT })
  ).toHaveCount(0)
})
```

**❌ Avoid - Unnecessary Variable**

```typescript
test('shows empty state', async ({ page }) => {
  const emptyState = page.getByTestId('empty-state')
  await expect(emptyState).toBeVisible() // Only used once
})
```

## Debugging

### Local Debugging

```bash
# Run tests with UI mode
pnpm playwright test --ui

# Run specific test with debug
pnpm playwright test entry-creation.test.ts:42 --debug

# Run with headed browser
pnpm playwright test --headed
```

### CI Debugging

Tests on CI generate traces on failure. View with:

```bash
pnpm playwright show-report
```

## Visual Regression Testing

Visual regression tests verify visual consistency and catch unintended changes to UI appearance. They complement functional E2E tests by focusing on visual states.

### When to Use VRT

VRT is appropriate for:

- Design system consistency (CSS variables, typography)
- Responsive behavior at breakpoints
- Visual states (hover, focus, disabled, error)
- Cross-browser rendering differences
- Catching unintended side effects from CSS changes

VRT is NOT appropriate for:

- Database operations → Use unit/E2E tests
- Navigation logic → Use E2E tests
- Keyboard shortcuts → Use E2E tests
- Form validation → Use unit tests

### Core VRT Principles

**1. Prioritize Element-Level Screenshots**

```typescript
// ✅ Preferred - Isolates component changes
const navigator = page.getByTestId('day-navigator')
await expect(navigator).toHaveScreenshot('navigator-desktop.png')

// ❌ Avoid - Fails for any page change, even unrelated
await expect(page).toHaveScreenshot('full-page.png')
```

**2. Ensure Deterministic Screenshots**

```typescript
// Disable animations
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
})

// Wait for fonts
await page.evaluate(() => document.fonts.ready)

// Mask dynamic content
await expect(entryCard).toHaveScreenshot('entry-card.png', {
  mask: [entryCard.getByTestId('created-at')]
})

// Hide cursor
await page.mouse.move(0, 0)
```

**3. Use Appropriate Thresholds**

```typescript
// Components: 1% tolerance
await expect(element).toHaveScreenshot('component.png', {
  threshold: 0.01,
  maxDiffPixels: 50
})

// Page-level: 2% tolerance
await expect(page).toHaveScreenshot('page.png', {
  threshold: 0.02,
  maxDiffPixels: 500
})
```

**4. Update Baselines Carefully**

```bash
# Generate/update baselines
pnpm playwright test visual-regression.test.ts --update-snapshots

# Always review diffs first
pnpm playwright show-report
```

Only update baselines after verifying changes are intentional.

### VRT Test Organization

Place VRT tests in dedicated file:

```
e2e/
├── visual-regression.test.ts    # All VRT tests
├── responsive-mobile.test.ts    # Functional responsive tests
└── responsive-desktop.test.ts   # Functional responsive tests
```

See `.github/instructions/vrt-testing.instructions.md` for complete VRT guidelines.

## Configuration

Key settings in `playwright.config.ts`:

- `timeout: 8000` - Per-test timeout
- `workers: 1` - Serial execution (for database isolation)
- `retries: 2` - On CI only
- `trace: 'on-first-retry'` - Trace on failure

## Quick Reference Checklist

Before writing E2E tests:

- [ ] Use `getByRole()`, `getByLabel()`, or `getByTestId()` locators
- [ ] Use web-first assertions (no `waitForTimeout()`)
- [ ] Ensure test isolation in `beforeEach`
- [ ] Test works on mobile viewport
- [ ] Extract repeated patterns to helpers
- [ ] Use test data constants, not magic strings
- [ ] Follow Arrange-Act-Assert pattern

Before committing:

- [ ] All E2E tests pass: `pnpm test:e2e`
- [ ] No `waitForTimeout()` calls
- [ ] No `waitForFunction()` where assertions work
- [ ] No CSS class locators without good reason
- [ ] Mobile and desktop viewports tested
