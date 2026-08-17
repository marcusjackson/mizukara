/**
 * Tags Module Public Exports
 *
 * Export composables and types used by other modules (e.g., entry-day-view).
 * Internal components are not exported here — they are consumed via direct
 * imports in the pages/routes layer.
 */

// Composables
export { useEntryTagMutations } from './composables/use-entry-tag-mutations'
export { useTagMutations } from './composables/use-tag-mutations'
export { useTags } from './composables/use-tags'

// Types (re-export for convenience)
export type { UseEntryTagMutationsReturn } from './composables/use-entry-tag-mutations'
export type { UseTagMutationsReturn } from './composables/use-tag-mutations'
export type { UseTagsReturn } from './composables/use-tags'
