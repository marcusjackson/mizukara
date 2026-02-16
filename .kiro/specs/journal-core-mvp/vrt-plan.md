# Visual Regression Testing Plan

**Feature**: journal-core-mvp  
**Purpose**: Verify visual consistency of UI components and responsive layouts  
**Related**: [tasks-testing.md](tasks-testing.md) Task 16.5

---

## VRT Strategy Overview

**Primary Approach**: Element-level screenshots of individual components  
**Secondary Approach**: Selective page-level screenshots for layout verification  
**Coverage**: Visual states not captured by unit/E2E tests

**What VRT Tests:**

- Design system consistency (CSS variables applied correctly)
- Responsive component appearance at breakpoints
- Visual states (hover, focus, disabled, error)
- Cross-browser rendering differences
- Unintended visual changes from CSS modifications

**What VRT Does NOT Test** (covered elsewhere):

- Database operations → Unit tests
- Navigation logic → E2E tests
- Keyboard shortcuts → E2E tests
- Form validation logic → Unit tests
- User interactions → E2E tests

---

## Component Visual Tests (Element-Level)

### 1. EntryDayViewNavigator

**Purpose**: Verify navigation bar appearance and responsive layout

**Test Cases**:

- Desktop layout (1280x800)
  - Date format: "Monday, February 14, 2026" visible
  - Navigation buttons: 44x44px, proper spacing
  - Border-bottom separator visible
- Mobile layout (375x667)
  - Date format: "Mon, Feb 14, 2026" visible
  - Sticky positioning (visual check)
  - Navigation buttons: 44x44px touch targets
- Focus state
  - Previous button focused (keyboard navigation)
  - Next button focused

**Why**: Responsive date formatting and button sizing are purely visual concerns.

### 2. EntryDayViewEntryCard

**Purpose**: Verify card styling, typography, and hover states

**Test Cases**:

- Normal state (desktop)
  - Serif content font, 18px
  - Sans-serif metadata, 14px, muted color
  - White background, subtle shadow
  - 20px padding
- Normal state (mobile)
  - Serif content font, 16px
  - 16px padding
  - Edit button always visible (not hover-only)
- Hover state (desktop only)
  - Edit button visible on hover
  - No layout shift on hover
- With edited indicator
  - "Edited" label visible in metadata
  - Proper spacing and color
- Multiple cards
  - Consistent spacing between cards
  - Proper stacking and alignment

**Masking**: Mask `[data-testid="created-at"]` timestamps (dynamic content)

**Why**: Typography, spacing, and hover reveals are visual details E2E tests don't verify.

### 3. EntryDayViewCreateForm

**Purpose**: Verify form styling, button states, and keyboard hints

**Test Cases**:

- Empty state (desktop)
  - Textarea placeholder visible
  - Save button disabled (visual appearance)
  - Keyboard hints visible: "⌘/Ctrl+S to save • Esc to clear"
  - Card styling: white background, subtle shadow
  - 20px padding
- Empty state (mobile)
  - Textarea placeholder visible
  - Save button disabled
  - Keyboard hints hidden (responsive CSS)
  - 16px padding
- Filled state (desktop)
  - Textarea with content
  - Save button enabled (visual appearance)
- Error state
  - Error message below textarea
  - Error styling applied
  - Button remains disabled

**Why**: Button states and responsive keyboard hints are visual-only features.

### 4. EntryDayViewEntryEditor

**Purpose**: Verify editor styling and form layout

**Test Cases**:

- Editing state (desktop)
  - Textarea with entry content
  - Date input visible with current assigned day
  - Save/Cancel buttons visible
  - 20px padding
- Editing state (mobile)
  - Textarea with entry content
  - Date input visible
  - Buttons visible and accessible (44x44px)
  - 16px padding
- Focus state
  - Textarea focused (border highlight)
  - Date input focused

**Why**: Editor replaces card view; layout and spacing need verification.

### 5. Empty State

**Purpose**: Verify empty state message styling and positioning

**Test Cases**:

- Desktop (1280x800)
  - Empty message centered
  - Proper text styling (sans-serif, muted)
  - 32px vertical padding
- Mobile (375x667)
  - Empty message centered
  - Proper text scaling

**Why**: Empty state is purely presentational, no logic involved.

---

## Layout Visual Tests (Page-Level)

### 6. Day View Layout Verification

**Purpose**: Verify overall layout integrity at key breakpoints

**Test Cases**:

- Mobile breakpoint (375x667)
  - Navigator sticky positioning
  - Create form full-width
  - Entry cards full-width
  - Proper vertical spacing
  - No horizontal overflow
- Tablet breakpoint (768x1024)
  - Responsive layout adjustments
  - Content centering
  - Card max-width respected
- Desktop breakpoint (1280x800)
  - Content centered with max-width
  - Generous whitespace
  - Card shadows visible
  - Navigation bar spanning full width

**Masking**: Mask all `[data-testid="created-at"]` timestamps

**Why**: Catch layout shifts and responsive breakpoint issues. Full-page tests complement component-level tests by verifying element relationships.

---

## Cross-Browser Testing

### 7. Browser Engine Differences

**Purpose**: Catch rendering differences across browser engines

**Test Strategy**:

- Run all tests on **Chromium, Firefox, WebKit**
- Focus on critical components:
  - EntryDayViewNavigator (date formatting)
  - EntryDayViewEntryCard (serif font rendering)
  - Button focus states (browser default styles differ)

