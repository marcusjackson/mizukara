# Makefile for Mizukara project
# Usage:
#   make lint                    # Full CI-style check (Prettier + ESLint + Stylelint + Types)
#   make lint-fix                # Apply all fixes (format + eslint + stylelint)
#   make lint FILES="path"       # Check specific files
#   make lint-fix FILES="path"   # Fix specific files
#   make type-check              # TypeScript type checking only
#   make test FILES="path"       # Run tests
#   make test-changed            # Run unit tests related to the changed paths (alias of test-related)
#   make e2e-related             # Run only the e2e specs and VRT files the changed paths map to (e2e/targets.map)
#   make test-e2e / test-e2e-vrt # Full e2e / full visual regression suite
#
# Individual tools (for targeted use):
#   make format / format-check   # Prettier
#   make eslint / eslint-check   # ESLint
#   make stylelint / stylelint-check  # Stylelint

# Define phony targets (not actual files)
.PHONY: check-node check-docs check-links test test-coverage test-e2e test-e2e-production lint lint-fix check check-fix ci ci-full pre-push test-related e2e-related check-e2e-map lint-changed lint-fix-changed check-changed check-fix-changed test-changed type-check format format-check eslint eslint-check stylelint stylelint-check check-unused check-untested dev build preview install clean

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

# fleet:begin check-node sha=2f6998ed22 | machine-written; edit the source, not this region
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
# fleet:end check-node

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

# Run all tests with coverage thresholds enforced (vitest.config.ts)
test-coverage: check-node
	pnpm test:coverage

# Run E2E tests (local: capped workers, this machine can't run full parallelism)
test-e2e: check-node
	@if [ "$(FILES)" = "." ]; then \
		pnpm test:e2e:local; \
	else \
		pnpm test:e2e:local $(FILES); \
	fi

# Visual regression tests (single, easy command)
test-e2e-vrt: check-node
	@echo "Running visual regression tests..."
	pnpm test:e2e:vrt

# Checks that need a production build (network origins). Downloads the model,
# so it is not part of ci or ci-full.
test-e2e-production: check-node
	pnpm test:e2e:production

# =============================================================================
# Combined Commands (lint = CI-style check)
# =============================================================================

# Full CI-style lint check (matches pnpm lint behavior)
# Runs: Prettier check + ESLint check + Stylelint check + Type check + CSS variable check + doc link check
lint:
	@echo "Running type check..."
	@$(MAKE) type-check
	@echo "Checking formatting (Prettier)..."
	@$(MAKE) format-check FILES="$(FILES)"
	@echo "Checking ESLint..."
	@$(MAKE) eslint-check FILES="$(FILES)"
	@echo "Checking Stylelint..."
	@$(MAKE) stylelint-check FILES="$(FILES)"
	@echo "Checking CSS custom properties..."
	@node scripts/check-css-vars.mjs
	@echo "Checking documentation links..."
	@node scripts/check-links.mjs
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
# fleet:begin docs-gate-detect sha=3642bd5ef7 | machine-written; edit the source, not this region
# Path-scoped gate. Every path this branch changes against origin/develop (committed, uncommitted and
# untracked, deletions included) is classified, and the gate runs only what those paths can break.
# Default-deny: a path no set claims counts as "other" and runs everything. FULL=1 runs everything.
#   DOCS_PATHS  paths no test, linter or type-checker reads: only format, links and DOCS_EXTRA run.
#   UNIT_PATHS  paths the unit suite (and its coverage and unused/untested scans) can break; a repo sets them.
#   E2E_PATHS   paths the end-to-end suite can break; a repo sets them.
GATE_BASE ?= origin/develop
DOCS_PATHS ?= %.md .gitignore .gitattributes LICENSE% docs/% .claude/% .github/%
UNIT_PATHS ?=
E2E_PATHS ?=
gate_paths = $(shell { git rev-parse -q --verify $(GATE_BASE) >/dev/null || echo no-base; \
  git diff --no-renames --name-only $(GATE_BASE)...HEAD; git diff --no-renames --name-only HEAD; \
  git ls-files --others --exclude-standard; } 2>/dev/null | sort -u)
