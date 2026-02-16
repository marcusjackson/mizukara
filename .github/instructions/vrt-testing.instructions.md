---
applyTo: '**/e2e/visual-regression.test.ts'
---

# Visual Regression Testing Instructions

Guidelines for Visual Regression Testing (VRT) with Playwright to catch unintended visual changes.

## Purpose and Scope

VRT complements unit and E2E tests by catching visual regressions that functional tests miss:

- **Design system consistency** - CSS variables applied correctly
- **Responsive behavior** - Component appearance at breakpoints
- **Visual states** - Hover, focus, disabled, error states
- **Cross-browser rendering** - Subtle engine differences
- **Unintended side effects** - CSS changes affecting unrelated components

**What VRT does NOT test** (covered by other tests):

- Database operations (unit/E2E)
- Keyboard shortcuts (E2E)
- Navigation logic (E2E)
- Form validation (unit)
- User interactions beyond visual states (E2E)

## Core Principles

### 1. Prefer Element-Level Screenshots

**Element-level** (`locator.toHaveScreenshot()`) is the default approach.

```typescript
// ✅ Preferred - Isolates component visual state
const navigator = page.getByTestId('day-navigator')
await expect(navigator).toHaveScreenshot('navigator-today.png')

// ❌ Avoid - Fails for any page change, even unrelated
await expect(page).toHaveScreenshot('full-page.png')
```

**Why element-level?**

- Isolates changes to specific components
- Prevents unrelated changes from failing tests
- Faster debugging (small diff images)
- Reduced maintenance (fewer baseline updates)

### 2. Use Page-Level Selectively

**Only** for verifying overall layout integrity:

- Critical landing pages at key breakpoints
- Layout relationships between components
- Global positioning issues

```typescript
// ✅ Acceptable - Layout verification at breakpoints
await page.setViewportSize({ width: 320, height: 568 })
await expect(page).toHaveScreenshot('mobile-layout.png', { fullPage: true })
```

### 3. Ensure Deterministic Screenshots

False positives destroy VRT value. Eliminate flakiness:

**Disable animations:**

```typescript
test.use({
  // Disable animations globally
  actionTimeout: 0,
  navigationTimeout: 0
})

// Or disable CSS animations
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `
})
```

**Mask dynamic content:**

```typescript
// ✅ Correct - Hide timestamps that change every run
await expect(entryCard).toHaveScreenshot('entry-card.png', {
  mask: [entryCard.getByTestId('created-at')]
})
```

**Wait for stability:**

```typescript
// ✅ Correct - Wait for fonts and styles to load
await page.goto('/entries', { waitUntil: 'networkidle' })
await page.waitForLoadState('domcontentloaded')
await page.evaluate(() => document.fonts.ready)

// Then capture screenshot
await expect(page.locator('.entry-card')).toHaveScreenshot()
```

**Hide cursor:**

```typescript
// ✅ Correct - Prevent cursor in screenshots
await page.mouse.move(0, 0)
```

### 4. Standardize Environment

**Use consistent viewport sizes:**

```typescript
// Define standard breakpoints
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 }
}

test('component appears correctly on mobile', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile)
  // ...
})
```

**Use Docker for CI** (if needed):

- Run tests in Playwright Docker container
- Ensures CI environment matches baseline creation environment
- Prevents font rendering differences across OS

**Fixed browser versions:**

- Update Playwright regularly to keep browsers in sync
- Commit baseline snapshots to version control
- Use Git LFS for large snapshot repositories (optional)

## Test Strategy

### Element-Level Tests (Primary)

Test individual components with distinct visual states:

```typescript
test.describe('EntryDayViewNavigator', () => {
  test('renders correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/entries/2026-02-14')

    const navigator = page.getByTestId('day-navigator')
    await expect(navigator).toHaveScreenshot('navigator-desktop.png')
  })

  test('renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/entries/2026-02-14')

    const navigator = page.getByTestId('day-navigator')
    await expect(navigator).toHaveScreenshot('navigator-mobile.png')
  })
})
```

**Component states to test:**

- **EntryDayViewNavigator**: Desktop/mobile layouts
- **EntryDayViewEntryCard**: Normal, with edited indicator
- **EntryDayViewCreateForm**: Empty, filled, disabled button, error state
- **EntryDayViewEntryEditor**: Editing state
- **Empty state**: No entries message

### Page-Level Tests (Selective)

Only for layout verification:

```typescript
test('day view layout at mobile breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/entries/2026-02-14')

  // Wait for stability
  await expect(page.locator('.create-form')).toBeVisible()

  // Mask any dynamic content
  await expect(page).toHaveScreenshot('day-view-mobile-layout.png', {
    fullPage: true,
    mask: [page.locator('[data-testid="created-at"]')]
  })
})
```

Test at key breakpoints: 375px (mobile), 768px (tablet), 1280px (desktop)

### Visual State Testing

Test hover, focus, disabled states:

```typescript
test('entry card hover state (desktop)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/entries/2026-02-14')

  const entryCard = page.locator('.entry-card').first()

  // Trigger hover
  await entryCard.hover()

  // Capture with edit button visible
  await expect(entryCard).toHaveScreenshot('entry-card-hover.png')
})

