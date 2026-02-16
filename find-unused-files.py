#!/usr/bin/env python3
"""
Find Unused Files Script

This script searches a repository for source files (.vue, .ts, .js files)
that are not imported anywhere in the codebase.

Usage:
    python find-unused-files.py [root_directory]

Arguments:
    root_directory: The directory to search (default: current directory '.')

Examples:
    # Search current directory
    python find-unused-files.py

    # Search specific directory
    python find-unused-files.py src/

Output:
    Lists all source files that are not imported anywhere.
    If all files are used, prints a success message.

Notes:
    - Source files: .vue, .ts, .js (excluding .test.ts, .d.ts)
    - Searches for import statements in all files
    - Resolves relative and absolute imports (@/ alias)
    - Skips directories: node_modules, .git, dist, build, playwright-report, test-results
    - Ignores: config files (*config*), scripts/, src/router/index.ts, src/main.ts, src/env.d.ts, src/App.vue
    - Entry points: files used without imports (pages, router, main files)
    - Temporary ignores: test/helpers, test/mocks, src/db, seed-data, src/shared/types (consider checking later)
    - This helps identify dead code and unused files
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Set, Optional


def find_export_in_barrel(barrel_file: Path, export_name: str) -> Optional[Path]:
    """
    Find the actual file being exported from a barrel export (index.ts).
    
    For example, if index.ts has "export { default as BaseSwitch } from './BaseSwitch.vue'",
    this will return the path to BaseSwitch.vue
    
    Args:
        barrel_file: Path to the barrel export file (index.ts)
        export_name: The name of the export being imported
        
    Returns:
        Path to the actual source file, or None if not found
    """
    try:
        with open(barrel_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, OSError):
        return None
    
    # Match: export { ... export_name ... } from "path"
    # Also match: export { default as export_name } from "path"
    # Also match: export { import_name as export_name } from "path"
    patterns = [
        # Default export as name: export { default as BaseSwitch } from './BaseSwitch.vue'
        rf'export\s+{{\s*default\s+as\s+{export_name}\s*}}\s+from\s+[\'"]([^\'"]+)[\'"]',
        # Named export: export { BaseSwitch } from './BaseSwitch.vue'
        rf'export\s+{{\s*{export_name}\s*}}\s+from\s+[\'"]([^\'"]+)[\'"]',
        # Named export with alias: export { SomeComponent as BaseSwitch } from '...'
        rf'export\s+{{\s*\w+\s+as\s+{export_name}\s*}}\s+from\s+[\'"]([^\'"]+)[\'"]',
    ]
    
    barrel_dir = barrel_file.parent
    
    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            exported_from = match.group(1)
            # Resolve the path relative to the barrel file
            target = barrel_dir / exported_from
            
            # Try as-is or with extensions
            if target.exists():
                return target
            for ext in ['.ts', '.vue', '.js']:
                candidate = target.parent / (target.name + ext)
                if candidate.exists():
                    return candidate
    
    return None


def resolve_import(importing_file: Path, import_path: str, root: Path) -> Optional[Path]:
    """
    Resolve an import path to an absolute file path.

    Args:
        importing_file: The file containing the import
        import_path: The import string (e.g., '@/modules/kanji', './KanjiForm')
        root: Root directory of the project

    Returns:
        Absolute Path to the imported file, or None if not found
    """
    src = root / 'src'

    if import_path.startswith('@/'):
        # Absolute import with @/ alias
        rel_path = import_path[2:]
        target = src / rel_path
    elif import_path.startswith('./') or import_path.startswith('../'):
        # Relative import
        importing_dir = importing_file.parent
        target = (importing_dir / import_path).resolve()
    else:
        # External import or node_modules, skip
        return None

    # If target is a directory, look for index.ts
    if target.is_dir():
        index_file = target / 'index.ts'
        if index_file.exists():
            return index_file
        return None

    # If target exists as-is, return it
    if target.exists():
        return target

    # Try adding common extensions
    for ext in ['.ts', '.vue', '.js']:
        candidate = target.parent / (target.name + ext)
        if candidate.exists():
            return candidate

    return None


def find_all_files(root_dir: Path) -> List[Path]:
    """
    Find all files in the project, excluding skipped directories.

    Args:
        root_dir: Root directory to search

    Returns:
        List of all file paths
    """
    all_files = []
    skip_dirs = {'node_modules', '.git', 'dist', 'build', 'playwright-report', 'test-results'}

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Remove directories we want to skip from dirnames to prevent traversal
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]

        for filename in filenames:
            all_files.append(Path(dirpath) / filename)

    return all_files


def is_barrel_export(file_path: Path) -> bool:
    """
    Check if a file is a barrel export (only contains export statements).
    
    Args:
        file_path: Path to the file to check
        
    Returns:
        True if the file is a barrel export
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, OSError):
        return False
    
    # Remove block comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    # Remove single-line comments
    content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
    # Remove whitespace and newlines
    content = ' '.join(content.split())
    
    # If file is empty after removing comments, it's not a barrel export
    if not content.strip():
        return False
    
    # Split by export statements and check each one
    # A barrel export file should only have export statements
    # Pattern: starts with export, then anything until next export or end
    parts = re.split(r'\bexport\b', content)
    
    # First part (before first export) should be empty
    if parts[0].strip():
        return False
    
    # Should have at least one export
    if len(parts) < 2:
        return False
    
    return True