**Why**: Font rendering and anti-aliasing differ across engines.

---

## Test Organization

### File Structure

```
e2e/
  visual-regression.test.ts           # All VRT tests
  visual-regression.test.ts-snapshots/
    chromium/
      navigator-desktop.png
      navigator-mobile.png
      entry-card-normal-desktop.png
      entry-card-hover-desktop.png
      create-form-empty-desktop.png
      create-form-filled-desktop.png
      editor-editing-desktop.png
      empty-state-desktop.png
      day-view-layout-mobile.png
      day-view-layout-desktop.png
    firefox/
      ...
    webkit/
      ...
```

### Test Structure

```typescript
test.describe('Visual Regression: Components', () => {
  // Helper to wait for stability
  const waitForStability = async (page: Page) => {
    await page.goto('/entries/2026-02-14', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.create-form')).toBeVisible()
    await page.mouse.move(0, 0) // Hide cursor
  }

  test.describe('EntryDayViewNavigator', () => {
    test('desktop layout', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await waitForStability(page)

      const navigator = page.getByTestId('day-navigator')
      await expect(navigator).toHaveScreenshot('navigator-desktop.png')
    })

    // More tests...
  })

  // More components...
})

test.describe('Visual Regression: Layouts', () => {
  // Page-level tests...
})
```

---

## Stability Requirements

### Disable Animations

```typescript
test.beforeEach(async ({ page }) => {
  // Disable CSS animations/transitions
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
})
```

### Wait for Fonts

```typescript
await page.evaluate(() => document.fonts.ready)
```

### Mask Dynamic Content

```typescript
await expect(entryCard).toHaveScreenshot('entry-card.png', {
  mask: [entryCard.getByTestId('created-at')]
})
```

### Hide Cursor

```typescript
await page.mouse.move(0, 0)
```

---

## Thresholds and Tolerance

### Recommended Settings

```typescript
// Component screenshots (strict)
await expect(component).toHaveScreenshot('component.png', {
  threshold: 0.01, // 1% tolerance for anti-aliasing
  maxDiffPixels: 50 // Allow minor differences
})

// Page screenshots (looser)
await expect(page).toHaveScreenshot('layout.png', {
  threshold: 0.02, // 2% tolerance
  maxDiffPixels: 500, // Allow more differences
  fullPage: true
})
```

---

## Maintenance Strategy

### When to Update Baselines

**Update baselines when**:

- Intentionally changing CSS/design (e.g., updating color tokens)
- Updating component layouts or spacing
- Fixing visual bugs (after verifying fix)

**Do NOT update baselines when**:

- Tests fail unexpectedly (investigate first)
- CI fails without local verification
- "Just to make tests pass"

### Baseline Update Process

1. Run tests locally: `pnpm test:e2e visual-regression.test.ts`
2. Review HTML report: `npx playwright show-report`
3. Inspect "Expected", "Actual", "Diff" images for each failure
4. Verify changes are intentional
5. Update baselines: `pnpm test:e2e visual-regression.test.ts --update-snapshots`
6. Commit updated snapshots to version control

### Snapshot Management

- Commit snapshots to Git (they're source code)
- Consider Git LFS if snapshot folder exceeds 50MB
- Store per-browser engine (Chromium, Firefox, WebKit)
- Review diffs in PRs to catch unintended changes

---

## CI/CD Integration

### Workflow

1. VRT runs on every PR
2. On failure:
   - CI uploads HTML report as artifact
   - Developer downloads report
   - Reviews visual diffs
   - Determines if change is intentional or bug
3. If intentional:
   - Update baselines locally
   - Commit updated snapshots
   - Push to PR
4. If bug:
   - Fix CSS/component code
   - Re-run tests

### Docker (Optional)

For maximum consistency, run VRT in Playwright Docker container:

```yaml
- name: Run VRT in Docker
  run: |
    docker run --rm -v $(pwd):/work -w /work \
      mcr.microsoft.com/playwright:latest \
      pnpm test:e2e visual-regression.test.ts
```

---

## Success Metrics

VRT is successful when:

- [ ] All component visual states captured
- [ ] Layout tests verify responsive breakpoints
- [ ] Baseline snapshots committed to version control
- [ ] Tests pass consistently (no flakiness)
- [ ] Visual regressions caught before production
- [ ] CSS changes require intentional baseline updates
- [ ] Developers trust VRT results (not ignored)

---

## Implementation Notes

### Test Data

Use fixed test date to avoid date-dependent failures:

```typescript
const TEST_DATE = '2026-02-14' // Fixed date for consistency
await page.goto(`/entries/${TEST_DATE}`)
```

### Test Isolation

Each test must be independent:

```typescript
test.beforeEach(async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/entries/2026-02-14', { waitUntil: 'networkidle' })
})
```

### Reusable Helpers

Extract common patterns:

```typescript
// e2e/helpers/vrt-utils.ts
export async function preparePageForVRT(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(0, 0)
}

export async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `
  })
}
```

---

## Open Questions / Future Enhancements

- **Git LFS**: Enable if snapshot folder exceeds 50MB
- **Percy/Chromatic**: Consider hosted VRT service for better diff UI
- **Accessibility snapshots**: Capture accessibility tree alongside visual snapshots
- **Mobile device emulation**: Test on specific device emulations (iPhone, Pixel)
- **Dark mode**: Add dark mode VRT when theme switcher implemented

---

_Created: 2026-02-14_  
_Purpose: Define VRT strategy for journal-core-mvp visual verification_
