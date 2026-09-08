/**
 * Search Module Public Exports
 *
 * Internal components are not exported here — they are consumed via direct
 * imports in the pages/routes layer, matching the tags module's convention.
 */

export type { UseSearchReturn } from './composables/use-search'
export { useSearch } from './composables/use-search'
export type { UseSearchTagOptionsReturn } from './composables/use-search-tag-options'
export { useSearchTagOptions } from './composables/use-search-tag-options'
