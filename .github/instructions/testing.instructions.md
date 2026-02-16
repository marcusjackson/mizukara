---
applyTo: '**/*.test.ts,**/e2e/**/*.ts'
---

# Testing Instructions

Guidelines for writing tests in this project.

## Test Stack

- **Vitest** — Unit and component tests
- **@testing-library/vue** — Component testing
- **@testing-library/user-event** — User interaction simulation
- **Playwright** — E2E and visual regression tests

## File Organization

### Colocated Tests

Place test files next to source files:

```
components/
├── EntryForm.vue
├── EntryForm.test.ts    ← Test file here
composables/
├── use-entry-repository.ts
├── use-entry-repository.test.ts
```

### E2E Tests

E2E tests in separate directory:

```
e2e/
├── tests/
│   ├── entry-crud.spec.ts
│   └── visual/
│       └── entry-list.spec.ts
└── playwright.config.ts
```

## Unit Test Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('functionName', () => {
  beforeEach(() => {
    // Setup
  })

  it('should do something when condition', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = functionName(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

## Component Test Pattern

Test from the user's perspective:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import EntryForm from './EntryForm.vue'

describe('EntryForm', () => {
  it('renders form fields', () => {
    render(EntryForm)

    expect(screen.getByLabelText(/content/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/assigned day/i)).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(EntryForm, { props: { onSubmit } })

    await user.type(screen.getByLabelText(/content/i), 'Had a great day')
    await user.type(screen.getByLabelText(/assigned day/i), '2026-02-11')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      content: 'Had a great day',
      assignedDay: '2026-02-11'
    })
  })

  it('displays validation errors', async () => {
    const user = userEvent.setup()
    render(EntryForm)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/content is required/i)).toBeInTheDocument()
  })
})
```

## Query Priority

Use Testing Library queries in this order:

1. `getByRole` — Accessible roles (button, textbox, etc.)
2. `getByLabelText` — Form inputs by label
3. `getByText` — Visible text content
4. `getByTestId` — Last resort, data-testid attribute

```typescript
// ✅ Preferred
screen.getByRole('button', { name: /save/i })
screen.getByLabelText(/content/i)

// ⚠️ Acceptable
screen.getByText(/no entries found/i)

// ❌ Avoid unless necessary
screen.getByTestId('entry-card')
```

## Async Testing

Always use `await` with user interactions:

```typescript
const user = userEvent.setup()

await user.type(input, 'text')
await user.click(button)
await user.selectOptions(select, ['option1'])
```

**Prefer `userEvent` over `fireEvent`** for realistic user interaction simulation. `userEvent` triggers full browser events including focus changes, keyboard events, and form validation, while `fireEvent` only triggers specific events.

```typescript
// ✅ Preferred - realistic user interaction
const user = userEvent.setup()
await user.type(input, 'text')
await user.click(button)

// ❌ Avoid - may not trigger all side effects
fireEvent.change(input, { target: { value: 'text' } })
fireEvent.click(button)
```

Use `waitFor` for async assertions:

```typescript
import { waitFor } from '@testing-library/vue'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

## Database Testing

Use test database helpers:

```typescript
import { createTestDatabase, seedEntry } from '@/test/helpers/database'

describe('EntryRootDetail', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabase()
    await seedEntry(db, {
      content: 'Had a great day',
      assignedDay: '2026-02-11'
    })
  })

  it('displays entry', async () => {
    render(EntryRootDetail, {
      props: { entryId: '550e8400-e29b-41d4-a716-446655440000' },
      global: {
        provide: { database: db }
      }
    })

    await waitFor(() => {
      expect(screen.getByText('Had a great day')).toBeInTheDocument()
    })
  })
})
```

## Test Data and Type Management

**Always import types from source, never duplicate:**

```typescript
// ✅ Correct - import from source
import type { Entry, CreateEntryInput } from '@/shared/types/entry-types'

// ❌ Wrong - duplicate interface in test helpers
export interface Entry { ... }
```

**When test-specific extensions are needed:**

```typescript
// Extend source types for test needs only
import type { CreateEntryInput } from '@/shared/types/entry-types'

export interface CreateEntryInputForTest extends CreateEntryInput {
  id?: string // Test-specific field for seeding with known ID
}
```

