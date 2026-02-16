---
applyTo: '**/*.ts,**/*.vue'
---

# TypeScript Instructions

General TypeScript conventions for this project.

## Strict Mode

TypeScript strict mode is enabled. All code must be fully typed.

## Type vs Interface

- Use `interface` for object shapes
- Use `type` for unions, primitives, and utility types

```typescript
// ✅ Interface for objects
interface Entry {
  id: string
  content: string
  assignedDay: string
  createdAt: string
  updatedAt: string
}

// ✅ Type for unions
type EntryStatus = 'draft' | 'published' | 'archived'

// ✅ Type for utility types
type EntryWithMetadata = Entry & { metadata: Metadata[] }
```

## Type Imports

Use `import type` for type-only imports:

```typescript
import { ref, computed } from 'vue'
import type { Entry, Metadata } from '../entry-types'
```

## Type File Organization

| Location | Naming              | Content                                     |
| -------- | ------------------- | ------------------------------------------- |
| Module   | `[module]-types.ts` | Module-specific types                       |
| Base     | N/A                 | Base rarely needs types (generic utilities) |
| Shared   | `[domain]-types.ts` | App-specific shared types                   |

**Never use bare `types.ts`** — always prefix with module or domain name.

```
modules/entry-detail/entry-detail-types.ts
modules/entry-list/entry-list-types.ts
shared/types/database-types.ts
shared/types/common-types.ts
```

**Note**: `base/` typically doesn't have a `types/` folder since base utilities are generic and self-contained. If a base utility needs types, define them in the same file.

## Common Type Patterns

### Entity Types

```typescript
// entry-types.ts
export interface Entry {
  id: string
  content: string
  assignedDay: string
  orderPosition: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type EntryStatus = 'draft' | 'published' | 'archived'
```

### Input Types

```typescript
// For create operations - omit auto-generated fields
export interface CreateEntryInput {
  content: string
  assignedDay: string
  orderPosition?: number
}

// For update operations - all fields optional except id
export interface UpdateEntryInput {
  content?: string
  assignedDay?: string
  orderPosition?: number
}
```

### Filter Types

```typescript
export interface EntrySearchFilters {
  content?: string
  assignedDayStart?: string
  assignedDayEnd?: string
  isDeleted?: boolean
}
```

## Avoid `any`

Use `unknown` instead of `any` when type is truly unknown:

```typescript
// ✅ Correct
function parseJson(text: string): unknown {
  return JSON.parse(text)
}

// Then narrow the type
const data = parseJson(text)
if (isEntry(data)) {
  // data is now typed as Entry
}

// ❌ Avoid
function parseJson(text: string): any {
  return JSON.parse(text)
}
```

## Type Guards

```typescript
function isEntry(value: unknown): value is Entry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'content' in value &&
    'assignedDay' in value
  )
}
```

## Generics

Use generics for reusable utility types:

```typescript
// Repository result type
interface QueryResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
}

// Usage
function useEntryDetail(id: string): QueryResult<Entry> {
  // ...
}
```

## Const Assertions

Use `as const` for literal types:

```typescript
export const ENTRY_STATUSES = ['draft', 'published', 'archived'] as const
export type EntryStatus = (typeof ENTRY_STATUSES)[number]
```

## Error Handling Patterns

### Domain Validation Errors

Use custom error classes for domain-specific validation:

```typescript
// shared/errors/domain-errors.ts
export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Usage in API layer
import { ValidationError } from '@/shared/errors/domain-errors'

if (!isValidISODate(assignedDay)) {
  throw new ValidationError(
    'assignedDay',
    'Please enter a valid date in YYYY-MM-DD format'
  )
}
```

### Type Errors vs Domain Errors

- **`TypeError`**: Use only for JavaScript type violations (string vs number vs object)
- **`ValidationError`**: Use for business rule violations (empty content, invalid dates, range errors)
- **`Error`**: Use for system errors (database connection, file not found, unexpected states)

```typescript
// ✅ Correct usage
if (typeof content !== 'string') {
  throw new TypeError('Content must be a string')
}

if (content.trim() === '') {
  throw new ValidationError('content', 'Please enter some content')
}

if (!db) {
  throw new Error('Database not initialized')
}

// ❌ Wrong - inconsistent error types
if (content.trim() === '') {
  throw new Error('Content cannot be empty') // Should be ValidationError
}
```

### Result Types & Discriminated Unions

For functions that can fail with different reasons, use discriminated unions instead of optional fields:

**❌ Avoid - Optional Fields Without Constraints**

```typescript
interface Result {
  success: boolean
  error?: Error
  reason?: 'not-found' | 'invalid' | 'error'
}

// Problem: TypeScript doesn't prevent this
const result: Result = { success: false, reason: 'error' } // Missing error!
```

**✅ Prefer - Discriminated Unions**

```typescript
type Result =
  | { success: true }
  | { success: false; reason: 'not-found' | 'invalid' }
  | { success: false; reason: 'error'; error: Error }

// TypeScript enforces: if reason is 'error', error field is required
const result: Result = { success: false, reason: 'error', error: new Error() }
```

**Benefits**:

- Compile-time safety
- Better autocomplete
- Prevents accessing undefined fields

**Usage**:

```typescript
const result = doSomething()

if (result.success) {
  // TypeScript knows: no error/reason fields here
} else if (result.reason === 'error') {
  // TypeScript knows: error field guaranteed to exist
  console.error(result.error.message)
}
```

## Boolean Conversion

When converting SQLite INTEGER (0/1) to boolean, use `Boolean()` for clarity:

```typescript
// ✅ Preferred - explicit conversion
isDeleted: Boolean(row[6])

// ⚠️ Acceptable but less clear
isDeleted: !!row[6]
```

## Non-null Assertion

Avoid `!` non-null assertion. Use proper null checks:

```typescript
// ❌ Avoid
const entry = findById(id)!

// ✅ Better - handle null case
const entry = findById(id)
if (!entry) {
  throw new Error(`Entry ${id} not found`)
}
// entry is now non-null
```

## Vue Component Types

```typescript
// Props
const props = defineProps<{
  entry: Entry
  isEditable?: boolean
}>()

// Emits
const emit = defineEmits<{
  save: [entry: Entry]
  delete: [id: string]
}>()

// Refs
const inputRef = ref<HTMLInputElement | null>(null)

// Computed with explicit return type (when needed)
const displayText = computed<string>(() => {
  return props.entry.content
})
```

## SQL Query Result Typing

When working with sql.js:

```typescript
interface SqlRow {
  [column: string]: unknown
}

function mapRowToEntry(row: SqlRow): Entry {
  return {
    id: row.id as string,
    content: row.content as string,
    assignedDay: row.assigned_day as string,
    orderPosition: row.order_position as number
    // ...
  }
}
```
