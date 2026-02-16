---
applyTo: '**/composables/**/*.ts,**/use-*.ts'
---

# Composable Instructions

Guidelines for creating and modifying composables.

## File Size Limits

| Type       | Target Lines | Max Lines |
| ---------- | ------------ | --------- |
| Repository | 200-250      | **250**   |
| Handlers   | 100-150      | **150**   |
| State      | 80-120       | **120**   |
| Form       | 80-150       | **150**   |

## Naming

- File: `use-[module]-[purpose].ts` (kebab-case)
- Function: `use[Module][Purpose]` (camelCase)

| Purpose         | Example                        |
| --------------- | ------------------------------ |
| Repository      | `use-entry-repository.ts`      |
| Detail state    | `use-entry-detail-state.ts`    |
| Detail handlers | `use-entry-detail-handlers.ts` |
| Form            | `use-entry-form.ts`            |

## File Location

| Type            | Location                            |
| --------------- | ----------------------------------- |
| Module-specific | `src/modules/[module]/composables/` |
| Base (generic)  | `src/base/composables/`             |
| Shared (app)    | `src/shared/composables/`           |

**Decision:** Does it reference entries, database, or app concepts?

- No → `base/`
- Yes → `shared/` or module

## Repository Pattern

```typescript
// use-entry-repository.ts (~200-250 lines)
export function useEntryRepository() {
  const db = useDatabase()

  return {
    // Read operations
    findById: (id: string): Entry | null => {
      /* ... */
    },
    findAll: (): Entry[] => {
      /* ... */
    },
    search: (filters: Filters): Entry[] => {
      /* ... */
    },

    // Write operations
    create: (input: CreateEntryInput): Entry => {
      /* ... */
    },
    update: (id: string, input: UpdateEntryInput): Entry => {
      /* ... */
    },
    remove: (id: string): void => {
      /* ... */
    },

    // Field-level updates (for inline editing)
    updateContent: (id: string, value: string): void => {
      /* ... */
    },
    updateAssignedDay: (id: string, value: string): void => {
      /* ... */
    }
  }
}
```

## Handler Extraction Pattern

When Root component has too many handlers, extract:

```typescript
// use-entry-detail-handlers.ts (~100-150 lines)
export function useEntryDetailHandlers(
  entry: Ref<Entry | null>,
  repo: ReturnType<typeof useEntryRepository>
) {
  const handleUpdateContent = async (content: string) => {
    await repo.updateContent(entry.value!.id, content)
    // Update local state
  }

  const handleUpdateAssignedDay = async (day: string) => {
    await repo.updateAssignedDay(entry.value!.id, day)
    // Update local state
  }

  return {
    handleUpdateContent,
    handleUpdateAssignedDay
    // ... other handlers
  }
}
```

## State Extraction Pattern

When Root has complex state, extract:

```typescript
// use-entry-detail-state.ts (~80-120 lines)
export function useEntryDetailState(entryId: Ref<string>) {
  const entry = ref<Entry | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const editingSection = ref<string | null>(null)

  // Load logic
  const load = async () => {
    /* ... */
  }

  return {
    entry,
    isLoading,
    error,
    editingSection,
    load
  }
}
```

## Splitting Large Composables

When repository exceeds ~250 lines:

```
Before: use-entry-repository.ts (400 lines)
After:
├── use-entry-repository.ts (150 lines) - delegates
├── use-entry-queries.ts (120 lines) - read ops
└── use-entry-mutations.ts (130 lines) - write ops
```

## Return Pattern

Always return objects, never arrays:

```typescript
// ✅ Correct
return { entry, isLoading, error }

// ❌ Wrong
return [entry, isLoading, error]
```

## Form Composables

```typescript
// use-entry-form.ts
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

export function useEntryForm(initialValues?: Partial<EntryFormData>) {
  const { handleSubmit, errors, values, resetForm, setFieldValue } = useForm({
    validationSchema: toTypedSchema(entryFormSchema),
    initialValues: { content: '', ...initialValues }
  })

  return { handleSubmit, errors, values, resetForm, setFieldValue }
}
```

## Type Safety

- All parameters must be typed
- All return values must be typed
- Use `import type` for type-only imports

```typescript
import type { Entry, CreateEntryInput } from '../entry-types'

export function useEntryRepository() {
  const create = (input: CreateEntryInput): Entry => {
    /* ... */
  }
  return { create }
}
```

## Testing

Tests colocated with composables:

```
composables/
├── use-entry-repository.ts
├── use-entry-repository.test.ts
```

## Quick Reference

**Before creating/editing a composable:**

1. Check current line count
2. If approaching limit, plan split first
3. Repository: queries/mutations
4. Root handlers: state/handlers

**File size targets:**

- Repository: 200-250 lines (250 max)
- Handlers: 100-150 lines (150 max)
- State: 80-120 lines (120 max)

## Composable Complexity Management

When composable logic becomes complex (nested conditionals, special cases):

### Extract Mappings to Constants

```typescript
// Instead of hardcoded special cases
if (key === 'arrowup' && eventKey === 'k') keyMatches = true
if (key === 'arrowdown' && eventKey === 'j') keyMatches = true

// Extract to named constants
const KEY_ALIASES = new Map([
  ['k', 'arrowup'],
  ['j', 'arrowdown']
] as const)

const aliasedKey = KEY_ALIASES.get(key) ?? key
const keyMatches = eventKey === key || eventKey === aliasedKey
```

**Benefits**:

- Centralized configuration
- Self-documenting behavior
- Easy to extend with new aliases
- Testable independently

### Extract Helper Functions

```typescript
// Instead of inline checks scattered throughout
if (NAVIGATION_KEYS.includes(key as NavigationKey)) {
  // navigation logic
}

// Extract to named helper
function isNavigationKey(key: string): boolean {
  return NAVIGATION_KEYS.includes(key as NavigationKey)
}

if (isNavigationKey(key)) {
  // navigation logic
}
```

**Benefits**:

- Named intent
- Reusable logic
- Easier to test
- Reduces cognitive load

### Document Non-Obvious Behavior

```typescript
/**
 * Key aliases for Vim-style navigation
 *
 * Maps J/K to arrow keys for consistent navigation behavior.
 * Users familiar with Vim can use J (down) and K (up) instead of arrow keys.
 */
const KEY_ALIASES = new Map([
  ['k', 'arrowup'],
  ['j', 'arrowdown']
] as const)
```

**When to extract**:

- Logic has 3+ special cases
- Behavior is non-obvious
- Similar patterns appear multiple times
- Function exceeds 50 lines

---

## Component Exposed Methods

Components that expose methods via `defineExpose()` must document them in the component-level JSDoc:

````typescript
/**
 * ComponentName
 *
 * Brief description of component purpose.
 *
 * Exposed Methods:
 * - methodName() - What it does and when to use it.
 *   Common use case: Why parent would call this.
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import ComponentName from './ComponentName.vue'
 *
 * const componentRef = ref()
 *
 * function useExposedMethod() {
 *   componentRef.value?.methodName()
 * }
 * </script>
 *
 * <template>
 *   <ComponentName ref="componentRef" />
 * </template>
 * ```
 */
````

**Why**: Makes exposed APIs discoverable without reading implementation.

---

## See Also

- [structure.md](../../.kiro/steering/structure.md) — Module organization and composable placement
- [tech.md](../../.kiro/steering/tech.md) — Repository pattern rationale
