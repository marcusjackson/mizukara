# Tasks: Testing & Validation

**Part of**: [journal-core-mvp tasks](tasks.md)  
**Theme**: E2E tests, keyboard shortcuts validation, responsive design verification

**⚠️ Requirements 10-11 Updates**: Tasks 15.7-15.8 (new E2E tests), 16.1 (keyboard shortcuts), and 16.5 (VRT) need updates. See [addendum-req-10-11.md](addendum-req-10-11.md) for complete details.

**Related files**:

- [tasks.md](tasks.md) — Overview and navigation
- [tasks-orchestration.md](tasks-orchestration.md) — Orchestration (Tasks 11-14)

**Prerequisites**: Tasks 1-14 complete (all implementation finished)

---

## Task 15: End-to-End Tests

- [x] 15.1 E2E test: Entry creation flow
  - Navigate to entry day view (default to today)
  - Type content into create form textarea
  - Click "New Entry" button
  - Verify entry appears in list below
  - Verify entry content matches input
  - Verify created timestamp displayed
  - Verify textarea cleared after save
  - Create multiple entries to verify list ordering
  - Place test in `/e2e/entry-creation.test.ts`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 15.2 E2E test: Day navigation flow
  - Navigate to entry day view (today)
  - Verify current date displays correctly
  - Click "Previous Day" button
  - Verify date updates to yesterday
  - Verify entries for yesterday load
  - Click "Next Day" button twice
  - Verify date updates to tomorrow
  - Verify entries for tomorrow load (or empty state)
  - Use browser back button
  - Verify date returns to previous day
  - Place test in `/e2e/day-navigation.test.ts`
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 15.3 E2E test: Entry editing flow
  - Create entry with test content
  - Click Edit button on entry
  - Verify editor replaces card view
  - Verify textarea contains original content
  - Modify content in textarea
  - Click Save button
  - Verify updated content displays
  - Verify updated indicator shows (if timestamps differ)
  - Edit entry again, click Cancel
  - Verify changes discarded, original content remains
  - Place test in `/e2e/entry-editing.test.ts`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 15.4 E2E test: Entry reordering flow
  - Create three entries on same day
  - Verify entries display in creation order
  - Enter reorder mode (if mode toggle implemented)
  - Click "Move Up" on second entry
  - Verify second entry moves to first position
  - Verify first entry moves to second position
  - Click "Move Down" on first entry (now in position 2)
  - Verify entry returns to original position
  - Verify boundary checks: first entry can't move up, last entry can't move down
  - Exit reorder mode, refresh page
  - Verify custom order persists
  - Place test in `/e2e/entry-reordering.test.ts`
  - _Requirements: 4.9, 4.10, 4.11_

- [x] 15.5 E2E test: Assigned day reassignment
  - Create entry on today
  - Edit entry
  - Change assigned day to yesterday using date picker
  - Save changes
  - Verify entry disappears from today's list
  - Navigate to yesterday
  - Verify entry appears in yesterday's list
  - Verify entry content preserved
  - Place test in `/e2e/entry-day-reassignment.test.ts`
  - _Requirements: 4.12, 4.13, 4.14_

- [x] 15.6 E2E test: Offline functionality
  - Navigate to entry day view
  - Disconnect network (Playwright offline mode)
  - Create new entry
  - Verify entry saves successfully (local SQLite)
  - Edit existing entry
  - Verify edit saves successfully
  - Navigate between days
  - Verify navigation works offline
  - Reconnect network
  - Verify no errors, data persists
  - Place test in `/e2e/offline-functionality.test.ts`
  - Note: Only database operations tested; PWA service worker app shell caching (requirement 6.1) is not implemented and does not need to be tested as per project scope
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 15.7 E2E test: Home page redirect
  - Navigate to home page root path (/)
  - Verify immediate redirect to /entries (no intermediate content visible)
  - Verify URL path is /entries (not /entries/YYYY-MM-DD, root defaults to today)
  - Verify entry day view loads correctly
  - Verify current date displays today's date
  - Verify redirect uses client-side navigation (no page reload)
  - Test works when installed as PWA (if PWA install tested)
  - Place test in `/e2e/home-redirect.test.ts`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15.8 E2E test: Date picker navigation
  - Navigate to entry day view (today)
  - Click date picker trigger button (calendar icon or date text)
  - Verify date picker dialog opens
  - Verify date input pre-filled with current date
  - Enter future date (e.g., 2026-03-01) in date input
  - Click "Go to Date" button
  - Verify dialog closes
  - Verify page navigates to entered date
  - Verify entries for that date load
  - Open date picker again
  - Click Cancel button
  - Verify dialog closes without navigation
  - Open date picker using keyboard shortcut (G key)
  - Verify dialog opens
  - Enter invalid date format
  - Verify validation error displays
  - Verify "Go to Date" button disabled or shows error
  - Press Escape key
  - Verify dialog closes
  - Test on mobile viewport (use native date input)
  - Place test in `/e2e/date-picker.test.ts`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

