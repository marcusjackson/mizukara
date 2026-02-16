# Specifications as Living Documentation

Project philosophy on specifications in `.kiro/specs/`.

## Core Philosophy

**Specifications are living documentation, not temporary scaffolding.**

Specs define "WHY" and "WHAT". Code defines "HOW". Both are maintained throughout the project lifecycle.

## Why Specs as Living Docs

### For AI-Assisted Development

- **Context window constraints**: Specs (few thousand lines) fit in AI context; full codebases (50,000+ lines) often don't
- **Intent over implementation**: AI reasons better from concise contracts than from reading all code
- **Spec-first updates**: Update spec → AI generates code changes is faster and more reliable than manual edits

### For Humans

- **Onboarding**: New developers understand intent without reading entire codebase
- **Maintenance**: Clear contracts and requirements guide changes correctly
- **Compliance**: Audit trail of decisions, requirements, and evolution
- **Knowledge preservation**: Decisions and rationale survive beyond individual memory

### For Project Health

- **Single source of truth**: Specs document contracts, requirements, and business rules
- **Prevents drift**: Spec-first workflow keeps implementation aligned with intent
- **Reduces duplication**: Shared understanding reduces duplicate implementations

## Specs Lifecycle

### Pre-Implementation

- Define requirements from user needs
- Design contracts, interfaces, and architecture
- Generate implementation tasks
- **Goal**: Clear blueprint for what to build

### During Implementation

- Reference for contracts and acceptance criteria
- Source of truth for requirements
- Validation target for implementation
- **Goal**: Keep implementation aligned

### Post-Implementation

- Reconcile spec with as-built state
- Clean up any implementation details that crept in
- Validate contracts match code
- **Goal**: Accurate post-implementation documentation

### Maintenance

- **Spec-first workflow**: Update specs BEFORE changing contracts/requirements
- Specs guide code changes, not the reverse
- Keep specs and code in sync
- **Goal**: Sustained alignment between intent and implementation

## What Belongs in Specs

### ✅ Include

- Requirements and acceptance criteria
- Business rules and invariants
- Contracts (inputs, outputs, errors)
- Component responsibilities and boundaries
- Expected behaviors and examples
- Architectural decisions and rationale

### ❌ Exclude

- Implementation details (algorithms, pseudocode)
- Detailed SQL queries or migration code
- Line-by-line implementation instructions
- Specific code structure or organization
- Technology implementation specifics

**Rule**: If it's about HOW to implement, it belongs in code comments, not specs.

## Relationship to Other Documentation

### Specs vs Code

- **Specs**: WHY (intent, requirements, contracts)
- **Code**: HOW (implementation, algorithms, optimization)
- **Sync**: Specs updated first, then code follows

### Specs vs Steering

- **Specs**: Feature-specific contracts and requirements
- **Steering**: Project-wide patterns and architectural decisions
- **Graduation**: When patterns emerge across multiple specs, promote to steering

**Example**: First spec defines REST error format → Later specs use same pattern → Pattern documented in steering as project standard

### Specs vs Research

- **Specs**: Decisions and contracts (what was chosen)
- **Research**: Investigation and alternatives (how decision was made)
- **Research** belongs in `_reference/research.md` within spec folder

## When to Update Specs

### Always Update

- **Pre-implementation**: Before writing code
- **Contract changes**: Interfaces, parameters, return types change
- **Requirements change**: New acceptance criteria or business rules
- **Behavior changes**: Different expected outcomes

### Don't Update For

- **Internal refactoring**: Code structure changes, no contract changes
- **Performance optimization**: Same behavior, better performance
- **Code style**: Formatting, naming (unless public API)
- **Bug fixes**: Unless bug reveals spec was wrong

**Principle**: Update specs when "WHAT" changes, not when "HOW" improves.

## Design Review and Cleanup

### Prevention First

Implementation details should NOT be generated in design documents in the first place.

**Design generation**: Focus on contracts, not implementation
**AI guidance**: Enforce "WHAT not HOW" during design phase
**Templates**: Structure design documents for contracts, not code

### Design Review as Safety Net

If implementation details appear in specs during design review:

**Identify**: Algorithms, SQL queries, pseudocode, step-by-step instructions
**Extract**: Move to `research.md` or reference migration files
**Replace**: Contract descriptions with references to implementation

**Timing**: Clean up during design review (before implementation), not after.

## Spec-First Workflow

During maintenance, follow this workflow:

1. **Identify change**: Contract or requirement needs updating
2. **Update spec first**: Modify requirements.md or design.md
3. **Generate tasks**: Create/update tasks based on spec changes
4. **Implement changes**: Code follows spec
5. **Validate**: Verify implementation matches spec

**Anti-pattern**: Changing code first, then updating specs as documentation afterthought.

## Integration with Development Workflow

### Kiro Workflow Commands

- `/kiro-spec-init` → Initialize new spec
- `/kiro-spec-requirements` → Define requirements
- `/kiro-spec-design` → Design contracts and architecture
- `/kiro-validate-design` → Review design quality
- `/kiro-spec-tasks` → Generate implementation tasks
- `/kiro-spec-impl` → Execute implementation
- `/kiro-validate-impl` → Validate against spec
- `/kiro-spec-finalize` → Clean up and finalize as living doc

### Continuous Maintenance

After implementation:

- Specs remain in `.kiro/specs/<feature>/`
- Not archived, not deleted
- Updated when contracts/requirements change
- Referenced during maintenance and onboarding

## Success Criteria

Specs are successful living documentation when:

- AI can understand contracts from specs alone (no code reading needed)
- New developers understand what system does from specs
- Maintenance updates specs first, code second
- No implementation details (SQL, algorithms) in spec files
- Specs and code stay in sync throughout project lifecycle

---

_Created: 2026-02-11_  
_Purpose: Define project philosophy on specifications as living documentation_
