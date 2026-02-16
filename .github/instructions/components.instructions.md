---
applyTo: '**/*.vue'
---

# Vue Component Instructions

Guidelines for creating and modifying Vue components.

## Component Hierarchy

Three-tier hierarchy with **strict file size limits**:

| Tier    | Purpose                 | Max Lines | Pattern                           |
| ------- | ----------------------- | --------- | --------------------------------- |
| Root    | Page orchestration      | **250**   | `[Module]Root[Descriptor].vue`    |
| Section | Layout, mode management | **250**   | `[Module]Section[Descriptor].vue` |
| UI      | Presentation            | **225**   | `[Module][Descriptor].vue`        |

### Root Components

- **One Root per page** (not multiple Roots)
- Fetch data via repository composables
- Handle loading/error states
- Coordinate page-level actions
- **Extract handlers to composables when approaching limit**

```vue
<!-- Target: ~200-250 lines -->
<script setup lang="ts">
const { state, handlers } = useEntryDetail(props.entryId)
</script>

<template>
  <SharedPageContainer :loading="state.isLoading">
    <EntrySectionContent @update="handlers.onUpdateContent" />
  </SharedPageContainer>
</template>
```

### Section Components

- Orchestrate UI within a logical area
- Manage view/edit modes
- **Split by mode when approaching limit**

```
EntrySectionContent.vue (orchestrator, ~150 lines)
├── EntryContentViewMode.vue (~150 lines)
├── EntryContentEditMode.vue (~200 lines)
└── EntryMetadataItem.vue (~80 lines)
```

### UI Components

- Purely presentational
- Props in, events out
- No data fetching

## When Files Exceed Limits

### Root Too Large (>250 lines)

Extract to composables:

```typescript
// use-entry-detail-handlers.ts
export function useEntryDetailHandlers(entry: Ref<Entry | null>) {
  const handleUpdateContent = async (content: string) => {
    /* ... */
  }
  return { handleUpdateContent /* ... */ }
}
```

### Section Too Large (>250 lines)

Split by mode:

```
Before: EntryDetailContent.vue (500 lines)
After:
├── EntrySectionContent.vue (150 lines) - orchestrator
├── EntryContentViewMode.vue (150 lines)
└── EntryContentEditMode.vue (200 lines)
```

## Naming Conventions

| Type    | Pattern                           | Example                   |
| ------- | --------------------------------- | ------------------------- |
| Root    | `[Module]Root[Descriptor].vue`    | `EntryRootDetail.vue`     |
| Section | `[Module]Section[Descriptor].vue` | `EntrySectionContent.vue` |
| UI      | `[Module][Descriptor].vue`        | `EntryMetadataItem.vue`   |
| Base    | `Base[Name].vue`                  | `BaseButton.vue`          |
| Shared  | `Shared[Name].vue`                | `SharedHeader.vue`        |

## SFC Structure

```vue
<script setup lang="ts">
// 1. Vue imports
// 2. Third-party imports
// 3. Base imports (@/base/)
// 4. Shared imports (@/shared/)
// 5. Module imports (relative)
// 6. Type imports

// Props → Emits → Composables → State → Computed → Methods
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* CSS variables only */
</style>
```

## Props and Emits

```typescript
// Simple (≤4 props) - inline
const props = defineProps<{
  entry: Entry
  isEditable?: boolean
}>()

// Complex (>4 props) - interface
interface Props {
  entries: Entry[]
  filters: Filters
  isLoading: boolean
}
const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  save: [entry: Entry]
  delete: [id: string]
}>()
```

## Styling Rules

1. **Always** use `<style scoped>`
2. **Always** use CSS variables from design tokens
3. **Never** hardcode colors, spacing, or font sizes

```css
/* ✅ Correct */
.card {
  padding: var(--spacing-md);
  background: var(--color-surface);
}

/* ❌ Wrong */
.card {
  padding: 16px;
  background: #ffffff;
}
```

## Loading and Error States

Root components must handle:

```vue
<template>
  <div v-if="isLoading"><BaseSpinner /></div>
  <div v-else-if="error">{{ error.message }}</div>
  <EntrySectionDetail
    v-else
    :entry="entry"
  />
</template>
```

## Accessibility

- Interactive elements must be keyboard accessible
- Use semantic HTML
- Add ARIA labels to icon-only buttons
- Ensure visible focus styles

```vue
<button type="button" aria-label="Delete entry" @click="handleDelete">
  <IconTrash />
</button>
```

## Quick Reference

**Before creating/editing a component:**

1. Check current line count
2. If approaching limit, plan extraction first
3. Root handlers → composable
4. Section modes → separate components

---

## See Also

- [structure.md](../../.kiro/steering/structure.md) — Component hierarchy and organization patterns
- [tech.md](../../.kiro/steering/tech.md) — File size limits rationale and architecture

**File size targets:**

- Root: 200-250 lines (250 max)
- Section: 150-250 lines (250 max)
- UI: 100-200 lines (225 max)