gate_other = $(filter-out $(DOCS_PATHS) $(UNIT_PATHS) $(E2E_PATHS),$(gate_paths))
docs_only = $(if $(FULL),,$(if $(strip $(gate_paths)),$(if $(filter-out $(DOCS_PATHS),$(gate_paths)),,yes)))
not_docs = $(if $(docs_only),,yes)
gate_all = $(if $(or $(FULL),$(strip $(gate_other)),$(if $(strip $(gate_paths)),,x)),yes)
run_unit = $(if $(or $(gate_all),$(strip $(filter $(UNIT_PATHS),$(gate_paths)))),yes)
run_e2e = $(if $(or $(gate_all),$(strip $(filter $(E2E_PATHS),$(gate_paths)))),yes)
gate_tier = $(if $(docs_only),docs,$(if $(and $(run_unit),$(run_e2e)),full,$(if $(run_unit),unit,e2e)))
gate_counts = docs:$(words $(filter $(DOCS_PATHS),$(gate_paths))) unit:$(words $(filter $(UNIT_PATHS),$(gate_paths))) e2e:$(words $(filter $(E2E_PATHS),$(gate_paths))) other:$(words $(gate_other))
# Step bookkeeping. $(call gate_step,name,command) runs and records a step, $(call gate_skip,name,reason)
# records a skip, and gate_summary prints the one line a session reads in place of the log:
#   GATE-SUMMARY tier=unit ran=lint,test-coverage skipped=test-e2e paths=docs:0 unit:3 e2e:0 other:0
# The records come from what actually executed, so a dispatch bug shows up as a mismatch.
GATE_TMP = $${TMPDIR:-/tmp}/gate.$$PPID
define gate_begin
@rm -f $(GATE_TMP).ran $(GATE_TMP).skip
endef
define gate_step
@echo "$(1)" >> $(GATE_TMP).ran; $(2)
endef
define gate_skip
@echo "$(1)" >> $(GATE_TMP).skip; echo "Skipping $(1): $(2). FULL=1 runs everything."
endef
# $(call gate_do,name,condition,command,skip reason): run and record the step when the condition is non-empty.
define gate_do
$(if $(2),$(call gate_step,$(1),$(3)),$(call gate_skip,$(1),$(4)))
endef
define gate_summary
@R=$$(paste -sd, $(GATE_TMP).ran 2>/dev/null); S=$$(paste -sd, $(GATE_TMP).skip 2>/dev/null); \
  echo "GATE-SUMMARY tier=$(gate_tier) ran=$${R:-none} skipped=$${S:-none} paths=$(gate_counts)"; \
  rm -f $(GATE_TMP).ran $(GATE_TMP).skip
endef
# fleet:end docs-gate-detect

# Path classes for this repo (see the gate block above). A path in neither set runs the full gate.
UNIT_PATHS = src/% test/% vitest.config.ts tsconfig.test.json
E2E_PATHS = src/% e2e/% playwright%.config.ts tsconfig.e2e.json

ci:
	$(gate_begin)
	$(if $(docs_only),$(call gate_step,check-docs,$(MAKE) check-docs))
	$(call gate_do,lint,$(not_docs),$(MAKE) lint,only docs paths changed)
	$(call gate_do,check-e2e-map,$(and $(not_docs),$(run_e2e)),$(MAKE) check-e2e-map,no e2e-suite paths changed)
	$(call gate_do,test-coverage,$(and $(not_docs),$(run_unit)),$(MAKE) test-coverage,no unit-suite paths changed)
	$(call gate_do,find-unused,$(and $(not_docs),$(run_unit)),python3 find-unused-files.py,no unit-suite paths changed)
	$(call gate_do,find-untested,$(and $(not_docs),$(run_unit)),python3 find-untested-files.py,no unit-suite paths changed)
	$(gate_summary)

