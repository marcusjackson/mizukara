# Implementation Plan — App Settings

## Task Overview

9 requirements → 7 major tasks → 19 sub-tasks
Estimated average sub-task size: 1–2 hours

---

- [x] 1. Fix useDatabaseExport composable for current project
- [x] 1.1 Update export filename pattern to `mizukara-YYYY-MM-DD-HHMM.db`
  - Replace `kanji-dictionary-` prefix with `mizukara-`
  - Add hours and minutes (zero-padded) to the filename timestamp
  - Update `generateExportFilename()` return format
  - _Requirements: 3.2, 3.3_

- [x] 1.2 Update database validation to check for `entries` table
  - Replace `tables.includes('kanjis')` with `tables.includes('entries')` in `validateSqliteData()`
  - Ensure validation still opens a temporary sql.js instance and queries `sqlite_master`
  - _Requirements: 4.5, 4.6_

- [x] 1.3 Update clear operation for entries-only schema
  - Replace the multi-table DELETE statements with a single `DELETE FROM entries`
  - Ensure `persist()` is called after clear
  - _Requirements: 5.3, 5.4_

- [x] 1.4 Update useDatabaseExport tests for corrected behavior
  - Update filename pattern assertions
  - Update validation assertions (entries table, not kanjis)
  - Update clear operation assertions (single DELETE statement)
  - _Requirements: 3.2, 3.3, 4.5, 4.6, 5.3, 5.4_

