# Instructions Documentation

AI agent instructions for code quality, conventions, and development standards.

## Purpose

Instruction files provide detailed, prescriptive guidance for AI agents (especially GitHub Copilot) when working with this codebase. They define **HOW** to write code that follows project standards.

## Instructions vs Steering

| Aspect        | Instructions                                 | Steering                           |
| ------------- | -------------------------------------------- | ---------------------------------- |
| **Purpose**   | Detailed rules for code quality              | Project memory and patterns        |
| **Content**   | Checklists, examples, prescriptive rules     | Context, rationale, decisions      |
| **Tone**      | Prescriptive ("Always...", "Never...")       | Explanatory ("We do X because...") |
| **Level**     | Detailed, specific                           | High-level, contextual             |
| **Examples**  | File size limits, import order, CSS rules    | Tech stack decisions, architecture |
| **When Used** | Applied to specific file types via `applyTo` | Always loaded as project context   |
| **Audience**  | AI agents during active development          | AI agents for all interactions     |

**Think of it this way**:

- **Steering** = Project's memory and philosophy ("Why we do things this way")
- **Instructions** = Project's rules and standards ("How to do things correctly")

Both are loaded by GitHub Copilot and used together to guide development.

## When Applied

Instructions use `applyTo` YAML frontmatter to target specific file types:

```yaml
---
applyTo: '**/*.vue'
---
```

This ensures relevant instructions are automatically included when working with matching files.

**Example**: Working on a Vue component? → `components.instructions.md` is loaded automatically.

## Instruction Files

### project.instructions.md

**Applies to**: All files (`**/*`)
**Content**: Project structure, file size limits, naming conventions, import order, base vs shared, development commands, testing requirements

### components.instructions.md

**Applies to**: Vue components (`**/*.vue`)
**Content**: Component hierarchy (Root/Section/UI), extraction patterns, prop drilling, file size management

### composables.instructions.md

**Applies to**: Composables (`**/composables/**/*.ts`, `**/use-*.ts`)
**Content**: Repository patterns, handler extraction, query/mutation splitting, naming conventions

### typescript.instructions.md

**Applies to**: TypeScript files (`**/*.ts`, `**/*.vue`)
**Content**: Type safety, null handling, discriminated unions, error types, utility type usage

### testing.instructions.md

**Applies to**: Test files (`**/*.test.ts`, `**/e2e/**/*.ts`)
**Content**: Testing strategy, test structure, mocking patterns, coverage requirements

### e2e-testing.instructions.md

**Applies to**: E2E test files (`**/e2e/**/*.ts`)
**Content**: Playwright best practices, locator strategy, web-first assertions, anti-patterns, test isolation

### validation.instructions.md

**Applies to**: Validation files (`**/*-schema.ts`, `**/validation/**/*.ts`)
**Content**: Zod schema patterns, error messages, reusable validators

### spec-writing.instructions.md

**Applies to**: Specification files (`**/.kiro/specs/**`)
**Content**: Specs as living documentation, lifecycle, what to include/exclude, cleanup guidance

### commit.instructions.md

**Applies to**: All files (commit message guidelines)
**Content**: Conventional commits format, scopes, when to make commits

## File Size Guidelines

Instructions should remain manageable and scannable:

- **Target**: 100-200 lines (preferred)
- **Max varies by type**:
  - General/comprehensive: ~300 lines max
  - Specific domain: ~200 lines max
  - Focused topic: ~150 lines max

**Signs file is too large**:

- Covers multiple unrelated domains
- Contains extensive examples that could be separate
- Mixes high-level and low-level guidance
- Difficult to scan in < 3 minutes

**When to split**:

- Extract examples to separate `-examples.md` file
- Split by subdomain (e.g., `components-root.instructions.md`, `components-section.instructions.md`)
- Move advanced patterns to separate file

## Creating New Instructions

### When to Create a New File

Create a new instruction file when:

- New file type with specific conventions (e.g., `workers.instructions.md`)
- Existing file approaches 300 lines
- Domain has enough rules to justify separate file (30+ rules/guidelines)
- Rules apply to specific subset of files (`applyTo` targets specific pattern)

**Don't create new file when**:

- Only 5-10 guidelines (add to existing file)
- No clear `applyTo` pattern (use steering instead)
- Content is project context, not rules (use steering)

### How to Create

1. **Choose filename**: `[domain].instructions.md` (e.g., `workers.instructions.md`)
2. **Add frontmatter**:
   ```yaml
   ---
   applyTo: '[glob pattern]'
   ---
   ```
3. **Structure**:
   - Title and purpose
   - Key principles
   - Detailed rules with examples
   - Common patterns
   - Anti-patterns to avoid
   - Checklist
4. **Keep manageable**: Target 100-200 lines
5. **Add to this README**: Document the new file in the list above

### Template Structure

```markdown
---
applyTo: '[glob-pattern]'
---

# [Domain] Guidelines

Guidelines for [what this covers].

## Purpose

[Why these rules exist, 2-3 sentences]

## Key Principles

1. [Principle 1]
2. [Principle 2]
3. [Principle 3]

## Detailed Rules

### [Category 1]

[Rules, examples, and explanations]

### [Category 2]

[Rules, examples, and explanations]

## Common Patterns

[Recommended patterns to follow]

## Anti-patterns

[What to avoid and why]

## Checklist

- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]
```

## Maintaining Instructions

### Regular Review

Review instructions quarterly or when:

- File approaches size limit
- New patterns emerge across multiple PRs
- Contradictions found between files
- Team feedback suggests confusion

### Updating Instructions

When updating:

- Ensure changes don't contradict other instructions
- Update all relevant examples
- Keep within size guidelines
- Test with AI agent to verify clarity

### Consolidation

Periodically review for:

- Duplicated guidance across files
- Outdated rules no longer followed
- Contradictions to resolve
- Content that should move to steering (context) vs instructions (rules)

## Relationship to Other Documentation

### Instructions vs Docs

- **Instructions**: AI agent rules for writing code
- **Docs** (`/docs`): Human-facing documentation (architecture, conventions, testing strategy)

Some overlap is natural, but instructions are more prescriptive while docs are more descriptive.

### Instructions vs `.kiro/settings/rules`

- **Instructions**: Code quality and convention rules
- **Settings/rules**: Spec generation and development workflow rules

Settings/rules guide the spec generation process. Instructions guide code implementation.

## Best Practices

1. **Be specific**: "File must be under 200 lines" not "Keep files small"
2. **Provide examples**: Show both good ❌ and bad ✅ patterns
3. **Explain why**: Don't just say what, explain the rationale
4. **Use checklists**: Make rules actionable and verifiable
5. **Keep current**: Remove outdated rules promptly
6. **Cross-reference**: Link related instructions and steering docs
7. **Test clarity**: If AI agents misinterpret, improve wording

## Getting Help

- **Unclear rules?** → Ask in PR review or team discussion
- **Contradictions?** → Flag for resolution
- **New patterns?** → Propose update to relevant instruction file
- **File too large?** → Suggest splitting strategy

---

_Purpose: Guide creation and maintenance of AI agent instruction files_  
_See also: `.kiro/steering/` for project memory and context (vs detailed rules)_