def find_source_files(root_dir: Path) -> List[Path]:
    """
    Find source files that should be checked for usage.

    Args:
        root_dir: Root directory

    Returns:
        List of source file paths
    """
    source_files = []
    skip_dirs = {'node_modules', '.git', 'dist', 'build', 'playwright-report', 'test-results'}

    # Directories to ignore (don't check these files)
    ignored_dirs = {'scripts', 'ignore'}

    # Files to ignore (don't check these files) - relative paths
    ignored_files = {
        'eslint.config.ts',
        'playwright.config.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'stylelint.config.mjs',
        'tsconfig.json',
        'tsconfig.node.json',
        'src/router/index.ts',
        'src/main.ts',
        'src/env.d.ts',
        'src/App.vue',
        'test/setup.ts',
        'src/shared/components/index.ts',  # Barrel export for shared components
        'src/shared/composables/index.ts',  # Barrel export for shared composables
        'src/shared/validation/index.ts',  # Barrel export for shared validation
        'src/shared/components/SharedSection.vue',  # Future component, not yet integrated
        'src/base/components/index.ts',  # Barrel export for base components
        'src/base/composables/index.ts',  # Barrel export for base composables
    }

    # Files with 'config' in the name
    config_pattern = re.compile(r'config', re.IGNORECASE)

    # Temporary ignores (consider checking in future)
    temp_ignored_dirs = {
        'test/helpers',
        'test/mocks',
        'src/db',
        'src/shared/composables/seed-data',
        'src/shared/types',
        'src/shared/validation',  # Files re-exported through barrel export
        'src/api',  # API layer scaffolding (will be used in Phase 1)
    }
    temp_ignored_files = {
        'src/base/components/BaseBadge.vue',
        'src/base/components/BaseCombobox.vue',
        'src/base/components/BaseComboboxMulti.vue',
        'src/base/components/BaseDialog.vue',
        'src/base/components/BaseFileInput.vue',
        'src/base/components/BaseInput.vue',
        'src/base/components/BaseSelect.vue',
        'src/base/components/BaseSpinner.vue',
        'src/base/components/BaseSwitch.vue',
        'src/base/components/BaseTextarea.vue',
        'src/base/components/BaseToast.vue',
        'src/base/composables/use-debounce.ts',
        'src/router/routes.ts',
        'src/shared/composables/use-database-export.ts',
        'src/shared/composables/use-seed-data.ts',
        'src/shared/composables/use-theme.ts'
    }

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Remove directories we want to skip from dirnames to prevent traversal
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]

        # Get relative directory path
        rel_dir = os.path.relpath(dirpath, root_dir)

        # Skip ignored directories
        if any(rel_dir == ignored or rel_dir.startswith(ignored + '/') for ignored in ignored_dirs):
            continue
        if any(rel_dir == temp or rel_dir.startswith(temp + '/') for temp in temp_ignored_dirs):
            continue

        for filename in filenames:
            # Check if it's a source file (.vue, .ts, .js but not .test.ts, .d.ts)
            if filename.endswith(('.vue', '.ts', '.js')) and not filename.endswith(('.test.ts', '.d.ts')):
                # Get relative file path
                rel_file = str(Path(rel_dir) / filename)

                # Skip ignored files
                if rel_file in ignored_files:
                    continue

                # Skip temporarily ignored files
                if rel_file in temp_ignored_files:
                    continue

                # Skip config files
                if config_pattern.search(filename):
                    continue

                file_path = root_dir / rel_file
                
                # Skip barrel export files (index.ts with only export statements)
                if filename == 'index.ts' and is_barrel_export(file_path):
                    continue

                source_files.append(file_path)

    return source_files