test('button focus state', async ({ page }) => {
  await page.goto('/entries/2026-02-14')

  const saveButton = page.getByRole('button', { name: /new entry/i })

  // Focus button
  await saveButton.focus()

  await expect(saveButton).toHaveScreenshot('button-focus.png')
})
```

## Threshold and Tolerance

Define acceptable pixel differences:

```typescript
// ✅ Small tolerance for anti-aliasing differences
await expect(element).toHaveScreenshot('component.png', {
  maxDiffPixels: 100, // Allow up to 100 pixels to differ
  threshold: 0.01 // 1% tolerance for subtle rendering differences
})

// ✅ Stricter for critical UI elements
await expect(button).toHaveScreenshot('cta-button.png', {
  threshold: 0.001 // 0.1% tolerance
})
```

**Guidelines:**

- **Critical UI** (buttons, forms): `threshold: 0.001` (0.1%)
- **Content areas** (cards, text): `threshold: 0.01` (1%)
- **Full page**: `maxDiffPixels: 500`, `threshold: 0.02` (2%)

## Baseline Management

### Creating Baselines

```bash
# Generate baseline snapshots (first run)
npx playwright test visual-regression.test.ts --update-snapshots

# Or via Makefile
make test-e2e FILES="e2e/visual-regression.test.ts" UPDATE=1
```

### Updating Baselines

**When to update:**

- Intentional design changes (CSS, layout modifications)
- Updating component library or design tokens
- Fixing visual bugs (after verifying fix is correct)

**When NOT to update:**

- Test failures due to unintended regressions
- CI failures without local verification
- "Just to make tests pass" without understanding cause

**Process:**

1. Run tests locally: `pnpm test:e2e visual-regression.test.ts`
2. Review HTML report: `npx playwright show-report`
3. Inspect "Expected", "Actual", "Diff" images
4. If change is intentional: `pnpm test:e2e visual-regression.test.ts --update-snapshots`
5. Commit updated baselines to version control

### Snapshot Storage

```
e2e/
  visual-regression.test.ts
  visual-regression.test.ts-snapshots/
    chromium/
      navigator-desktop.png
      navigator-mobile.png
    firefox/
      navigator-desktop.png
    webkit/
      navigator-desktop.png
```

- Commit snapshots to Git
- Use Git LFS for large repositories (optional)
- Store per-browser engine (Chromium, Firefox, WebKit)

## CI/CD Integration

### Recommended Workflow

```yaml
# .github/workflows/test.yml
- name: Run visual regression tests
  run: pnpm test:e2e visual-regression.test.ts

- name: Upload diff artifacts on failure
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

**On failure:**

1. CI uploads HTML report as artifact
2. Developer downloads report from CI
3. Reviews "Expected", "Actual", "Diff" images
4. Determines if change is intentional or bug
5. Updates baselines if intentional, fixes code if bug

### Docker for CI

Use official Playwright Docker image for consistency:

```yaml
- name: Run tests in Docker
  run: |
    docker run --rm -v $(pwd):/work -w /work \
      mcr.microsoft.com/playwright:latest \
      pnpm test:e2e visual-regression.test.ts
```

## Debugging Visual Failures