---

## Task 16: Keyboard Shortcuts & Responsive Validation

- [x] 16.1 E2E test: Keyboard shortcuts
  - Navigate to entry day view
  - Press Cmd/Ctrl+N
  - Verify focus moves to create form textarea
  - Type content, press Cmd/Ctrl+S
  - Verify entry saves
  - Press J key
  - Verify navigation to next day
  - Press K key
  - Verify navigation to previous day
  - Press G key
  - Verify date picker dialog opens
  - Press Escape
  - Verify date picker closes
  - Click Edit on entry
  - Type content in editor, press Cmd/Ctrl+S
  - Verify entry updates
  - Press Escape in editor
  - Verify edit mode exits without saving
  - Type content in create form, press Escape
  - Verify textarea clears
  - Type content in create form, press J key
  - Verify J key does NOT trigger navigation (input focused)
  - Place test in `/e2e/keyboard-shortcuts.test.ts`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 16.2 E2E test: Keyboard shortcuts reference
  - Navigate to entry day view
  - Open keyboard shortcuts help (if implemented)
  - Verify all shortcuts listed: Cmd+N, J/K, Cmd+S, Escape
  - Verify help accessible via keyboard
  - Place test in `/e2e/keyboard-shortcuts-help.test.ts`
  - Note: Test gracefully skips if help UI not implemented (requirement 7.5 deferred)
  - _Requirements: 7.5, 7.6_

- [x] 16.3 E2E test: Responsive design (mobile)
  - Set viewport to mobile size (375x667)
  - Navigate to entry day view
  - Verify navigation buttons are 44x44px minimum
  - Verify Edit button visible (not hover-only)
  - Verify Save button in create form is 44x44px minimum
  - Verify text content readable (font size appropriate)
  - Verify cards display full-width
  - Verify spacing appropriate for mobile
  - Create entry on mobile viewport
  - Edit entry on mobile viewport
  - Verify touch interactions work (tap buttons, focus inputs)
  - Place test in `/e2e/responsive-mobile.test.ts`
  - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.7_

- [x] 16.4 E2E test: Responsive design (desktop)
  - Set viewport to desktop size (1280x800)
  - Navigate to entry day view
  - Verify navigation layout optimized for desktop
  - Verify Edit button hover-reveal works (if implemented)
  - Verify content uses larger font (18px for entry text)
  - Verify generous whitespace and spacing
  - Test keyboard shortcuts functionality
  - Place test in `/e2e/responsive-desktop.test.ts`
  - _Requirements: 9.1, 9.4, 9.8_

- [x] 16.5 Automated visual regression testing
  - **See [vrt-plan.md](vrt-plan.md) for complete VRT strategy and test cases**
  - Implement Playwright-based VRT in `/e2e/visual-regression.test.ts`
  - **Primary approach**: Element-level screenshots of components (navigator, entry card, create form, editor, empty state)
  - **Secondary approach**: Selective page-level screenshots for layout verification at breakpoints (375px, 768px, 1280px)
  - Disable animations via `page.addStyleTag()` to prevent flaky screenshots
  - Mask dynamic content (timestamps) using `mask` option in `toHaveScreenshot()`
  - Wait for fonts to load: `page.evaluate(() => document.fonts.ready)`
  - Hide cursor: `page.mouse.move(0, 0)`
  - Use threshold `0.01` (1%) for components, `0.02` (2%) for page-level tests
  - Test visual states: normal, hover (desktop), focus, disabled, error
  - Test responsive layouts: desktop (1280x800), mobile (375x667)
  - Generate baselines: `pnpm test:e2e visual-regression.test.ts --update-snapshots`
  - Review diffs before updating baselines: `npx playwright show-report`
  - Commit baseline snapshots to version control
  - Run in CI/CD to catch unintended visual regressions
  - Follow guidelines in `.github/instructions/vrt-testing.instructions.md`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

---

**Prerequisites**: Tasks 1-14 complete (all implementation finished)

**Completion**: After Tasks 15-16 pass, feature is ready for use

---

## Final Validation Checklist

Before marking feature complete:

- [ ] All unit tests passing (`pnpm test`)
- [ ] All E2E tests passing (`pnpm test:e2e`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] File size limits respected (check ESLint report)
- [ ] All 9 requirements fully implemented
- [ ] Database migration runs successfully
- [ ] Keyboard shortcuts working on Mac and Windows/Linux
- [ ] Responsive on mobile (320px-767px) and desktop (1024px+)
- [ ] Offline functionality verified
- [ ] Visual design matches specification (CSS variables, tokens)
- [ ] Browser back/forward works correctly
- [ ] No console errors or warnings

---

_Part of journal-core-mvp tasks • See [tasks.md](tasks.md) for navigation_