# Quick tier for the pre-push hook (.githooks/pre-push): lint plus the tests related to the pushed paths.
# The coverage run, unused/untested scans and e2e stay in `ci`, the merge gate.
push_src = $(wildcard $(filter src/%.ts src/%.tsx src/%.vue src/%.js test/%.ts,$(gate_paths)))
push_test = $(if $(filter vitest.config.ts tsconfig.test.json,$(gate_paths)),pnpm test,pnpm exec vitest related --run $(push_src))
pre-push:
	$(gate_begin)
	$(if $(docs_only),$(call gate_step,check-docs,$(MAKE) check-docs))
	$(call gate_do,lint,$(not_docs),$(MAKE) lint,only docs paths changed)
	$(call gate_do,check-e2e-map,$(and $(not_docs),$(run_e2e)),$(MAKE) check-e2e-map,no e2e-suite paths changed)
	$(call gate_do,test-related,$(and $(not_docs),$(or $(push_src),$(filter vitest.config.ts tsconfig.test.json,$(gate_paths)))),$(MAKE) test-related,no source paths changed)
	$(call gate_skip,merge-gate-only,pre-push skips coverage and the unused/untested scans; make ci runs them)
	$(gate_summary)

# fleet:begin docs-gate-target sha=cfca3865e0 | machine-written; edit the source, not this region
# What markdown can break. DOCS_EXTRA names further targets to run (a repo whose convention
# text is inlined into .claude/rules/ sets DOCS_EXTRA = check-rules, since a convention .md
# feeds that generated text).
check-docs: check-node
	@$(MAKE) format-check FILES="$(wildcard $(gate_paths))"
	@$(MAKE) check-links
	@for t in $(DOCS_EXTRA); do $(MAKE) $$t || exit 1; done
# fleet:end docs-gate-target

check-links: check-node
	node scripts/check-links.mjs

ci-full:
	$(gate_begin)
	$(if $(docs_only),$(call gate_step,check-docs,$(MAKE) check-docs))
	$(call gate_do,lint,$(not_docs),$(MAKE) lint,only docs paths changed)
	$(call gate_do,check-e2e-map,$(and $(not_docs),$(run_e2e)),$(MAKE) check-e2e-map,no e2e-suite paths changed)
	$(call gate_do,test-coverage,$(and $(not_docs),$(run_unit)),$(MAKE) test-coverage,no unit-suite paths changed)
	$(call gate_do,test-e2e,$(and $(not_docs),$(run_e2e)),$(MAKE) test-e2e,no e2e-suite paths changed)
	$(call gate_do,test-e2e-vrt,$(and $(not_docs),$(run_e2e)),$(MAKE) test-e2e-vrt,no e2e-suite paths changed)
	$(call gate_do,find-unused,$(and $(not_docs),$(run_unit)),python3 find-unused-files.py,no unit-suite paths changed)
	$(call gate_do,find-untested,$(and $(not_docs),$(run_unit)),python3 find-untested-files.py,no unit-suite paths changed)
	$(gate_summary)

# =============================================================================
# Git-Changed File Commands
# =============================================================================

# Get changed files (staged and unstaged, excluding deleted)
# Falls back to staged changes (--cached) if HEAD doesn't exist (new repo)
changed_files = $(shell git diff --name-only --diff-filter=ACMRTUXB HEAD 2>/dev/null || git diff --name-only --diff-filter=ACMRTUXB --cached)

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

# Unit tests related to the changed paths (committed, staged and unstaged), found by import graph.
# This is the pre-push test step; a change to the vitest config runs the whole suite.
test-related: check-node
	@if [ -n "$(strip $(push_src) $(filter vitest.config.ts tsconfig.test.json,$(gate_paths)))" ]; then \
		$(push_test); \
	else \
		echo "No source paths changed"; \
	fi

test-changed: test-related

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

# fleet:begin hooks-target sha=197971d12b | machine-written; edit the source, not this region
# Point git at the tracked hooks. core.hooksPath is local config, so each clone runs this once.
install-hooks:
	git config core.hooksPath .githooks
# fleet:end hooks-target

# fleet:begin e2e-related-target sha=1a424bc223 | machine-written; edit the source, not this region
# Targeted e2e and VRT: run only what the changed paths can break (map: e2e/targets.map).
#   make e2e-related            run the specs and VRT files the changes map to
#   make e2e-related UPDATE=1   same, regenerating the VRT baselines it ran
#   make e2e-related DRY=1      print the playwright commands without running them
e2e-related: check-node
	@node scripts/e2e-related.mjs run --base $(GATE_BASE) $(if $(UPDATE),--update) $(if $(DRY),--dry)

# Every e2e file is named in the map, and every map rule still points at something.
check-e2e-map: check-node
	@node scripts/e2e-related.mjs check
# fleet:end e2e-related-target
