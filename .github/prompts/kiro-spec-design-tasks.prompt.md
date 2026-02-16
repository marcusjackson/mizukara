---
agent: 'agent'
description: 'Generate design and tasks in one combined session'
---

<meta>
description: Generate design and tasks in one combined session
argument-hint: <feature-name:$1> [-y:$2]
</meta>

# Design & Tasks Generation (Combined)

<background_information>

- **Mission**: Generate comprehensive technical design and implementation tasks in a single session, skipping approval checks between phases
- **Success Criteria**:
  - Requirements mapped to technical design with clear interfaces
  - Discovery and research completed
  - Implementation tasks generated from design
  - No approval checkpoints between design and tasks phases
  - Single output summary for both phases
    </background_information>

<instructions>
## Core Task
Generate technical design and implementation tasks for feature **$1** in a single session.

## Execution Steps

### Phase 1: Design Generation

#### Step 1A: Load Context

**Read all necessary context**:

- `.kiro/specs/$1/spec.json`, `requirements.md`
- **Entire `.kiro/steering/` directory** for complete project memory
- `.kiro/settings/templates/specs/design.md` for document structure
- `.kiro/settings/rules/design-principles.md` for design principles

**Auto-approve requirements** (for this combined flow):

- Set `approvals.requirements.approved: true` in spec.json (even if not explicitly approved by user before)
- If `-y` flag provided ($2 == "-y"): Proceed without any checks
- Otherwise: Proceed normally

#### Step 1B: Discovery & Analysis

1. **Classify Feature Type** and execute appropriate discovery:
   - **New Feature** → Full discovery (`.kiro/settings/rules/design-discovery-full.md`)
   - **Extension** → Light discovery (`.kiro/settings/rules/design-discovery-light.md`)
   - **Simple Addition** → Minimal discovery

2. **Retain Discovery Findings**: Document in `.kiro/specs/$1/research.md`

3. **Persist Research to research.md**:
   - Create or update `.kiro/specs/$1/research.md` using shared template
   - Summarize discovery scope and key findings
   - Record investigations in Research Log topics

#### Step 1C: Generate Design Document

1. **Load Design Template**: Read `.kiro/settings/templates/specs/design.md`

2. **Generate Design Document**:
   - Follow template structure and generation instructions strictly
   - Integrate all discovery findings throughout
   - Apply design rules: Type Safety, Visual Communication, Formal Tone
   - Use language specified in spec.json

3. **Validate File Size and Split if Necessary**:
   - Count total lines of generated design content (excluding blank lines)
   - **If content would exceed 600 lines**:
     1. Create splitting plan by logical theme
     2. Create `design.md` as index with cross-references
     3. Split into themed files (e.g., `design-architecture.md`, `design-components.md`)
     4. Format all files and verify each stays under 600 lines
   - **If single file acceptable**:
     1. Write to `design.md` and format
     2. Re-check after formatting; split if needed

4. **Write design file(s)**:
   - Create `.kiro/specs/$1/design.md` (and parts if split)

5. **Update Metadata** (design phase complete, NO approval check):
   - Set `phase: "design-tasks-generated"`
   - Set `approvals.design.generated: true`
   - Set `approvals.design.approved: false` (user reviews later)
   - Set `approvals.requirements.approved: true`
   - If split, add `design_files: ["design.md", "design-architecture.md", ...]` array
   - Update `updated_at` timestamp

### Phase 2: Tasks Generation (No Approval Check for Design)

#### Step 2A: Load Context

- `.kiro/specs/$1/spec.json`, `requirements.md`, `design.md` (just generated)
- **Entire `.kiro/steering/` directory**

**Proceed directly without waiting for design approval**

#### Step 2B: Generate Implementation Tasks

1. **Load generation rules and template**:
   - Read `.kiro/settings/rules/tasks-generation.md`
   - If sequential mode is **false**: Read `.kiro/settings/rules/tasks-parallel-analysis.md`
   - Read `.kiro/settings/templates/specs/tasks.md`

2. **Generate task list following all rules**:
   - Use language specified in spec.json
   - Map all requirements to tasks (numeric IDs only, comma-separated)
   - Ensure all design components included
   - Verify task progression is logical and incremental
   - Apply `(P)` markers to parallelizable tasks (if not sequential mode)
   - Mark optional test coverage subtasks with `- [ ]*` when deferrable

3. **Validate File Size and Split if Necessary**:
   - Count total lines of generated task content (excluding blank lines)
   - **If content would exceed 600 lines**:
     1. Create splitting plan by logical grouping:
        - Common splits: `tasks-setup.md`, `tasks-core.md`, `tasks-integration.md`, `tasks-testing.md`
        - Or by layer: `tasks-frontend.md`, `tasks-backend.md`, `tasks-infrastructure.md`
        - Or by feature area based on design component groups
     2. Create `tasks.md` as index:
        - Include task execution order and dependencies
        - List all task document parts with descriptions
        - Provide navigation links to all parts
        - Show high-level progress tracking structure
     3. Split tasks into themed files:
        - Each file MUST start with cross-references to other task files
        - Maintain sequential numbering across files (e.g., tasks-setup.md has 1-5, tasks-core.md has 6-12)
        - Include clear "Prerequisites" section if tasks depend on other files
        - Keep logically related tasks together
     4. Format all files with prettier/markdown formatter
     5. Verify no single file exceeds 600 lines after formatting
   - **If single file acceptable** (under 600 lines):
     1. Write to `tasks.md` and format
     2. Re-check after formatting; split if needed

