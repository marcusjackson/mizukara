#!/usr/bin/env python3
"""
Find Unused Files Script

This script searches a repository for source files (.vue, .ts, .js files)
that are not imported anywhere in the codebase.

Usage:
    python find-unused-files.py [root_directory]

Arguments:
    root_directory: The directory to search (default: current directory '.')

Notes:
    - Source files: .vue, .ts, .js (excluding .test.ts, .d.ts)
    - Searches for import statements in all files (including test files)
    - Resolves @/, @test/ aliases and relative imports
    - Skips directories: node_modules, .git, dist, build, playwright-report, test-results
    - Ignores: config files, entry points, barrel exports
    - This helps identify dead code and unused files
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Optional, Set, Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

INDEX_TS = "index.ts"
TEST_TS_SUFFIX = ".test.ts"
SOURCE_EXTENSIONS = (".vue", ".ts", ".js")
RESOLVE_EXTENSIONS = (".ts", ".vue", ".js")

# Directories to never walk into.
SKIP_DIRS = frozenset({"node_modules", ".git", "dist", "build", "playwright-report", "test-results"})

# Directories whose source files are excluded from the unused-file check.
# (They may still be *searched* for imports of other files.)
IGNORED_SOURCE_DIRS = frozenset({"scripts", "ignore"})

# Files excluded from the unused-file check (relative paths from project root).
IGNORED_SOURCE_FILES = frozenset({
    "eslint.config.ts",
    "playwright.config.ts",
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
    "src/shared/validation/index.ts",
    "src/base/components/index.ts",
    "src/base/composables/index.ts",
    # api/index.ts is a barrel — its internal modules are excluded from the check
    # because they're only accessible through the barrel itself.
    "src/api/types.ts",
    "src/api/persistence.ts",
    # BaseRepository is an abstract base class exported for future use.
    # No concrete repository extends it yet, but it is part of the public API.
    "src/api/base-repository.ts",
    # Vitest module-alias mock: mapped as virtual:pwa-register/vue in vitest.config.ts,
    # so it is never imported via a file path — invisible to static analysis.
    "test/mocks/pwa-register.ts",
    # Test infrastructure helper: may be used in future tests; not a dead-code risk.
    "test/helpers/render.ts",
    # Re-exported via export * from './seeders' in test/helpers/tags/index.ts.
    # The script cannot trace wildcard re-exports, so this is a false positive.
    "test/helpers/tags/seeders.ts",
})

# Pattern matching files that contain "config" in their name.
CONFIG_PATTERN = re.compile(r"config", re.IGNORECASE)

# ---------------------------------------------------------------------------
# Barrel export detection
# ---------------------------------------------------------------------------


def _read_content(file_path: Path) -> str:
    """Return file content or empty string on error."""
    try:
        with open(file_path, encoding="utf-8") as fh:
            return fh.read()
    except (UnicodeDecodeError, OSError):
        return ""


def is_barrel_export(file_path: Path) -> bool:
    """Return True when a file only re-exports symbols (barrel / index file)."""
    content = _read_content(file_path)
    if not content.strip():
        return False

    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    content = re.sub(r"//.*$", "", content, flags=re.MULTILINE)
    content = " ".join(content.split())

    if not content.strip():
        return False

    parts = re.split(r"\bexport\b", content)
    return not parts[0].strip() and len(parts) >= 2


# ---------------------------------------------------------------------------
# Import resolution
# ---------------------------------------------------------------------------


def _resolve_path_with_extensions(target: Path) -> Optional[Path]:
    """Try target as-is, then with common extensions."""
    if target.exists():
        return target
    for ext in RESOLVE_EXTENSIONS:
        candidate = target.parent / (target.name + ext)
        if candidate.exists():
            return candidate
    return None


def _resolve_directory_import(target: Path) -> Optional[Path]:
    """Handle directory imports by checking for index.ts."""
    if target.is_dir():
        index = target / INDEX_TS
        return index if index.exists() else None
    return None


def resolve_import(importing_file: Path, import_path: str, root: Path) -> Optional[Path]:
    """
    Resolve an import path to an absolute file path.

    Supports @/ (src/), @test/ (test/), relative (./ and ../) imports.
    Returns None for node_modules or unresolvable paths.
    """
    target = _build_target_path(importing_file, import_path, root)
    if target is None:
        return None

    dir_result = _resolve_directory_import(target)
    if dir_result is not None:
        return dir_result

    return _resolve_path_with_extensions(target)


def _build_target_path(
    importing_file: Path, import_path: str, root: Path
) -> Optional[Path]:
    """Convert import string to an unresolved filesystem path."""
    if import_path.startswith("@/"):
        return root / "src" / import_path[2:]
    if import_path.startswith("@test/"):
        return root / "test" / import_path[6:]
    if import_path.startswith("./") or import_path.startswith("../"):
        return (importing_file.parent / import_path).resolve()
    return None


# ---------------------------------------------------------------------------
# Barrel export tracing
# ---------------------------------------------------------------------------


def _extract_barrel_patterns(export_name: str) -> List[str]:
    """Build regex patterns to find a named export in a barrel file."""
    return [
        rf"export\s+{{\s*default\s+as\s+{export_name}\s*}}\s+from\s+['\"]([^'\"]+)['\"]",
        rf"export\s+{{\s*{export_name}\s*}}\s+from\s+['\"]([^'\"]+)['\"]",
        rf"export\s+{{\s*\w+\s+as\s+{export_name}\s*}}\s+from\s+['\"]([^'\"]+)['\"]",
    ]


def find_export_in_barrel(barrel_file: Path, export_name: str) -> Optional[Path]:
    """
    Trace a named import back to its actual source file via a barrel export.

    For example: import { BaseSwitch } from '@/base/components' resolves the barrel,
    then this function finds BaseSwitch.vue as the actual source.
    """
    content = _read_content(barrel_file)
    if not content:
        return None

    barrel_dir = barrel_file.parent
    for pattern in _extract_barrel_patterns(export_name):
        match = re.search(pattern, content)
        if match:
            return _resolve_barrel_target(barrel_dir, match.group(1))
    return None


def _resolve_barrel_target(barrel_dir: Path, exported_from: str) -> Optional[Path]:
    """Resolve a path found inside a barrel export statement."""
    target = barrel_dir / exported_from
    if target.exists():
        return target
    for ext in RESOLVE_EXTENSIONS:
        candidate = target.parent / (target.name + ext)
        if candidate.exists():
            return candidate
    return None


# ---------------------------------------------------------------------------
# Import extraction from file content
# ---------------------------------------------------------------------------


def _extract_import_paths(content: str) -> List[str]:
    """Extract all static and dynamic import paths from file content."""
    static = re.findall(
        r"import\s+[^;]*?from\s+['\"]([^'\"]+)['\"]", content, re.DOTALL
    )
    dynamic = re.findall(
        r"import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", content
    )
    return static + dynamic


def _extract_named_imports(content: str) -> List[Tuple[str, str]]:
    """Extract (names_str, path) tuples for named imports (used for barrel tracing)."""
    return re.findall(
        r"import\s*{([^}]+)}\s*from\s+['\"]([^'\"]+)['\"]", content, re.DOTALL
    )


def _parse_import_names(imports_str: str) -> List[str]:
    """Parse individual symbol names from a destructured import string."""
    names = []
    for part in imports_str.split(","):
        part = part.strip()
        if " as " in part:
            names.append(part.split(" as ")[-1].strip())
        else:
            names.append(part)
    return [n for n in names if n]


# ---------------------------------------------------------------------------
# Used-files collection
# ---------------------------------------------------------------------------


def _process_named_import(
    imports_str: str,
    resolved: Path,
    used_files: Set[Path],
) -> None:
    """Trace named imports into barrels to mark the actual source files."""
    if resolved.name != INDEX_TS or not resolved.exists():
        return
    for name in _parse_import_names(imports_str):
        source = find_export_in_barrel(resolved, name)
        if source:
            used_files.add(source)


def _process_file_imports(
    file_path: Path,
    content: str,
    root: Path,
    used_files: Set[Path],
) -> None:
    """Add all files imported by a single source file to used_files."""
    for import_path in set(_extract_import_paths(content)):
        resolved = resolve_import(file_path, import_path, root)
        if resolved:
            used_files.add(resolved)

    for imports_str, import_path in _extract_named_imports(content):
        resolved = resolve_import(file_path, import_path, root)
        if resolved:
            used_files.add(resolved)
            _process_named_import(imports_str, resolved, used_files)


def find_used_files(root_dir: Path) -> Set[Path]:
    """Return all files that are imported somewhere in the codebase."""
    used_files: Set[Path] = set()

    for file_path in _walk_all_files(root_dir):
        if not _is_importable_file(file_path):
            continue
        content = _read_content(file_path)
        if content:
            _process_file_imports(file_path, content, root_dir, used_files)

    return used_files


def _is_importable_file(file_path: Path) -> bool:
    """Return True if the file should be scanned for import statements."""
    return file_path.suffix in SOURCE_EXTENSIONS


# ---------------------------------------------------------------------------
# Directory walking helpers
# ---------------------------------------------------------------------------


def _walk_all_files(root_dir: Path) -> List[Path]:
    """Walk the entire project tree, skipping SKIP_DIRS."""
    result = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for filename in filenames:
            result.append(Path(dirpath) / filename)
    return result


def _should_skip_source_dir(rel_dir: str) -> bool:
    """Return True if this directory is excluded from the unused-file check."""
    return any(
        rel_dir == ignored or rel_dir.startswith(ignored + "/")
        for ignored in IGNORED_SOURCE_DIRS
    )


def _is_eligible_source_file(filename: str, rel_file: str) -> bool:
    """Return True if a file should be included in the unused-file check."""
    if not filename.endswith(SOURCE_EXTENSIONS):
        return False
    if filename.endswith(TEST_TS_SUFFIX) or filename.endswith(".d.ts"):
        return False
    if rel_file in IGNORED_SOURCE_FILES:
        return False
    if CONFIG_PATTERN.search(filename):
        return False
    return True


def find_source_files(root_dir: Path) -> List[Path]:
    """Return all files that should be checked for unused status."""
    source_files = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        rel_dir = os.path.relpath(dirpath, root_dir)
        if _should_skip_source_dir(rel_dir):
            continue

        for filename in filenames:
            rel_file = str(Path(rel_dir) / filename)
            if not _is_eligible_source_file(filename, rel_file):
                continue

            file_path = root_dir / rel_file
            if filename == INDEX_TS and is_barrel_export(file_path):
                continue

            source_files.append(file_path)

    return source_files


# ---------------------------------------------------------------------------
# Entry points
# ---------------------------------------------------------------------------


def find_entry_points(root_dir: Path) -> Set[Path]:
    """Return files that are used without being explicitly imported."""
    entry_points: Set[Path] = {
        root_dir / "src/main.ts",
        root_dir / "src/App.vue",
        root_dir / "index.html",
        root_dir / "src/router/index.ts",
    }

    pages_dir = root_dir / "src/pages"
    if pages_dir.exists():
        for file_path in pages_dir.glob("*.vue"):
            entry_points.add(file_path)

    return entry_points


# ---------------------------------------------------------------------------
# Orphaned test detection
# ---------------------------------------------------------------------------


def _has_source_file(filenames: List[str], base_name: str) -> bool:
    """Return True if any source variant of base_name exists in the directory."""
    return any(base_name + ext in filenames for ext in SOURCE_EXTENSIONS)


def _should_skip_orphan_dir(rel_dir: str) -> bool:
    """Return True if orphaned test detection should skip this directory."""
    # e2e/  — Playwright tests; no .ts source counterpart expected
    # src/db/migrations/ — test file names don't match source file names
    #   (e.g. 001-create-entries.test.ts tests index.ts, not 001-create-entries.ts)
    skip = IGNORED_SOURCE_DIRS | frozenset({"e2e", "src/db/migrations"})
    return any(
        rel_dir == ignored or rel_dir.startswith(ignored + "/")
        for ignored in skip
    )


def find_orphaned_test_files(root_dir: Path) -> List[Path]:
    """Return test files that have no corresponding source file."""
    orphaned = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        rel_dir = os.path.relpath(dirpath, root_dir)
        if _should_skip_orphan_dir(rel_dir):
            continue

        for filename in filenames:
            if not filename.endswith(TEST_TS_SUFFIX):
                continue
            base_name = filename[: -len(TEST_TS_SUFFIX)]
            if not _has_source_file(filenames, base_name):
                orphaned.append(root_dir / rel_dir / filename)

    return sorted(orphaned)


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------


def find_unused_files(root_dir: Path) -> List[Path]:
    """Return source files that are not imported anywhere and are not entry points."""
    source_files = find_source_files(root_dir)
    used_files = find_used_files(root_dir)
    entry_points = find_entry_points(root_dir)

    unused = [
        f
        for f in source_files
        if f not in used_files and f not in entry_points
    ]

    orphaned = find_orphaned_test_files(root_dir)
    return sorted(set(unused) | set(orphaned))


def main() -> None:
    """Main entry point."""
    root_dir_str = sys.argv[1] if len(sys.argv) > 1 else "."
    root_dir = Path(root_dir_str).resolve()

    if not root_dir.is_dir():
        print(f"Error: {root_dir_str!r} is not a valid directory")
        sys.exit(1)

    print(f"Searching for unused files in: {root_dir}")
    print("-" * 60)

    unused_files = find_unused_files(root_dir)

    if unused_files:
        print(f"Found {len(unused_files)} potentially unused files:")
        print()
        for file_path in unused_files:
            rel_path = file_path.relative_to(root_dir)
            print(f"  {rel_path}")
        print()
        print("Note: Review each file carefully before deleting.")
        print("Some files may be used dynamically or indirectly.")
        sys.exit(1)
    else:
        print("All source files appear to be used!")
        sys.exit(0)


if __name__ == "__main__":
    main()