### Local Debugging

```bash
# Run with UI mode to see screenshots side-by-side
npx playwright test visual-regression.test.ts --ui

# Run with headed browser to watch rendering
npx playwright test visual-regression.test.ts --headed

# Generate HTML report with visual diffs
npx playwright show-report
```

### HTML Report Review

After test failure:

1. Open `playwright-report/index.html`
2. Click failed test
3. View "Expected", "Actual", "Diff" images
4. Identify changed pixels (highlighted in diff)
5. Determine if change is intentional

### Common Failure Causes

| Cause                      | Solution                                                  |
| -------------------------- | --------------------------------------------------------- |
| Animations not disabled    | Add `page.addStyleTag()` to disable CSS animations        |
| Fonts not loaded           | Wait for `document.fonts.ready`                           |
| Dynamic timestamps         | Use `mask` option to hide dynamic content                 |
| Inconsistent viewport      | Set explicit viewport size with `page.setViewportSize()`  |
| OS rendering differences   | Run baselines and CI in same environment (Docker)         |
| Browser version mismatch   | Update Playwright, regenerate baselines                   |
| Network-dependent content  | Mock API responses or use `waitUntil: 'networkidle'`      |
| Hover state captured wrong | Ensure `hover()` completes before screenshot              |
| Flaky layout shifts        | Wait for specific elements to be visible before capturing |

## Anti-Patterns

### ❌ NEVER: Test Functionality with VRT

```typescript
// ❌ Wrong - Use E2E tests for interactions
await page.click('button')
await expect(page).toHaveScreenshot() // Don't verify clicks work via VRT

// ✅ Correct - Use VRT only for visual state
await expect(page.getByRole('button')).toHaveScreenshot('button-state.png')
```

### ❌ NEVER: Capture Full Page by Default

```typescript
// ❌ Wrong - Too broad, fails for any change
await expect(page).toHaveScreenshot('entire-app.png', { fullPage: true })

// ✅ Correct - Capture specific elements
await expect(page.getByTestId('entry-card')).toHaveScreenshot()
```

### ❌ NEVER: Update Blindly Without Review

```bash
# ❌ Wrong - Blindly updating without understanding failures
pnpm test:e2e --update-snapshots

# ✅ Correct - Review failures first, then selectively update
npx playwright show-report  # Review diffs
pnpm test:e2e visual-regression.test.ts --update-snapshots  # After verification
```

### ❌ NEVER: Use waitForTimeout()

```typescript
// ❌ Wrong - Arbitrary wait, still flaky
await page.waitForTimeout(1000)
await expect(element).toHaveScreenshot()

// ✅ Correct - Wait for specific state
await expect(element).toBeVisible()
await page.evaluate(() => document.fonts.ready)
await expect(element).toHaveScreenshot()
```

## Configuration

Key Playwright settings for VRT:

```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      // Allow minor anti-aliasing differences
      threshold: 0.01,
      maxDiffPixels: 100,
      // Ensure animations don't interfere
      animations: 'disabled'
    }
  },
  use: {
    // Consistent viewport
    viewport: { width: 1280, height: 800 },
    // Wait for fonts and styles
    actionTimeout: 10000
  }
})
```

## Quick Reference Checklist

Before writing VRT tests:

- [ ] Prefer element-level screenshots over page-level
- [ ] Disable animations via `page.addStyleTag()` or config
- [ ] Wait for fonts: `page.evaluate(() => document.fonts.ready)`
- [ ] Mask dynamic content (timestamps, IDs, live data)
- [ ] Set explicit viewport sizes for each test
- [ ] Hide cursor: `page.mouse.move(0, 0)`
- [ ] Use `threshold` and `maxDiffPixels` for tolerance
- [ ] Test visual states (hover, focus, disabled) separately
- [ ] Focus on design system and responsive behavior
- [ ] Don't test functionality (use E2E for interactions)

Before committing:

- [ ] VRT tests pass locally
- [ ] Baselines reviewed and intentional: `npx playwright show-report`
- [ ] Snapshots committed to version control
- [ ] No `waitForTimeout()` calls
- [ ] Tests isolated (no shared state between tests)
- [ ] Descriptive snapshot names (`component-state-viewport.png`)
