# AI-DLC and Spec-Driven Development

## Project Context

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context  
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications

- Check `.kiro/specs/` for active specifications
- Use `/kiro-spec-status [feature-name]` to check progress

## Development Guidelines

- Think in English, generate responses in English

## Workflow

- Phase 0 (optional): `/kiro-steering`, `/kiro-steering-custom`
- Phase 1 (Specification): `/kiro-spec-init`, `/kiro-spec-requirements`, `/kiro-spec-design`, `/kiro-spec-tasks`
- Phase 2 (Implementation): `/kiro-spec-impl`
- Progress check: `/kiro-spec-status`

## Development Rules

- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Follow user instructions precisely and act autonomously within scope
- Gather necessary context and complete work end-to-end

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro-steering-custom`)

## Other Instructions

- Always prefer Makefile commands for lint, test etc.
- Read fully the `.github/instructions/project.instructions.md` file
