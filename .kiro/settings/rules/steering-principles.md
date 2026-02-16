# Steering Principles

Steering files are **project memory**, not exhaustive specifications.

---

## Steering vs Instructions

**Clear distinction** between two types of project documentation:

### Steering (`.kiro/steering/`)

- **Purpose**: Project memory, context, and philosophy
- **Content**: High-level patterns, architectural decisions, "why we do things this way"
- **Tone**: Explanatory, contextual ("We use X because...")
- **When Used**: Always loaded as project context for all AI interactions
- **Examples**: Tech stack decisions, project philosophy, organizational patterns
- **Updates**: Additive, preserve user customizations

### Instructions (`.github/instructions/`)

- **Purpose**: Detailed rules and coding standards
- **Content**: Prescriptive guidance, checklists, file size limits, "how to do things"
- **Tone**: Prescriptive, rule-based ("Always...", "Never...")
- **When Used**: Applied to specific file types via `applyTo` frontmatter
- **Examples**: File size limits, import order, component hierarchy rules
- **Updates**: Modified as coding standards evolve

**Summary**: Steering explains project decisions and patterns (WHY). Instructions enforce code quality rules (HOW).

See [.github/instructions/README.md](../../../.github/instructions/README.md) for detailed comparison.

---

## Content Granularity

### Golden Rule

> "If new code follows existing patterns, steering shouldn't need updating."

### ✅ Document

- Organizational patterns (feature-first, layered)
- Naming conventions (PascalCase rules)
- Import strategies (absolute vs relative)
- Architectural decisions (state management)
- Technology standards (key frameworks)

### ❌ Avoid

- Complete file listings
- Every component description
- All dependencies
- Implementation details
- Agent-specific tooling directories (e.g. `.cursor/`, `.gemini/`, `.claude/`)
- Detailed documentation of `.kiro/` metadata directories (settings, automation)

### Example Comparison

**Bad** (Specification-like):

```markdown
- /components/Button.tsx - Primary button with variants
- /components/Input.tsx - Text input with validation
- /components/Modal.tsx - Modal dialog
  ... (50+ files)
```

**Good** (Project Memory):

```markdown
## UI Components (`/components/ui/`)

Reusable, design-system aligned primitives

- Named by function (Button, Input, Modal)
- Export component + TypeScript interface
- No business logic
```

---

## Security

Never include:

- API keys, passwords, credentials
- Database URLs, internal IPs
- Secrets or sensitive data

---

## Quality Standards

- **Single domain**: One topic per file
- **Concrete examples**: Show patterns with code
- **Explain rationale**: Why decisions were made
- **Maintainable size**: 100-200 lines typical

---

## Preservation (when updating)

- Preserve user sections and custom examples
- Additive by default (add, don't replace)
- Add `updated_at` timestamp
- Note why changes were made

---

## Notes

- Templates are starting points, customize as needed
- Follow same granularity principles as core steering
- All steering files loaded as project memory
- Light references to `.kiro/specs/` and `.kiro/steering/` are acceptable; avoid other `.kiro/` directories
- Custom files equally important as core files

---

## File-Specific Focus

- **product.md**: Purpose, value, business context (not exhaustive features)
- **tech.md**: Key frameworks, standards, conventions (not all dependencies)
- **structure.md**: Organization patterns, naming rules (not directory trees)
- **Custom files**: Specialized patterns (API, testing, security, etc.)