def find_used_files(root_dir: Path) -> Set[Path]:
    """
    Find all files that are imported somewhere in the codebase.

    Args:
        root_dir: Root directory

    Returns:
        Set of absolute paths to files that are imported
    """
    used_files = set()
    all_files = find_all_files(root_dir)

    for file_path in all_files:
        if file_path.suffix in ['.ts', '.vue', '.js'] and not file_path.name.endswith('.test.ts'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except (UnicodeDecodeError, OSError):
                continue

            # Find all import statements (including named imports)
            # Pattern: import { Name1, Name2, ... } from "path"
            # Pattern: import Name from "path"
            # Pattern: import ... from "path"
            
            # First, extract all complete import statements
            import_lines = re.findall(r'import\s+[^;]*?from\s+[\'"]([^\'"]+)[\'"]', content, re.DOTALL)
            # Also match dynamic imports: import("path")
            dynamic_imports = re.findall(r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)', content)

            all_imports = import_lines + dynamic_imports

            # Also find named imports separately
            named_imports = re.findall(r'import\s*{([^}]+)}\s*from\s+[\'"]([^\'"]+)[\'"]', content, re.DOTALL)

            # Process regular imports
            for import_path in set(all_imports):
                resolved = resolve_import(file_path, import_path, root_dir)
                if resolved:
                    used_files.add(resolved)

            # Process named imports - resolve the barrel and the actual exports
            for imports_str, import_path in named_imports:
                resolved = resolve_import(file_path, import_path, root_dir)
                if resolved:
                    used_files.add(resolved)
                    
                    # If resolved to a barrel export (index.ts), find the actual source files
                    if resolved.name == 'index.ts' and resolved.exists():
                        # Extract individual import names
                        # Handle: "import as" pattern - the name after "as" is what we want
                        names = []
                        for part in imports_str.split(','):
                            part = part.strip()
                            if ' as ' in part:
                                # Format: "import as alias" - we want the alias
                                names.append(part.split(' as ')[-1].strip())
                            else:
                                # Just the name
                                names.append(part)
                        
                        # For each imported name, find its source in the barrel
                        for name in names:
                            if name:  # Skip empty names
                                source = find_export_in_barrel(resolved, name)
                                if source:
                                    used_files.add(source)

    return used_files


def find_entry_points(root_dir: Path) -> Set[Path]:
    """
    Find entry points - files that are used without being imported.

    Args:
        root_dir: Root directory

    Returns:
        Set of absolute paths to entry point files
    """
    entry_points = {
        root_dir / 'src/main.ts',
        root_dir / 'src/App.vue',
        root_dir / 'index.html',
    }

    # Add all pages (used by router)
    pages_dir = root_dir / 'src/pages'
    if pages_dir.exists():
        for file_path in pages_dir.glob('*.vue'):
            entry_points.add(file_path)

    # Add router
    router_file = root_dir / 'src/router/index.ts'
    if router_file.exists():
        entry_points.add(router_file)

    return entry_points


def find_orphaned_test_files(root_dir: Path) -> List[Path]:
    """
    Find test files that don't have a corresponding source file.

    Args:
        root_dir: Root directory

    Returns:
        List of orphaned test file paths (relative to root_dir)
    """
    orphaned = []
    skip_dirs = {'node_modules', '.git', 'dist', 'build', 'playwright-report', 'test-results'}

    # Directories to ignore
    ignored_dirs = {'scripts', 'ignore', 'e2e'}

    # Temporary ignores
    temp_ignored_dirs = {
        'test/helpers',
        'test/mocks',
        'src/db',
        'src/shared/composables/seed-data',
        'src/shared/types',
        'src/api',  # API layer scaffolding (will be used in Phase 1)
    }

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Remove directories we want to skip from dirnames to prevent traversal
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]

        # Get relative directory path
        rel_dir = os.path.relpath(dirpath, root_dir)

        # Skip ignored directories
        if any(rel_dir == ignored or rel_dir.startswith(ignored + '/') for ignored in ignored_dirs):
            continue
        if any(rel_dir == temp or rel_dir.startswith(temp + '/') for temp in temp_ignored_dirs):
            continue

        for filename in filenames:
            if filename.endswith('.test.ts'):
                # Get the base name without .test.ts
                base_name = filename[:-8]  # Remove '.test.ts'

                # Check for corresponding source files
                has_source = False
                for ext in ['.ts', '.vue', '.js']:
                    source_file = base_name + ext
                    if source_file in filenames:
                        has_source = True
                        break

                if not has_source:
                    orphaned.append(root_dir / rel_dir / filename)

    return sorted(orphaned)


def find_unused_files(root_dir: Path) -> List[Path]:
    """
    Find source files that are not imported anywhere.

    Args:
        root_dir: Root directory

    Returns:
        List of unused file paths (relative to root_dir)
    """
    source_files = find_source_files(root_dir)
    used_files = find_used_files(root_dir)
    entry_points = find_entry_points(root_dir)

    unused = []
    for file_path in source_files:
        if file_path not in used_files and file_path not in entry_points:
            unused.append(file_path)

    # Also find orphaned test files
    orphaned_tests = find_orphaned_test_files(root_dir)
    unused.extend(orphaned_tests)

    return sorted(unused)


def main():
    """Main entry point."""
    # Get root directory from command line or use current directory
    root_dir_str = sys.argv[1] if len(sys.argv) > 1 else '.'
    root_dir = Path(root_dir_str).resolve()

    if not root_dir.is_dir():
        print(f"Error: '{root_dir}' is not a valid directory")
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
        print("Note: This script may have false positives. Some files may be used")
        print("dynamically, through string concatenation, or in ways not detected.")
        print("Review each file carefully before deleting.")
        sys.exit(1)  # Exit with error code to indicate unused files found
    else:
        print("✅ All source files appear to be used!")
        sys.exit(0)


if __name__ == '__main__':
    main()