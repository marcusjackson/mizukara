---
applyTo: '**/.kiro/specs/**'
---

# Specification Writing Guidelines

Guidelines for writing clear, maintainable specification documents in `.kiro/specs/`.

## Purpose of Specifications

Specifications define **what** to build and **why**, not **how** to build it.

**Specs answer**:

- What problem does this solve?
- What are the requirements?
- What are the contracts and interfaces?
- What are the business rules and constraints?
- What are the expected behaviors and outcomes?

**Code answers**:

- How is this implemented?
- What algorithms are used?
- What are the performance optimizations?
- What are the implementation details?

## Specs Lifecycle

Specs evolve through four phases:

**Pre-Implementation**: Define requirements, design contracts, generate tasks
**During Implementation**: Reference for contracts and acceptance criteria
**Post-Implementation**: Reconcile with as-built state, clean up any implementation details
**Maintenance**: Living documentation - update specs FIRST before changing contracts

**Key Principle**: Specs are **living documentation**, not temporary scaffolding. They remain the source of truth for "WHY" and "WHAT" throughout the project's life.

See [.kiro/steering/specs.md](../../.kiro/steering/specs.md) for project philosophy on specs.

## Keep Implementation Out of Specs

**Critical**: Implementation details should NOT be generated in design documents in the first place. Design review is the safety net, not the primary strategy.

### ❌ Don't Include in Specs

- Detailed SQL queries, algorithm pseudocode, step-by-step procedures
- Line-by-line implementation instructions, TypeScript function bodies
- Specific code structure or file organization details

### ✅ Do Include in Specs

- Function signatures and contracts, input/output data shapes
- Business rules, invariants, error conditions and strategies
- Expected behavior examples, component responsibilities
- API contracts and interfaces

### Cleanup During Design Review

If implementation details appear in specs:

**When to Clean**: During design review phase (before implementation starts)
**How to Clean**: Extract algorithms to `research.md`, reference migration files for SQL
**Replace With**: Contract descriptions + references to implementation files (e.g., "See `createEntry()` in entry-mutations.ts")

## Prevention vs Cleanup Strategy

### The Right Approach: Prevention First

Implementation details should NOT be generated in design documents in the first place. The workflow prevents violations at multiple stages:

**Design Generation Phase** (`/kiro-spec-design`) → Enforce "no implementation details" via:

- Prompts with explicit prohibitions against SQL, algorithms, pseudocode
- Templates that guide toward contracts and references, not code duplication
- AI instructions to validate content and remove implementation details before finalizing

**Design Review Phase** (`/kiro-validate-design`) → Catch and fix before implementation:

- Review criteria includes checking for implementation details
- Scan for SQL queries, algorithms, step-by-step procedures
- Flag violations as critical issues requiring cleanup before approval
- Replace with contract descriptions + file references
- Block design approval until specs are clean

**Finalization Phase** (`/kiro-spec-finalize`) → Safety net only:

- Post-implementation check for details that leaked through
- Reconcile specs with as-built state
- Final cleanup before maintenance phase
- **Not for regular cleanup** of intentionally generated details

### The Wrong Approach: Generate Then Clean

❌ **Don't**: Generate detailed SQL/algorithms in design → Clean up later via finalize

This creates technical debt and maintenance burden. Specs and code diverge, requiring dual updates.

✅ **Do**: Generate contracts only → Design review verifies → Implement → Finalize checks for leaks

This maintains specs as true living documentation from the start.

### Why Prevention Matters

**Single source of truth**: Implementation details live in code, contracts in specs
**Less maintenance**: No need to update specs when implementation optimizes
**Clear boundaries**: Specs define WHAT, code defines HOW
**Better AI assistance**: Clean specs fit in AI context windows, messy code doesn't
**Faster onboarding**: New developers understand intent without reading all code

## Examples

### Bad (Too Much Implementation Detail)

````markdown
**Position Initialization Algorithm**:

1. Query maximum `order_position` for the assigned day:
   ```sql
   SELECT MAX(order_position) as max_pos FROM entries
   WHERE assigned_day = ? AND is_deleted = 0
   ```
````

