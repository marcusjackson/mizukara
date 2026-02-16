---
applyTo: '**/*-schema.ts,**/validation/**/*.ts'
---

# Validation Instructions

Guidelines for form validation using zod and vee-validate.

## Schema Files

- **Module schemas**: `modules/[module]/[module]-[form]-schema.ts`
- **Shared schemas**: `shared/validation/common-schemas.ts`
- **Base**: No validation in `base/` (validation is app-specific)

**Note**: Validation schemas belong in `modules/` or `shared/`, never in `base/`. Validation rules are inherently app-specific.

## Zod Schema Pattern

```typescript
// entry-form-schema.ts
import { z } from 'zod'

export const entryFormSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10000 characters'),

  assignedDay: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)'),

  orderPosition: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Must be at least 0')
    .optional()
})

// Export inferred type
export type EntryFormData = z.infer<typeof entryFormSchema>
```

## VeeValidate Integration

```typescript
// use-entry-form.ts
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { entryFormSchema, type EntryFormData } from '../entry-form-schema'

export function useEntryForm(initialValues?: Partial<EntryFormData>) {
  const schema = toTypedSchema(entryFormSchema)

  const { handleSubmit, errors, values, resetForm, setFieldValue } = useForm({
    validationSchema: schema,
    initialValues: {
      content: '',
      assignedDay: new Date().toISOString().split('T')[0],
      orderPosition: 0,
      ...initialValues
    }
  })

  return {
    handleSubmit,
    errors,
    values,
    resetForm,
    setFieldValue
  }
}
```

## Field Component Pattern

```vue
<script setup lang="ts">
import { useField } from 'vee-validate'
import BaseInput from '@/shared/components/BaseInput.vue'

const props = defineProps<{
  name: string
  label: string
}>()

const { value, errorMessage } = useField(() => props.name)
</script>

<template>
  <div class="field">
    <label :for="name">{{ label }}</label>
    <BaseInput
      :id="name"
      v-model="value"
      :error="!!errorMessage"
    />
    <span
      v-if="errorMessage"
      class="field-error"
    >
      {{ errorMessage }}
    </span>
  </div>
</template>
```

## Common Validation Patterns

### Required String

```typescript
z.string().min(1, 'Field is required')
```

### Optional String

```typescript
z.string().optional()
```

### Nullable Field

```typescript
z.string().nullable()
```

### Number with Range

```typescript
z.number()
  .int('Must be a whole number')
  .min(1, 'Must be at least 1')
  .max(100, 'Must be at most 100')
```

### Enum Selection

```typescript
z.enum(['option1', 'option2', 'option3'])
```

### Optional Enum

```typescript
z.enum(['draft', 'published', 'archived']).nullable().optional()
```

### Custom Validation

```typescript
z.string().refine((val) => isValidDateString(val), {
  message: 'Must be a valid date (YYYY-MM-DD)'
})
```

## Error Display

Display inline errors below fields:

```vue
<template>
  <div class="field">
    <BaseInput
      v-model="character"
      :error="!!errors.character"
    />
    <span
      v-if="errors.character"
      class="field-error"
    >
      {{ errors.character }}
    </span>
  </div>
</template>

<style scoped>
.field-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-1);
}
</style>
```

## Schema Testing

Test validation logic:

```typescript
// entry-form-schema.test.ts
import { describe, it, expect } from 'vitest'
import { entryFormSchema } from './entry-form-schema'

describe('entryFormSchema', () => {
  it('accepts valid data', () => {
    const result = entryFormSchema.safeParse({
      content: 'Had a great day',
      assignedDay: '2026-02-11'
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    const result = entryFormSchema.safeParse({
      content: '',
      assignedDay: '2026-02-11'
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = entryFormSchema.safeParse({
      content: 'Test entry',
      assignedDay: '02/11/2026'
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional order position', () => {
    const result = entryFormSchema.safeParse({
      content: 'Test entry',
      assignedDay: '2026-02-11',
      orderPosition: 5
    })
    expect(result.success).toBe(true)
  })

  it('accepts undefined order position', () => {
    const result = entryFormSchema.safeParse({
      character: '水',
      strokeCount: 4,
      jlptLevel: null
    })
    expect(result.success).toBe(true)
  })
})
```

## Shared Schemas

Common schemas in `shared/validation/`:

```typescript
// shared/validation/common-schemas.ts
import { z } from 'zod'

export const jlptLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1'])

export const joyoLevelSchema = z.enum([
  'elementary1',
  'elementary2',
  'elementary3',
  'elementary4',
  'elementary5',
  'elementary6',
  'secondary'
])

export const positiveIntSchema = z.number().int().positive()
```

Use in module schemas:

```typescript
import { dateStringSchema } from '@/shared/validation/common-schemas'

export const entryFormSchema = z.object({
  // ...
  assignedDay: dateStringSchema,
  createdAt: dateStringSchema
})
```

## Validation Constants

Extract error messages and validation rules to constants:

```typescript
// shared/validation/validation-errors.ts
export const ENTRY_VALIDATION_ERRORS = {
  CONTENT_EMPTY: 'Please enter some content for your entry',
  CONTENT_TYPE: 'Content must be a string',
  DATE_FORMAT: 'Please enter a valid date in YYYY-MM-DD format'
} as const

export const DATE_VALIDATION_CONSTRAINTS = {
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
  MIN_MONTH: 1,
  MAX_MONTH: 12,
  MIN_DAY: 1,
  MAX_DAY: 31
} as const
```

**Benefits**:

- Consistent error messages across application
- Easy to update copy without searching codebase
- Enables future i18n support
- Self-documenting validation rules

**Usage in validation functions**:

```typescript
import { ENTRY_VALIDATION_ERRORS } from '@/shared/validation/validation-errors'

function validateEntryInput(input: { content?: string }) {
  if (input.content !== undefined && input.content.trim().length === 0) {
    throw new ValidationError('content', ENTRY_VALIDATION_ERRORS.CONTENT_EMPTY)
  }
}
```

**Usage in schemas**:

```typescript
import { ENTRY_VALIDATION_ERRORS } from '@/shared/validation/validation-errors'

export const entryFormSchema = z.object({
  content: z.string().min(1, ENTRY_VALIDATION_ERRORS.CONTENT_EMPTY)
})
```

---

## See Also

- [tech.md](../../.kiro/steering/tech.md) — Type safety standards and zod integration