- [x] 2. Create SharedConfirmDialog component
- [x] 2.1 (P) Build SharedConfirmDialog with BaseDialog foundation
  - Accept props: `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `variant`, `loading`
  - Emit events: `confirm`, `cancel`, `update:open`
  - Render confirm and cancel buttons with appropriate variants
  - Danger variant styles the confirm button with `variant="danger"`
  - Cancel button uses `variant="ghost"` or `variant="secondary"`
  - Focus management: Cancel button receives initial focus for destructive dialogs
  - _Requirements: 4.3, 5.1, 5.2, 9.6_

- [x] 2.2 (P) Add SharedConfirmDialog unit tests
  - Test default rendering with title, description, and buttons
  - Test confirm emission on confirm button click
  - Test cancel emission on cancel button click and Escape key
  - Test danger variant applies correct button styling
  - Test loading state disables confirm button and shows spinner
  - Test keyboard navigation and focus trapping
  - _Requirements: 4.3, 5.1, 5.2, 9.6_

- [x] 3. Create app-settings module structure and AppSettingsRoot
- [x] 3.1 Scaffold app-settings module directory and AppSettingsRoot component
  - Create `src/modules/app-settings/components/` directory structure
  - Build `AppSettingsRoot` with page title ("Settings"), back navigation link, and section layout
  - Back link navigates to entry day view route or uses `router.back()`
  - Vertical layout with sections separated by spacing
  - Centered content area (max-width ~800px) on desktop, full-width on mobile
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 8.1_

- [x] 3.2\* AppSettingsRoot unit tests
  - Test renders page title and back link
  - Test renders appearance and database sections
  - Test back link navigation
  - _Requirements: 6.1, 6.2_

- [x] 4. Create AppSettingsSectionAppearance component
- [x] 4.1 (P) Build appearance section with theme toggle and version display
  - Display "Theme" option with BaseSwitch bound to `useTheme().theme === 'dark'`
  - Call `toggleTheme()` on switch change
  - Display "App Version" with `__APP_VERSION__` value
  - ARIA label on switch: "Toggle dark mode"
  - Option rows: label + description on left, control on right
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 4.2\* (P) AppSettingsSectionAppearance unit tests
  - Test version number renders from `__APP_VERSION__`
  - Test theme toggle switch reflects current theme
  - Test toggle calls `toggleTheme()`
  - Test switch has accessible ARIA label
  - _Requirements: 1.1, 1.4, 2.2, 2.8, 9.2_

- [x] 5. Create AppSettingsSectionDatabase component
- [x] 5.1 Build database section with export, import, and clear operations
  - Export button: triggers `exportDatabase()`, shows loading state while `isExporting`
  - Import button: opens hidden file input (accept `.db,.sqlite,.sqlite3`), then shows SharedConfirmDialog
  - Clear button: shows SharedConfirmDialog with destructive warning
  - Computed `isAnyOperationInProgress` disables all buttons when any operation is active
  - Each operation shows appropriate loading text on its button
  - After successful import or clear, trigger full app refresh
  - _Requirements: 3.1, 3.4, 3.5, 3.8, 4.1, 4.2, 4.3, 4.4, 4.8, 4.11, 4.12, 4.14, 5.1, 5.2, 5.3, 5.6, 5.7, 5.8, 5.10_

- [x] 5.2 Add descriptive labels and warnings for each database operation
  - Export: description explains backup purpose
  - Import: confirmation dialog warns about data replacement, suggests exporting first
  - Clear: confirmation dialog warns action is destructive and irreversible
  - _Requirements: 5.2, 7.7_

- [x] 5.3\* AppSettingsSectionDatabase unit tests
  - Test renders export, import, and clear buttons
  - Test export button calls `exportDatabase()`
  - Test import flow: file picker → confirmation dialog → import
  - Test clear flow: confirmation dialog → clear
  - Test buttons disabled when any operation is in progress
  - Test loading states on each button during operations
  - _Requirements: 3.1, 3.5, 3.8, 4.1, 4.3, 4.12, 4.14, 5.1, 5.8, 5.10_

- [x] 6. Create SettingsPage and configure routing
- [x] 6.1 Create SettingsPage thin wrapper
  - Create `src/pages/SettingsPage.vue` following existing page patterns
  - Render `AppSettingsRoot` component
  - Include `<BaseToast />` for notifications
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6.2 Activate `/settings` route in router configuration
  - Uncomment or add the settings route entry in `src/router/index.ts`
  - Route: `{ path: '/settings', name: 'settings', component: SettingsPage }`
  - _Requirements: 6.1, 6.3_

- [x] 6.3 Add settings navigation to EntryDayViewSectionNavigation
  - Add a gear/settings icon button linking to `/settings` via `<RouterLink>`
  - Position in the navigation bar (e.g., end of navigation row)
  - Icon: SVG gear/cog icon, 44x44px minimum touch target
  - ARIA label: "Settings"
  - Keyboard accessible (inherits from RouterLink)
  - _Requirements: 6.1, 6.3, 6.4, 8.2, 9.1_

- [x] 6.4\* SettingsPage and route unit tests
  - Test SettingsPage renders AppSettingsRoot
  - Test route resolves to SettingsPage component
  - _Requirements: 6.1, 6.3_

- [x] 7. Responsive design and accessibility polish
- [x] 7.1 Ensure responsive layout across all settings components
  - Settings page: centered max-width on desktop, full-width with padding on mobile
  - Touch targets: all buttons and interactive elements ≥ 44x44px on mobile
  - Typography: appropriate font sizes for mobile (smaller) and desktop (standard)
  - Option rows: stack vertically on narrow viewports if needed
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7.2 Verify accessibility across all settings components
  - Focus indicators visible on all interactive elements
  - Screen reader announcements for loading and disabled states (via BaseButton)
  - SharedConfirmDialog focus trapping and Escape key (via Reka UI Dialog)
  - Theme toggle ARIA label
  - File input accessible labeling
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 7.3 E2E tests for settings feature
  - Navigate to settings via gear icon
  - Toggle theme and verify visual change
  - Export database and verify file download
  - Import database with valid file
  - Clear database with confirmation
  - Verify responsive behavior on mobile viewport
  - Verify keyboard navigation through settings
  - Visual regression testing for main UI elements (follow patterns from entry-day-view ones)
  - _Requirements: 1.1, 2.2, 3.1, 4.1, 5.1, 6.1, 8.1, 9.1_

---

_Generated: 2026-02-15_
_Feature: app-settings_
_Status: Tasks generated_
