---
agent: 'agent'
description: 'Commit the changes following repository guidelines'
---

# Create Commit

Guide through creating a properly formatted commit following Conventional Commits format.

## Commit Format Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding or updating tests
- `chore`: Tooling, dependencies, config
- `perf`: Performance improvement

### Scope

Optional. Indicates the area of change (e.g., `forms`, `api`, `ui`).

### Subject

- Imperative mood: "add" not "adds" or "added"
- No capitalization
- No period at end
- Max 50 characters

### Body

- Explain **what** and **why**, not how
- Wrap at 72 characters
- Separate from subject with blank line

### Footer

- Reference issues: `Closes #42` or `Refs #42`
- Breaking changes: `BREAKING CHANGE: description`

### Examples

```
feat: add input validation

Add schema validation for input fields.
Ensures values meet required criteria.

Closes #42
```

```
fix: correct filter reset behavior

Filters were not resetting to default values when
clicking the clear button. Fixed by explicitly
setting each filter to its initial state.

Closes #57
```

## Process

### Step 1: Check Git Status

```bash
git status
git diff --stat
```

Show which files have been modified and need to be committed.

### Step 2: Execute Commit

Based on the changes, come up with a commit message following the guidelines above:

```
<type>(<scope>): <subject>

<optional body explaining the change>

<optional footer with issue references>
```

Stage and commit the changes:

```bash
git add [files]
git commit -m "[commit message]"
```

## Critical Rules

- **ALL file paths** must be included in git add (check git status!)
- **Follow Conventional Commits format** exactly as specified
- **English only** for commit messages
- **One logical change per commit** - keep commits atomic
- **Code must work** after each commit

## Arguments

$ARGUMENTS
