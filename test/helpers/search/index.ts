/**
 * Search Test Helpers - Re-exports all search-related test utilities
 *
 * Search needs entries, tags, entry_tags, and the entries_fts sync triggers
 * all present, which createTestDatabaseForEntries already provides by running
 * every production migration — reused here under a search-scoped alias rather
 * than duplicating that factory.
 */

export { createTestDatabaseForEntries as createTestDatabaseForSearch } from '../entries/seeders'
