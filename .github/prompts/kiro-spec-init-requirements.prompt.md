---
agent: 'agent'
description: 'Initialize specification and generate requirements in one session'
---

<meta>
description: Initialize specification and generate requirements in one session
argument-hint: <project-description>
</meta>

# Specification Initialization & Requirements Generation

<background_information>

- **Mission**: Initialize a new specification and generate comprehensive requirements in a single session, skipping approval checks between phases
- **Success Criteria**:
  - Generate appropriate feature name from project description
  - Create unique spec structure without conflicts
  - Generate complete requirements document in EARS format
  - No approval checkpoints between init and requirements phases
  - Single output summary for both phases
    </background_information>

<instructions>
## Core Task
Initialize a new spec and immediately generate requirements based on project description ($ARGUMENTS).

## Execution Steps

### Phase 1: Specification Initialization

1. **Check Uniqueness**: Verify `.kiro/specs/` for naming conflicts (append number suffix if needed)
2. **Create Directory**: `.kiro/specs/[feature-name]/`
3. **Initialize Files Using Templates**:
   - Read `.kiro/settings/templates/specs/init.json`
   - Read `.kiro/settings/templates/specs/requirements-init.md`
   - Replace placeholders:
     - `{{FEATURE_NAME}}` → generated feature name
     - `{{TIMESTAMP}}` → current ISO 8601 timestamp
     - `{{PROJECT_DESCRIPTION}}` → $ARGUMENTS
   - Write `spec.json` and `requirements.md` to spec directory

### Phase 2: Requirements Generation (No Approval Check)

1. **Load Context**:
   - Read `.kiro/specs/[feature-name]/spec.json` for language and metadata
   - Read `.kiro/specs/[feature-name]/requirements.md` for project description
   - **Load ALL steering context**: Read entire `.kiro/steering/` directory

2. **Read Guidelines**:
   - Read `.kiro/settings/rules/ears-format.md` for EARS syntax rules
   - Read `.kiro/settings/templates/specs/requirements.md` for document structure

3. **Generate Requirements**:
   - Create initial requirements based on project description
   - Group related functionality into logical requirement areas
   - Apply EARS format to all acceptance criteria
   - Use language specified in spec.json

4. **Update spec.json Metadata** (NO approval wait):
   - Set `phase: "requirements-generated"`
   - Set `approvals.requirements.generated: true`
   - Set `approvals.requirements.approved: false` (user reviews later)
   - Update `updated_at` timestamp
   - **Keep `ready_for_implementation: false`**

## Important Constraints

- Focus on WHAT, not HOW (no implementation details)
- Requirements must be testable and verifiable
- Choose appropriate subject for EARS statements
- Requirement headings in requirements.md MUST include a leading numeric ID only (e.g., "Requirement 1", "1.", "2 Feature ..."); do not use alphabetic IDs
- **Skip approval checks** between init and requirements phases
- Do NOT ask for user approval between phases

## Tool Guidance

- Use **Glob** to check existing spec directories for name uniqueness
- Use **Read** to fetch templates
- Use **Write** to create spec.json and requirements.md after placeholder replacement
- Perform validation before any file write operation

## Output Description

Provide output in the language specified in `spec.json` with the following structure:

1. **Generated Feature Name**: `feature-name` format with 1-2 sentence rationale
2. **Project Summary**: Brief summary (1 sentence)
3. **Phase 1: Initialization Complete**
   - Created files with full paths
4. **Phase 2: Requirements Generated**
   - Summary of major requirement areas (3-5 bullets)
5. **Next Step**: Command block showing `/kiro-spec-design-tasks <feature-name>` (or separate commands if user prefers to review first)
6. **User Action**: Explain what to review before proceeding to design/tasks

**Format Requirements**:

- Use Markdown headings (##, ###)
- Wrap commands in code blocks
- Keep total output concise (under 350 words)
- Use clear, professional language per `spec.json.language`

## Safety & Fallback

- **Ambiguous Feature Name**: If feature name generation is unclear, propose 2-3 options and ask user to select
- **Template Missing**: If template files don't exist, report error with specific missing file path
- **Directory Conflict**: If feature name already exists, append numeric suffix and notify user
- **Write Failure**: Report error with specific path
- **Incomplete Requirements**: After generation, explicitly ask user if requirements cover all expected functionality

### Next Phase: Design & Tasks

**When ready to proceed**:

- Option 1 (Recommended): Review requirements first, then run `/kiro-spec-design-tasks <feature-name>` for combined design & tasks
- Option 2: If modifications needed, provide feedback and re-run `/kiro-spec-init-requirements <feature-description>`

**Note**: No approval checkpoints between init and requirements. User reviews the combined output before proceeding to design & tasks phase.
