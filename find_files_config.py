"""Per-repo settings for find-untested-files.py and find-unused-files.py.

The two scripts are shared across the fleet (fleet-sync); this file is the repo's own.
"""

# --- find-untested-files.py ---

# Directories whose files are never checked for test coverage.
# e2e/ contains Playwright E2E tests and helpers — not application source files.
# test/helpers, test/mocks, test/constants are test infrastructure reused by unit tests.
UNTESTED_IGNORED_DIRS = frozenset({
    "scripts",
    "e2e-production",  # Production-build Playwright checks
    "e2e",           # Playwright E2E tests and helpers — not unit-testable source files
    "ignore",
    "test/helpers",  # Test helper utilities — infrastructure for unit tests, not app code
    "test/mocks",    # Test mocks — infrastructure for unit tests, not app code
    "test/constants",  # Test constants — infrastructure for unit tests, not app code
})

# Individual files to ignore (relative paths from project root).
# These are entry points, config files, types-only files, barrel exports, or stubs.
UNTESTED_IGNORED_FILES = frozenset({
    # Runs only inside a Web Worker, and needs a real graphics adapter and a
    # real model download to do anything. Everything in it that can be tested
    # without those lives in src/modules/local-inference/utils/ instead.
    "src/modules/local-inference/inference-worker.ts",
    # Only attaches visibility, pagehide and beforeunload listeners to the
    # real document; the persistence logic they call is tested in indexeddb.test.ts.
    "src/db/lifecycle.ts",
    "eslint.config.ts",
    "playwright.config.ts",
    "playwright.production.config.ts",
    "vite.config.ts",
    "vitest.config.ts",
    "src/router/index.ts",
    "src/main.ts",
    "src/env.d.ts",
    # Test infrastructure — setup file for vitest, not application source code
    "test/setup.ts",
    # Types-only files — interfaces and type definitions with no runtime logic
    "src/api/types.ts",
    "src/modules/local-inference/tag-head-types.ts",
    "src/api/search/search-types.ts",
    # Types plus one derived constant list; no behavior to exercise
    "src/shared/types/device-sync-types.ts",
    # Re-export index files not detected as barrel by the simple heuristic
    # (they have doc comments before the export block)
    "src/shared/composables/index.ts",
    # TODO: Add tests for these tags feature components (merged from master).
    # These are UI-layer components exercised by E2E tests; unit tests pending.
    "src/base/components/BaseTagInputChips.vue",
    "src/base/components/BaseTagInputDropdown.vue",
    "src/modules/entry-day-view/components/EntryDayViewEntryEditorDate.vue",
    "src/modules/entry-day-view/components/EntryDayViewSectionReorder.vue",
    "src/modules/tags/components/TagsSectionBrowseRow.vue",
    "src/shared/components/SharedEntryCardTags.vue",
})

# --- find-unused-files.py ---

# Directories whose source files are excluded from the unused-file check.
# (They may still be *searched* for imports of other files.)
UNUSED_IGNORED_DIRS = frozenset({"scripts", "ignore"})

# Files excluded from the unused-file check (relative paths from project root).
UNUSED_IGNORED_FILES = frozenset({
    # Referenced only as new Worker(new URL(...)), which this regex-based
    # resolver cannot see, the same way test/mocks/pwa-register.ts is reached
    # only through a Vitest alias.
    "src/modules/local-inference/inference-worker.ts",
    "eslint.config.ts",
    "playwright.config.ts",
    "playwright.production.config.ts",
    "vite.config.ts",
    "vitest.config.ts",
    "stylelint.config.mjs",
    "src/router/index.ts",
    "src/main.ts",
    "src/env.d.ts",
    "src/App.vue",
    "test/setup.ts",
    # Barrel/re-export index files — referenced only through their barrel
    "src/shared/components/index.ts",
    "src/shared/composables/index.ts",
    "src/base/components/index.ts",
    "src/base/composables/index.ts",
    # Vitest module-alias mock: mapped as virtual:pwa-register/vue in vitest.config.ts,
    # so it is never imported via a file path — invisible to static analysis.
    "test/mocks/pwa-register.ts",
    # Re-exported via export * from './seeders' in test/helpers/tags/index.ts.
    # The script cannot trace wildcard re-exports, so this is a false positive.
    "test/helpers/tags/seeders.ts",
})

# Directories where orphaned-test detection is skipped, besides e2e/ and the unused-check ignored dirs.
# src/db/migrations/ — test file names don't match source file names
#   (e.g. 001-create-entries.test.ts tests index.ts, not 001-create-entries.ts)
ORPHAN_TEST_SKIP_DIRS = frozenset({"e2e-production", "src/db/migrations"})
