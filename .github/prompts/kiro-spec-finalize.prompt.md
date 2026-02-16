---
agent: 'agent'
description: Review and finalize specification as living documentation
---

<meta>
description: Review and finalize specification as living documentation
argument-hint: <feature-name:$1>
</meta>

# Specification Finalization

<background_information>

- **Mission**: Review completed specification and ensure it's ready as living documentation (free of implementation details, focused on contracts)
- **Success Criteria**:
  - Specs focus on "WHAT" and "WHY", not "HOW"
  - No implementation details (algorithms, SQL, pseudocode)
  - Clear contracts, business rules, and requirements
  - Ready for maintenance phase (spec-first workflow)
    </background_information>

<instructions>
## Core Task
Review specification for feature **$1** and finalize as living documentation after implementation completes.

## When to Use

Run this command after:

- `/kiro-validate-impl` passes (implementation validated)
- All tasks marked complete
- Before moving to maintenance phase

**Purpose**: Ensure specs remain clean, contract-focused living documentation rather than implementation instructions.

**Note**: Per living documentation philosophy, implementation details should NOT be generated during design phase. This command is a **safety net** for cleanup if details leaked through, not the primary prevention strategy. Better approach: prevent during design generation (`/kiro-spec-design`) and catch during design validation (`/kiro-validate-design`).

## Execution Steps

### Step 1: Load Context

- Read `.kiro/specs/$1/spec.json` for metadata
- Read all spec files: `requirements.md`, `design.md`, `tasks.md`
- Load steering context from `.kiro/steering/specs.md` for living documentation principles
- Load rules from `.kiro/settings/rules/spec-writing.instructions.md`

### Step 2: Scan for Implementation Details

Search spec files for:

**❌ Implementation details to remove**:

- Detailed SQL queries (e.g., `SELECT MAX(order_position)...`)
- Algorithm pseudocode or step-by-step procedures
- Line-by-line implementation instructions
- TypeScript function bodies
- Specific code structure details (file organization, import statements)

**✅ Contract-focused content to keep**:

- Function signatures and contracts
- Input/output data shapes
- Business rules and invariants
- Error conditions and handling strategies
- Expected behavior examples
- Component responsibilities

### Step 3: Identify Issues

For each implementation detail found:

```
🔧 **Issue**: [Type - e.g., "SQL query in design"]
**Location**: [File and section]
**Current**: [Brief excerpt of problematic content]
**Suggested**: [Contract-focused replacement]
```

### Step 4: Provide Replacements

For each issue, provide exact replacement text:

- Remove or condense implementation details
- Replace with contract descriptions
- Add references to implementation files (e.g., "See `createEntry()` in entry-mutations.ts")
- Maintain clarity and completeness of contracts

### Step 5: Generate Report

Create finalization report in the language specified in spec.json:

1. **Finalization Summary**: Overall assessment of spec quality
2. **Issues Found**: List implementation details to address (if any)
3. **Proposed Changes**: Specific replacements for each issue
4. **Readiness**: GO (ready as living docs) / NEEDS CLEANUP (revisions required)
5. **Next Steps**: What to do next

## Important Constraints

- **Preserve requirements**: Don't remove acceptance criteria or business rules
- **Preserve contracts**: Keep interface definitions, inputs/outputs, errors
- **Focus on HOW not WHAT**: Remove "how to implement", keep "what it does"
- **Reference, don't duplicate**: Point to code files instead of duplicating code
- **Maintain completeness**: Ensure specs remain complete for their purpose

## What NOT to Remove

- Requirements and acceptance criteria
- Business rules and invariants
- Component responsibilities and boundaries
- Contract definitions (inputs, outputs, errors)
- Architectural decisions and rationale
- Examples of expected behavior

</instructions>

## Tool Guidance

- **Read**: Load all spec files and steering/rules for context
- **Grep**: Search for patterns indicating implementation details
- **List examples**: Show before/after for each issue

## Output Description

Provide report in the language specified in spec.json with:

### 1. Finalization Summary (2-3 sentences)

Overall assessment of specification quality and readiness as living documentation.

### 2. Issues Found (if any)

For each issue:

- Type and location
- Current problematic content (excerpt)
- Suggested contract-focused replacement
- Rationale for change

### 3. Proposed Changes

Specific text replacements for each issue (ready to apply).

### 4. Readiness Assessment

**GO** (Ready as Living Docs):

- Specs are clean and contract-focused
- No implementation details found
- Ready for maintenance phase

**NEEDS CLEANUP** (Revisions Required):

- Implementation details found (list count)
- Recommend applying proposed changes
- Re-run finalization after cleanup

### 5. Next Steps

- If GO: Specs ready for maintenance, use spec-first workflow for future changes
- If NEEDS CLEANUP: Apply changes and re-run `/kiro-spec-finalize <feature>`

## Safety & Fallback

### Error Scenarios

**Spec Not Found**: Report error and list available specs

**No Implementation Yet**: Warn that finalization is premature (run after implementation completes)

**Already Clean**: Report that specs are already well-structured as living documentation

### Balancing Act

- Don't over-simplify: Keep enough detail for contracts to be clear
- Don't over-specify: Remove "how" but keep "what"
- Preserve intent: Ensure business rules and requirements remain clear

## Examples

### Issue Example

```
🔧 **Issue**: SQL query in design-api.md
**Location**: design-api.md, "Position Initialization" section
**Current**: "SELECT MAX(order_position) as max_pos FROM entries WHERE assigned_day = ? AND is_deleted = 0"
**Suggested**: "Position is calculated as max existing position + 1 for the assigned day, ignoring soft-deleted entries. See `createEntry()` in entry-mutations.ts for implementation."
```

### Clean Spec Example

```
✅ **Example of Good Contract**:

**Position Assignment Contract**:
- New entries appended to end of day's list
- First entry receives position 0
- Subsequent entries receive max + 1
- Positions independent per day
- Soft-deleted entries don't affect calculation

**Implementation**: See `createEntry()` in entry-mutations.ts
```

## Related Commands

After finalization:

- Specs are living documentation
- Update specs FIRST during maintenance before changing code
- For maintenance changes: `/kiro-spec-requirements <feature>` → `/kiro-spec-design <feature>` → implement
- For new features: `/kiro-spec-init <new-feature>`

---

**Note**: Finalization is optional but recommended after implementation to ensure specs transition properly to living documentation. Run after `/kiro-validate-impl` passes and before moving to maintenance phase.
