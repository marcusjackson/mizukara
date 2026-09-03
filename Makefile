# Makefile for Mizukara project
# Usage:
#   make lint                    # Full CI-style check (Prettier + ESLint + Stylelint + Types)
#   make lint-fix                # Apply all fixes (format + eslint + stylelint)
#   make lint FILES="path"       # Check specific files
#   make lint-fix FILES="path"   # Fix specific files
#   make type-check              # TypeScript type checking only
#   make test FILES="path"       # Run tests
#   make test-changed            # Run tests on changed files
#
# Individual tools (for targeted use):
#   make format / format-check   # Prettier
#   make eslint / eslint-check   # ESLint
#   make stylelint / stylelint-check  # Stylelint

# Define phony targets (not actual files)
.PHONY: check-node test test-e2e lint lint-fix check check-fix ci ci-full lint-changed lint-fix-changed check-changed check-fix-changed test-changed type-check format format-check eslint eslint-check stylelint stylelint-check check-unused check-untested dev build preview install clean

# =============================================================================
# File Patterns (defined once, used everywhere)
# =============================================================================
# These match the patterns in package.json scripts
JS_GLOB = './**/*.{js,ts,vue}'
PRETTIER_GLOB = './**/*.{js,ts,vue,css,scss,md,json}'
STYLE_GLOB = 'src/**/*.{css,vue}'

# Default to all files if FILES is not set
FILES ?= .

# File filters for different tools (when FILES is specified)
ESLINT_FILES = $(filter %.ts %.tsx %.js %.jsx %.vue,$(FILES))
PRETTIER_FILES = $(filter %.ts %.tsx %.js %.jsx %.vue %.css %.scss %.json %.md,$(FILES))
STYLELINT_FILES = $(filter %.css %.scss %.vue,$(FILES))

# Node version guard.
# package.json requires Node ^24.0.0. Running these targets on an older Node
# (a system install ahead of nvm on PATH, say) crashes corepack's pnpm shim with an
# opaque "TypeError: Invalid host defined options" that looks like a pnpm bug. Fail
# early with the actual cause instead. .nvmrc pins the version for `nvm use`.
check-node:
	@v=$$(node -v 2>/dev/null | sed 's/^v//'); \
	if [ -z "$$v" ]; then \
	  echo "error: node is not on PATH."; \
	  echo "       A non-interactive shell (an agent, a CI step, a fresh terminal) does not"; \
	  echo "       source nvm from your profile. Run:"; \
	  echo '         export NVM_DIR="$$HOME/.nvm" && . "$$NVM_DIR/nvm.sh" && nvm use'; \
	  exit 1; \
	fi; \
	maj=$${v%%.*}; \
	if [ "$$maj" -ge 24 ]; then exit 0; fi; \
	echo "error: Node $$v is too old — this project needs ^24.0.0."; \
	echo "       Run 'nvm use' (see .nvmrc), or 'nvm install 24' if it is not installed."; \
	exit 1

# =============================================================================
# Type Checking
# =============================================================================

# Type check (always full project - can't easily do per-file with vue-tsc)
type-check: check-node
	pnpm type-check

# =============================================================================
# Formatting (Prettier)
# =============================================================================

# Format files with fixes
format: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm prettier-fix-only $(PRETTIER_GLOB); \
	elif [ -n "$(PRETTIER_FILES)" ]; then \
		pnpm prettier-fix-only $(PRETTIER_FILES); \
	fi

# Format check (no fixes)
format-check: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm prettier-only $(PRETTIER_GLOB); \
	elif [ -n "$(PRETTIER_FILES)" ]; then \
		pnpm prettier-only $(PRETTIER_FILES); \
	fi

# =============================================================================
# ESLint (JS/TS/Vue)
# =============================================================================

# ESLint with fixes
eslint: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm eslint-fix-only $(JS_GLOB); \
	elif [ -n "$(ESLINT_FILES)" ]; then \
		pnpm eslint-fix-only $(ESLINT_FILES); \
	fi

# ESLint check (no fixes)
eslint-check: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm eslint-only $(JS_GLOB); \
	elif [ -n "$(ESLINT_FILES)" ]; then \
		pnpm eslint-only $(ESLINT_FILES); \
	fi

# =============================================================================
# Stylelint (CSS/SCSS/Vue styles)
# =============================================================================

# Stylelint with fixes
stylelint: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm stylelint-fix-only $(STYLE_GLOB); \
	elif [ -n "$(STYLELINT_FILES)" ]; then \
		pnpm stylelint-fix-only $(STYLELINT_FILES); \
	fi

# Stylelint check (no fixes)
stylelint-check: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm stylelint-only $(STYLE_GLOB); \
	elif [ -n "$(STYLELINT_FILES)" ]; then \
		pnpm stylelint-only $(STYLELINT_FILES); \
	fi