This prevents drift between source and test types. Test helpers should re-export source types for convenience rather than redefining them.

**For test-specific input with defaults:**

```typescript
// test/helpers/entries/schema.ts
import type { Entry } from '@/shared/types/entry-types'

/**
 * Test-only entry seeding data
 *
 * Allows overriding auto-generated fields for predictable test scenarios.
 * Not related to CreateEntryInput (which is for production API).
 */
export interface SeedEntryInput {
  content?: string
  assignedDay?: string
  id?: string // Test-specific override for predictable IDs
  orderPosition?: number // Test-specific override for custom ordering
  isDeleted?: boolean // Test-specific override for soft delete testing
}

// test/helpers/entries/seeders.ts
export function seedEntry(db: Database, data: SeedEntryInput = {}): Entry {
  const {
    content = 'Test content', // Provide sensible defaults
    assignedDay = '2022-01-01', // Provide sensible defaults
    id = crypto.randomUUID(),
    ...rest
  } = data

  // Minimal validation for test data quality
  if (!content.trim()) {
    throw new Error(
      `seedEntry: content cannot be empty (received: "${content}")`
    )
  }
  // ...
}
```

This allows test-specific overrides while maintaining type safety and requiring minimal input.

## Test Data Constants

Extract repeated test data to shared constants:

```typescript
// test/constants/dates.ts
export const TEST_DATES = {
  DEFAULT: '2022-01-01',
  NEXT_DAY: '2022-01-02',
  PREV_DAY: '2021-12-31'
} as const

// test/constants/entries.ts
export const TEST_ENTRIES = {
  DEFAULT_CONTENT: 'Test entry content',
  LONG_CONTENT: 'A very long test entry...'
} as const
```

**Benefits**:

- Single source of truth for test data
- Easy to update format across all tests
- Self-documenting test intent
- Reduces magic strings

**Usage in tests**:

```typescript
import { TEST_DATES } from '@test/constants/dates'

describe('entry queries', () => {
  it('finds entries by day', () => {
    seedEntry(db, { assignedDay: TEST_DATES.DEFAULT })
    const entries = findByDay(db, TEST_DATES.DEFAULT)
    expect(entries).toHaveLength(1)
  })
})
```

### E2E Test Constants

For E2E tests, centralize viewport sizes, thresholds, and other standards:

```typescript
// e2e/helpers/test-constants.ts
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 }
} as const

export const TOUCH_TARGET = {
  MINIMUM: 40, // Acceptable per Apple HIG for non-primary actions
  RECOMMENDED: 44 // Apple HIG recommendation
} as const

// Usage in E2E tests
import { VIEWPORTS } from './helpers/test-constants'

test('mobile layout', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile)
  // ...
})
```

**Benefits**:

- Single source of truth for design standards
- Easy to update when standards change (e.g., new breakpoint)
- Reduces duplication across E2E test files
- Self-documenting design requirements

## E2E Test Pattern

```typescript
// e2e/tests/entry-crud.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Entry CRUD', () => {
  test('creates a new entry', async ({ page }) => {
    await page.goto('/')
    await page.click('text=New Entry')

    await page.fill(
      'textarea[name="content"]',
      'Had a great day exploring the city'
    )
    await page.fill('input[name="assignedDay"]', '2026-02-11')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/entries\/[a-f0-9-]+/)
    await expect(page.locator('.entry-content')).toContainText(
      'Had a great day'
    )
  })
})
```

## Visual Regression Tests

```typescript
// e2e/tests/visual/entry-list.spec.ts
import { test, expect } from '@playwright/test'

test('list page matches snapshot', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('.entry-list')

  await expect(page).toHaveScreenshot('entry-list.png')
})
```

## What to Test

### Unit Tests

- Composable logic
- Repository methods
- Utility functions
- Zod schemas

### Component Tests

- User interactions
- Form submission
- Conditional rendering
- Error states

### E2E Tests

- Critical user flows
- Multi-page workflows
- Database operations

## What NOT to Test

- Implementation details
- Internal state
- Private methods
- Third-party library behavior