2. If `max_pos` is NULL (no entries for that day), set `order_position = 0`
3. Otherwise, set `order_position = max_pos + 1`
4. Insert the entry using parameterized query with these exact field names

````

**Problem**: This is implementation documentation, not specification. It belongs in code comments.

### Good (Contract-Focused)

```markdown
**Position Assignment Contract**:

- New entries are automatically appended to the end of the day's list
- First entry in a day receives position 0
- Subsequent entries receive position max + 1
- Positions are independent per day (each day starts from 0)
- Soft-deleted entries do not affect new position calculation

**Implementation**: See `createEntry()` in `entry-mutations.ts`
````

**Why Better**: Describes behavior and rules without prescribing implementation.

## Reference Implementation, Don't Duplicate

When specs need to reference schema, configuration, or implementation:

### ❌ Don't Duplicate Code

````markdown
**Database Schema**:

```sql
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  assigned_day TEXT NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_entries_assigned_day
  ON entries(assigned_day, is_deleted, order_position);
```
````

````

**Problem**: Duplicating schema creates maintenance burden. Changes require updating both spec and migration files.

### ✅ Reference the Source File

```markdown
**Database Schema**:

**Location**: `/src/db/migrations/001-create-entries.sql`

**Key fields**:
- `id` (TEXT, PK) - UUID v4 identifier
- `content` (TEXT, NOT NULL) - Entry content (any length)
- `created_at` (INTEGER, NOT NULL) - Creation timestamp (Unix ms)
- `assigned_day` (TEXT, NOT NULL) - ISO date (YYYY-MM-DD)
- `order_position` (INTEGER, DEFAULT 0) - Position within day
- `is_deleted` (INTEGER, DEFAULT 0) - Soft delete flag

**Indexes**:
- Composite index on (assigned_day, is_deleted, order_position) for day queries
- Index on is_deleted for filtered queries

See migration file for complete definition and implementation.
````

**Why Better**: Single source of truth. Spec describes purpose, migration defines implementation.

## Terminology Consistency

Pick one term per concept. Match code language (if code uses `Entry`, specs use "entry"). Update all specs when terminology evolves.

**❌ Inconsistent**: "journal item" / "record entry" / "note" across different specs
**✅ Consistent**: "entry" everywhere, `Entry` in code, `entries` table

## Specification Structure

**Requirements**: What users need and why (objectives, acceptance criteria, business rules)
**Design**: Component responsibilities and contracts (input/output, errors, rules, reference to implementation)

## When to Update Specs

### Development Phase

- **During planning**: Write/update specs before implementation
- **Contract changes**: Update interfaces, parameters, return types
- **Requirement/behavior changes**: Update criteria and examples

### Maintenance Phase

**Spec-First Workflow**: When changing contracts or requirements during maintenance, update spec FIRST, then implement changes.

**Why**: Specs as source of truth enable AI-assisted updates and maintain project clarity.

### Don't Update For

- Internal refactoring (no contract changes)
- Performance optimizations (same external behavior)
- Code style changes (unless public API)
- Bug fixes (unless spec changes)

## Language and Style

**Be Precise**: Specify formats (YYYY-MM-DD), validation rules, error types
**Use Domain Language**: Focus on business concepts, add technical details as needed
**Active Voice**: "User creates entries" not "Entries are created by the user"

## Specs as Living Documentation

Post-implementation, specs remain the source of truth for:

**Contracts & Requirements**: What the system does and why
**AI-Assisted Maintenance**: Concise specs fit in AI context windows; full codebases often don't
**Onboarding**: New developers understand intent without reading all code
**Compliance & History**: Audit trail of decisions and evolution

Specs capture "WHY" and "WHAT". Code captures "HOW". Both are maintained.

## Spec Review Checklist

Before finalizing:

- [ ] Focuses on what/why, not how
- [ ] Uses consistent terminology
- [ ] References implementation, doesn't duplicate
- [ ] Clear contracts and business rules
- [ ] Free of algorithms, SQL, pseudocode
- [ ] Suitable as living documentation

---

_Created: 2026-02-11_  
_Updated: 2026-02-11_  
_Purpose: Guide specification writing for .kiro/specs/ documents_