# =============================================================================
# Testing
# =============================================================================

# Run all tests
test: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm test; \
	else \
		pnpm test $(FILES); \
	fi

# Run E2E tests
test-e2e: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm test:e2e; \
	else \
		pnpm test:e2e $(FILES); \
	fi

# Visual regression tests (single, easy command)
test-e2e-vrt: check-node
	@echo "Running visual regression tests..."
	pnpm test:e2e:vrt

# =============================================================================
# Combined Commands (lint = CI-style check)
# =============================================================================

# Full CI-style lint check (matches pnpm lint behavior)
# Runs: Prettier check + ESLint check + Stylelint check + Type check + doc link check
lint:
	@echo "Running type check..."
	@$(MAKE) type-check
	@echo "Checking formatting (Prettier)..."
	@$(MAKE) format-check FILES="$(FILES)"
	@echo "Checking ESLint..."
	@$(MAKE) eslint-check FILES="$(FILES)"
	@echo "Checking Stylelint..."
	@$(MAKE) stylelint-check FILES="$(FILES)"
	@echo "Checking documentation links..."
	@python3 check-doc-links.py
	@echo "All lint checks complete!"

# Apply all fixes (format + eslint + stylelint)
lint-fix:
	@echo "Running type check..."
	@$(MAKE) type-check
	@echo "Fixing formatting (Prettier)..."
	@$(MAKE) format FILES="$(FILES)"
	@echo "Fixing ESLint issues..."
	@$(MAKE) eslint FILES="$(FILES)"
	@echo "Fixing Stylelint issues..."
	@$(MAKE) stylelint FILES="$(FILES)"
	@echo "All fixes applied!"

# Aliases for backwards compatibility
check: lint
check-fix: lint-fix

# CI commands
ci:
	$(MAKE) lint && $(MAKE) test && python3 find-unused-files.py && python3 find-untested-files.py

ci-full:
	$(MAKE) lint && $(MAKE) test && $(MAKE) test-e2e && $(MAKE) test-e2e-vrt && python3 find-unused-files.py && python3 find-untested-files.py

# =============================================================================
# Git-Changed File Commands
# =============================================================================

# Get changed files (staged and unstaged, excluding deleted)
# Falls back to staged changes (--cached) if HEAD doesn't exist (new repo)
changed_files = $(shell git diff --name-only --diff-filter=ACMRTUXB HEAD 2>/dev/null || git diff --name-only --diff-filter=ACMRTUXB --cached)

# Source files that might have tests (exclude test files themselves)
source_files = $(filter-out %.test.ts %.spec.ts, $(filter %.vue %.ts %.tsx %.js %.jsx, $(changed_files)))

# Generate test file paths from source files (assume .test.ts extension)
test_files_from_source = $(addsuffix .test.ts, $(basename $(source_files)))

# Changed test files
changed_test_files = $(filter %.test.ts %.spec.ts, $(changed_files))

# All test files to run (deduplicated)
test_files_to_run = $(sort $(test_files_from_source) $(changed_test_files))

# Run lint on changed files only (no fixes)
lint-changed:
	@if [ -n "$(changed_files)" ]; then \
		$(MAKE) lint FILES="$(changed_files)"; \
	else \
		echo "No changed files to check"; \
	fi

# Run lint-fix on changed files
lint-fix-changed:
	@if [ -n "$(changed_files)" ]; then \
		$(MAKE) lint-fix FILES="$(changed_files)"; \
	else \
		echo "No changed files to check"; \
	fi

# Aliases for backwards compatibility
check-changed: lint-changed
check-fix-changed: lint-fix-changed

# Run tests for changed files (including tests for changed source files)
test-changed: check-node
	@if [ -n "$(test_files_to_run)" ]; then \
		echo "Running tests: $(test_files_to_run)"; \
		existing_tests=""; \
		for f in $(test_files_to_run); do \
			if [ -f "$$f" ]; then \
				existing_tests="$$existing_tests $$f"; \
			fi; \
		done; \
		if [ -n "$$existing_tests" ]; then \
			pnpm test $$existing_tests; \
		else \
			echo "No test files found for changed files"; \
		fi; \
	else \
		echo "No test files to run"; \
	fi

# =============================================================================
# Development Server & Build
# =============================================================================

# Start development server
dev: check-node
	pnpm dev

# Build for production
build: check-node
	pnpm build

# Preview production build
preview: check-node
	pnpm preview

# Install dependencies
install: check-node
	pnpm install

# Remove build artifacts and caches
clean:
	rm -rf dist node_modules/.cache playwright-report test-results

# =============================================================================
# Audit Commands
# =============================================================================

# Check for unused files
check-unused:
	python3 find-unused-files.py

# Check for untested files
check-untested:
	python3 find-untested-files.py