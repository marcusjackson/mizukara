# Spec Cleanup Strategy

Project strategy for preventing implementation details in specifications.

## Core Philosophy

**Prevention First, Not Cleanup Later**

Implementation details should NOT be generated in design documents in the first place. Cleanup is a safety net for rare leaks, not the primary strategy.

## Why This Matters

### Technical Debt

Generating implementation details in specs creates technical debt:

- **Duplication**: Same information in specs and code
- **Drift Risk**: Changes require updates in both places
- **Maintenance Burden**: More files to update for each change

### Living Documentation

Specs should remain clean throughout their lifecycle:

- Pre-implementation: Clean contracts guide implementation
- During implementation: Specs remain reference for behavior
- Post-implementation: Specs serve as living documentation
- Maintenance: Specs updated first, then code follows

### AI-Assisted Development

Clean specs enable better AI assistance:

- **Context Windows**: Specs (few thousand lines) fit in AI context
- **Intent Over Code**: AI reasons better from contracts than implementation
- **Spec-First Updates**: Update spec → AI generates code is more reliable

## Prevention Layers

### Layer 1: Design Generation (`/kiro-spec-design`)

**Prompt Enforcement**:

- Explicit prohibitions against SQL queries, algorithms, pseudocode
- Critical constraints section defines what to include/exclude
- AI validates generated content before finalizing

**Template Guidance**:

- Physical Data Model section guides toward references, not duplication
- Implementation Notes renamed to "Integration & Constraints" (contract-focused)
- Examples show referencing pattern, not code duplication

**Result**: Design documents generated clean from the start

### Layer 2: Design Review (`/kiro-validate-design`)

**Review Criteria**:

- Living Documentation Compliance added as 5th core criterion
- Checks for SQL queries, algorithms, step-by-step procedures
- Flags implementation details as critical issues

**Blocking Approval**:

- Design cannot be approved with implementation details present
- NO-GO decision until specs are cleaned
- Must replace with contract descriptions + file references

**Result**: Human review catches violations before implementation starts

### Layer 3: Design Finalization (`/kiro-spec-finalize`)

**Safety Net Role**:

- Post-implementation check for details that leaked through
- Reconciles specs with as-built state
- Final cleanup before maintenance phase

**Not Primary Strategy**:

- Used only when prevention layers failed
- Not for regular cleanup of intentionally generated details
- Indicates earlier prevention needs strengthening

**Result**: Final verification specs are clean before maintenance

## Prevention vs Cleanup Workflow

### ✅ Correct Workflow

```
1. Generate Requirements → No implementation details
2. Generate Design → Contracts only, references to implementation
3. Design Review → Verify clean, block if violations found
4. Implement → Code defines HOW
5. Finalize → Check for leaks (rare), final verification
```

**Characteristics**:

- Prevention at generation time
- Verification at review time
- Cleanup as rare exception

### ❌ Wrong Workflow

```
1. Generate Requirements → No implementation details
2. Generate Design → Include SQL, algorithms (WRONG)
3. Implement → Code duplicates spec content
4. Finalize → Clean up implementation details (band-aid)
```

**Problems**:

- Creates maintenance burden
- Specs and code drift
- Cleanup becomes regular chore
- Prevention layers unutilized

## What Belongs Where

### Specs (WHAT/WHY)

✅ Function signatures and contracts
✅ Input/output data shapes
✅ Business rules and invariants
✅ Error conditions and strategies
✅ Expected behaviors and examples
✅ Component responsibilities
✅ Design decisions and rationale

### Code (HOW)

✅ SQL queries and database operations
✅ Algorithm implementations
✅ Step-by-step procedures
✅ Function bodies and logic
✅ Performance optimizations
✅ Configuration values

### Migration Files (SCHEMA)

✅ CREATE TABLE definitions
✅ ALTER TABLE statements
✅ Index creation
✅ Constraint definitions

### Research Files (INVESTIGATION)

✅ Technology comparisons
✅ Pattern evaluations
✅ Benchmark results
✅ Decision rationale details

## When Prevention Fails

If implementation details appear in specs despite prevention:

### During Design Review

1. **Identify**: SQL, algorithms, pseudocode, step-by-step procedures
2. **Flag**: Mark as critical issue in review
3. **Replace**: Contract descriptions + file references
4. **Block**: NO-GO decision until cleaned

### During Finalization

1. **Scan**: Check all spec files for implementation details
2. **Extract**: Move to `research.md` if valuable context
3. **Replace**: Contract descriptions with references
4. **Document**: Note where prevention failed for improvement

### Root Cause Analysis

When cleanup is needed frequently:

- **Review prompts**: Are prohibitions clear enough?
- **Review templates**: Do they guide toward contracts?
- **Review process**: Is design review catching violations?
- **Strengthen prevention**: Update prompts/templates/rules

## Success Metrics

### Clean Specs Indicators

✅ No SQL queries in design documents
✅ No algorithm pseudocode or step-by-step procedures
✅ Schema definitions referenced, not duplicated
✅ Contracts clear without implementation details
✅ File references instead of code duplication

### Prevention Working

✅ Design review rarely finds implementation details
✅ Finalization finds zero violations
✅ Specs maintainable as living documentation
✅ AI can reason from specs without reading code

### Prevention Failing

❌ Design review consistently finds violations
❌ Finalization finds many issues
❌ Specs require cleanup after each implementation
❌ Maintenance updates require spec + code changes

## Integration with Workflow

### Commands and Their Role

**`/kiro-spec-design`** → Prevention

- Generates clean design contracts
- Validates content before finalizing
- Primary prevention mechanism

**`/kiro-validate-design`** → Verification

- Reviews design quality
- Checks for implementation details
- Blocks approval if violations found

**`/kiro-spec-finalize`** → Safety Net

- Post-implementation verification
- Catches rare leaks
- Not for regular cleanup

### Workflow Integration

- **Before implementation**: Prevention + verification ensure clean specs
- **During implementation**: Specs remain reference for contracts
- **After implementation**: Safety net catches rare violations
- **During maintenance**: Specs updated first, code follows

## Related Documentation

- [.kiro/steering/specs.md](specs.md) - Specifications as living documentation philosophy
- [.github/instructions/spec-writing.instructions.md](../../.github/instructions/spec-writing.instructions.md) - Spec writing guidelines
- [.kiro/settings/rules/design-principles.md](../settings/rules/design-principles.md) - Design vs implementation principles
- [.kiro/settings/rules/implementation-detail-examples.md](../settings/rules/implementation-detail-examples.md) - Concrete examples

---

_Created: 2026-02-11_  
_Purpose: Define project strategy for preventing implementation details in specifications_
