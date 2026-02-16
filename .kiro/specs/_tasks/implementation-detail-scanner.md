# Task: Create Implementation Detail Scanner

## Context

The project has established "specs as living documentation" philosophy where specifications focus on contracts (WHAT/WHY) not implementation (HOW). We've implemented prevention layers (prompts, templates, rules) and cleanup workflows, but need an automated scanner to detect violations.

## Objective

Create an automated tool that scans specification files (`.kiro/specs/**/*.md`) and detects implementation details that should not be present.

## Requirements

### Detection Patterns

The scanner should flag:

1. **SQL Queries**: Full `CREATE TABLE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` statements
2. **Algorithm Pseudocode**: Step-by-step procedures (numbered lists with implementation steps)
3. **Function Bodies**: TypeScript/JavaScript function implementations (not just signatures)
4. **Configuration Values**: Hardcoded config objects with specific values
5. **Implementation Code**: Code blocks that show HOW rather than WHAT

### Allowed Patterns

The scanner should NOT flag:

- Function signatures and type definitions
- Contract descriptions (inputs, outputs, errors)
- Business rules and invariants
- References to implementation files ("See `createEntry()` in entry-mutations.ts")
- Examples of expected behavior
- Schema descriptions (not full SQL)

### Output Format

For each violation found:

```
🔧 Implementation Detail Found
File: .kiro/specs/feature-name/design-api.md
Line: 142
Type: SQL Query
Excerpt: SELECT MAX(order_position) as max_pos FROM entries...
Suggestion: Replace with contract description and reference to implementation file
```

Summary:

- Total files scanned: X
- Files with violations: Y
- Total violations found: Z
- Breakdown by type: SQL Queries (A), Algorithms (B), Function Bodies (C), etc.

## Implementation Approach

### Option 1: Python Script

Create `scripts/scan-spec-implementation-details.py`:

- Use regex patterns to detect violations
- Parse Markdown files and check code blocks
- Configurable patterns via config file
- Output to console or JSON file

### Option 2: Node.js Script

Create `scripts/scan-spec-implementation-details.ts`:

- Leverage existing project TypeScript setup
- Use Markdown parser (e.g., `remark`)
- Scan code blocks and detect patterns
- Integrate with existing tooling

### Option 3: ESLint Plugin

Create custom ESLint rule for Markdown files:

- Leverage ESLint infrastructure
- Run as part of `pnpm lint`
- Automatic fixing where possible
- Integrated with CI/CD

## Detection Patterns (Detailed)

### SQL Queries

**Pattern**: Code blocks with SQL keywords followed by full statements

```regex
CREATE TABLE|SELECT .* FROM|INSERT INTO|UPDATE .* SET|DELETE FROM
```

**Exclude**: References like "See migration file at `/src/db/migrations/...`"

### Algorithm Pseudocode

**Pattern**: Numbered lists with implementation steps (1., 2., 3.) that include:

- "Query", "Calculate", "Set", "If...then"
- Multiple sequential steps with implementation logic

**Exclude**: Business rule descriptions, acceptance criteria

### Function Bodies

**Pattern**: Code blocks with function implementations:

- Contains function keyword with body `function name() { ... }`
- Multiple lines of implementation logic
- Not just type signatures

**Exclude**: Type definitions, interfaces, function signatures without bodies

### Configuration Objects

**Pattern**: Code blocks with config objects containing literal values:

```regex
const config = \{[^}]+\}
```

**Exclude**: Type definitions, example request/response shapes

## Testing

Create test cases in `scripts/scan-spec-implementation-details.test.ts`:

1. **True Positives**: Files with known violations should be detected
2. **False Positives**: Valid contract descriptions should NOT be flagged
3. **Edge Cases**: Signatures vs bodies, references vs duplication

Test data:

- Create `test/fixtures/specs/` with sample spec files
- Include both clean and violating examples

## Integration

### Command Line

```bash
# Scan all specs
pnpm scan:specs

# Scan specific feature
pnpm scan:specs journal-core-mvp

# Output to JSON
pnpm scan:specs --json output.json

# Fail on violations (for CI)
pnpm scan:specs --strict
```

### Package.json

Add scripts:

```json
{
  "scripts": {
    "scan:specs": "node scripts/scan-spec-implementation-details.js",
    "scan:specs:strict": "node scripts/scan-spec-implementation-details.js --strict"
  }
}
```

### CI/CD Integration

Add to GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
- name: Scan specs for implementation details
  run: pnpm scan:specs --strict
```

## Documentation

Create `docs/spec-scanner.md`:

- Overview of scanner purpose
- Usage instructions
- How to add/modify detection patterns
- How to exclude false positives
- Integration with workflow

## Acceptance Criteria

- [ ] Scanner detects SQL queries in specs
- [ ] Scanner detects algorithm pseudocode
- [ ] Scanner detects function bodies (not just signatures)
- [ ] Scanner does NOT flag valid contract descriptions
- [ ] Scanner does NOT flag implementation references
- [ ] Clear output format with file, line, type, excerpt
- [ ] Command-line interface with options
- [ ] Test suite with coverage
- [ ] Documentation in `docs/`
- [ ] Integrated into `package.json` scripts
- [ ] Optional CI/CD integration guidance

## Success Metrics

After implementation:

- Can scan all specs in under 5 seconds
- Detect known violations in journal-core-mvp (should find 0 after cleanup)
- Zero false positives on clean specs
- Clear, actionable output for developers

## References

- [.kiro/steering/specs.md](../../.kiro/steering/specs.md) - Living documentation philosophy
- [.kiro/steering/spec-cleanup-strategy.md](../../.kiro/steering/spec-cleanup-strategy.md) - Prevention strategy
- [.kiro/settings/rules/implementation-detail-examples.md](../../.kiro/settings/rules/implementation-detail-examples.md) - Examples of violations
- [.github/instructions/spec-writing.instructions.md](../../.github/instructions/spec-writing.instructions.md) - Spec writing guidelines

## Priority

**Medium**: This is a quality-of-life tool for maintaining clean specs. The prevention layers (prompts, design review) are primary. Scanner provides automated verification and CI integration.

## Estimated Effort

- Research and design: 1-2 hours
- Implementation: 3-4 hours
- Testing: 1-2 hours
- Documentation: 1 hour
- Total: **6-9 hours**

---

**Created**: 2026-02-11
**Status**: Not Started
**Assigned To**: Future Session