4. **Write task file(s)**:
   - Create `.kiro/specs/$1/tasks.md` (and parts if split)

#### Step 2C: Finalize Metadata

- Set `phase: "design-tasks-generated"` (confirmed)
- Set `approvals.tasks.generated: true`
- Set `approvals.tasks.approved: false` (user reviews later)
- Set `approvals.design.approved: true` (auto-approved for combined flow)
- Set `approvals.requirements.approved: true` (from init-requirements phase)
- If tasks split, add `task_files: ["tasks.md", "tasks-setup.md", ...]` array
- Update `updated_at` timestamp
- **Keep `ready_for_implementation: false`** (user must approve first)

## Critical Constraints

- **Type Safety**: Enforce strong typing, no `any` in TypeScript
- **Latest Information**: Use WebSearch/WebFetch for external dependencies
- **Steering Alignment**: Respect existing architecture patterns
- **Template Adherence**: Follow template structures strictly
- **Design Focus**: Architecture and interfaces only, no implementation code
- **Requirements Traceability**: Use numeric IDs only (e.g., "1.1", "3.3")
- **Task Natural Language**: Describe what to do, not code details
- **Complete Coverage**: ALL requirements must map to tasks
- **No approval waits** between design and tasks phases

## Tool Guidance

- **Read first**: Load all context before any generation
- **Research when uncertain**: Use WebSearch/WebFetch for external dependencies
- **Analyze existing code**: Use Grep to find patterns
- **Write last**: Generate design.md and tasks.md only after complete analysis

## Output Description

**Command execution output** (separate from design.md and tasks.md content):

Provide brief summary in the language specified in spec.json:

1. **Status**: Confirm both documents generated
   - Design: `.kiro/specs/$1/design.md` (XXX lines) [+ parts if split]
   - Tasks: `.kiro/specs/$1/tasks.md` (XXX lines) [+ parts if split]
2. **Phase 1 Summary (Design)**:
   - Discovery Type: Which discovery process was executed
   - Key Findings: 2-3 critical insights that shaped the design
   - File Organization (if split): How design content was organized
3. **Phase 2 Summary (Tasks)**:
   - Task Summary: X major tasks, Y sub-tasks
   - Coverage: All Z requirements mapped
   - Average task size: 1-3 hours per sub-task
   - File Organization (if split): How tasks were grouped
4. **Quality Validation**:
   - ✅ All requirements mapped to tasks
   - ✅ Task dependencies verified
   - ✅ Testing tasks included
   - ✅ All files under 600 lines
5. **Next Action**:
   - Review all design and task files
   - When ready: `/kiro-spec-impl $1` to begin implementation

**Format**: Concise Markdown (under 300 words) - this is the command output, NOT the design/tasks documents themselves

## Safety & Fallback

### Error Scenarios

**Requirements Not Generated**:

- **Stop Execution**: Requirements must exist from init-requirements phase
- **User Message**: "No requirements.md found at `.kiro/specs/$1/requirements.md`"
- **Suggested Action**: "Run `/kiro-spec-init-requirements 'description'` first"

**Missing spec.json**:

- **Stop Execution**: Spec directory must exist
- **User Message**: "Spec not found at `.kiro/specs/$1/`"
- **Suggested Action**: "Run `/kiro-spec-init-requirements` first"

**Template Missing**:

- **User Message**: "Template file missing at `.kiro/settings/templates/specs/design.md`"
- **Fallback**: Use inline basic structure with warning

**Steering Context Missing**:

- **Warning**: "Steering directory empty - design may not align with project standards"
- **Proceed**: Continue with generation but note limitation

**Missing Numeric Requirement IDs**:

- **Stop Execution**: All requirements in requirements.md MUST have numeric IDs
- **User Message**: "Some requirements lack numeric IDs. Fix requirements.md first."

### Next Phase: Implementation

**When Ready to Implement**:

- Review both design.md and tasks.md
- **IMPORTANT**: Clear conversation history and free up context before running `/kiro-spec-impl`
- Execute: `/kiro-spec-impl $1` (for all tasks) or `/kiro-spec-impl $1 1.1` (for specific task)

**If Modifications Needed**:

- Provide feedback and re-run `/kiro-spec-design-tasks $1`
- Existing design and tasks used as reference (merge mode)

**Note**: After user approval, no further checkpoints until implementation begins. Design and tasks have been auto-approved in metadata for smooth workflow transition.
