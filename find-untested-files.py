#!/usr/bin/env python3
"""
Find Untested Files Script

This script searches a repository for source files (.vue and .ts files, excluding .test.ts)
that do not have a colocated test file (.test.ts) in the same directory.

Usage:
    python find-untested-files.py [root_directory]

Arguments:
    root_directory: The directory to search (default: current directory '.')

Notes:
    - Source files: .vue and .ts (but not .test.ts or .d.ts)
    - Test files: .test.ts (same base name as source file)
    - Skips directories: node_modules, .git, dist, build, playwright-report, test-results
    - Ignores: config files, entry points, and test infrastructure files
    - Barrel exports: Auto-detected (index.ts files with only export statements)
    - This helps maintain test coverage by identifying files that need tests
"""

import os
import sys
from pathlib import Path
from typing import List

# Directories to skip during traversal entirely (not walked at all).
SKIP_DIRS = frozenset({"node_modules", ".git", "dist", "build", "playwright-report", "test-results"})

# Directories whose files are never checked for test coverage.
# e2e/ contains Playwright E2E tests and helpers — not application source files.
# test/helpers, test/mocks, test/constants are test infrastructure reused by unit tests.
# src/db/ is browser-specific IndexedDB/SQLite infrastructure (no test environment).
IGNORED_DIRS = frozenset({
    "scripts",
    "e2e",           # Playwright E2E tests and helpers — not unit-testable source files
    "ignore",
    "src/db",        # Browser-specific database infrastructure (IndexedDB/SQLite)
    "test/helpers",  # Test helper utilities — infrastructure for unit tests, not app code
    "test/mocks",    # Test mocks — infrastructure for unit tests, not app code
    "test/constants",  # Test constants — infrastructure for unit tests, not app code
})

# Individual files to ignore (relative paths from project root).
# These are entry points, config files, types-only files, barrel exports, or stubs.
IGNORED_FILES = frozenset({
    "eslint.config.ts",
    "playwright.config.ts",
    "vite.config.ts",
    "vitest.config.ts",
    "src/router/index.ts",
    "src/main.ts",
    "src/env.d.ts",
    # Test infrastructure — setup file for vitest, not application source code
    "test/setup.ts",
    # Types-only files — interfaces and type definitions with no runtime logic
    "src/api/types.ts",
    # Re-export index files not detected as barrel by the simple heuristic
    # (they have doc comments before the export block)
    "src/api/index.ts",
    "src/shared/validation/index.ts",
    # Thin wrappers / infrastructure bootstrapping with no testable logic
    "src/api/persistence.ts",
    # Stub with no real implementation
    "src/shared/composables/seed-data/index.ts",
    # Abstract base class — tested indirectly via concrete repository subclasses.
    # Direct unit testing would require a concrete subclass fixture.
    "src/api/base-repository.ts",
    # TODO: Add tests for these tags feature components (merged from master).
    # These are UI-layer components exercised by E2E tests; unit tests pending.
    "src/base/components/BaseTagInputChips.vue",
    "src/base/components/BaseTagInputDropdown.vue",
    "src/modules/entry-day-view/components/EntryDayViewEntryEditorDate.vue",
    "src/modules/entry-day-view/components/EntryDayViewSectionReorder.vue",
    "src/modules/tags/components/TagsSectionBrowseRow.vue",
    "src/shared/components/SharedEntryCardTags.vue",
})


def _read_file_lines(file_path: str) -> List[str]:
    """Read file and return lines, or empty list on error."""
    try:
        with open(file_path, encoding="utf-8") as fh:
            return fh.readlines()
    except (UnicodeDecodeError, OSError):
        return []


def _strip_comments_from_lines(raw_lines: List[str]) -> List[str]:
    """Remove blank lines and comments, return only meaningful code lines."""
    result = []
    in_block_comment = False

    for raw_line in raw_lines:
        stripped = raw_line.strip()

        if not stripped:
            continue

        if "/*" in stripped:
            in_block_comment = True

        if in_block_comment:
            if "*/" in stripped:
                in_block_comment = False
            continue

        if stripped.startswith("//"):
            continue

        result.append(stripped)

    return result


def is_barrel_export(file_path: str) -> bool:
    """
    Check if a file is a barrel export (only contains export statements).

    Args:
        file_path: Path to the file to check

    Returns:
        True if the file is a barrel export
    """
    raw_lines = _read_file_lines(file_path)
    if not raw_lines:
        return False

    code_lines = _strip_comments_from_lines(raw_lines)
    if not code_lines:
        return False

    return all(line.startswith("export") for line in code_lines)


def _is_testable_source_file(filename: str) -> bool:
    """Return True if the filename is a testable application source file."""
    if filename.endswith(".d.ts") or filename.endswith(".test.ts"):
        return False
    return filename.endswith(".vue") or filename.endswith(".ts")


def _should_skip_dir(rel_dir: str) -> bool:
    """Return True if the directory should be skipped entirely."""
    return any(
        rel_dir == ignored or rel_dir.startswith(ignored + "/")
        for ignored in IGNORED_DIRS
    )


def _check_file_for_test(
    dirpath: str,
    filenames: List[str],
    filename: str,
    rel_dir: str,
    untested: List[str],
) -> None:
    """Check a single file and append to untested if it lacks a colocated test."""
    if not _is_testable_source_file(filename):
        return

    rel_file = str(Path(rel_dir) / filename)

    if rel_file in IGNORED_FILES:
        return

    if filename == "index.ts":
        full_path = os.path.join(dirpath, filename)
        if is_barrel_export(full_path):
            return

    base_name = filename.rsplit(".", 1)[0]
    test_file = base_name + ".test.ts"

    if test_file not in filenames:
        untested.append(rel_file)


def find_untested_files(root_dir: str) -> List[str]:
    """
    Find source files that do not have colocated test files.

    Args:
        root_dir: Root directory to search

    Returns:
        List of file paths (relative to root_dir) that are missing test files
    """
    untested: List[str] = []
    root_path = Path(root_dir).resolve()

    for dirpath, dirnames, filenames in os.walk(root_path):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        rel_dir = os.path.relpath(dirpath, root_path)

        if _should_skip_dir(rel_dir):
            continue

        for filename in filenames:
            _check_file_for_test(dirpath, filenames, filename, rel_dir, untested)

    return sorted(untested)


def main() -> None:
    """Main entry point."""
    root_dir = sys.argv[1] if len(sys.argv) > 1 else "."

    if not os.path.isdir(root_dir):
        print(f"Error: {root_dir!r} is not a valid directory")
        sys.exit(1)

    print(f"Searching for untested files in: {os.path.abspath(root_dir)}")
    print("-" * 60)

    untested_files = find_untested_files(root_dir)

    if untested_files:
        print(f"Found {len(untested_files)} files without colocated test files:")
        print()
        for file_path in untested_files:
            print(f"  {file_path}")
        print()
        print("Consider adding .test.ts files for these source files.")
        sys.exit(1)
    else:
        print("All source files have colocated test files!")
        sys.exit(0)


if __name__ == "__main__":
    main()