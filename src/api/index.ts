/**
 * API Layer - Public Exports
 *
 * Re-exports all public API types and utilities.
 * Repositories will be added here as they're implemented.
 */

// Types and interfaces
export type {
  ChildRepository,
  FieldUpdatable,
  Orderable,
  QueryResult,
  Repository,
  UpdatableField
} from './types'

// Error classes
export {
  CreateError,
  DeleteError,
  EntityNotFoundError,
  RepositoryError,
  UpdateError
} from './types'

// Base classes and utilities
export { BaseRepository } from './base-repository'
export { autoPersist, withAutoPersist } from './persistence'

// ============================================================================
// Module re-exports (add as repositories are implemented)
// ============================================================================

// Domain modules
// export * from './component' // Components + forms + occurrences + groupings
// export * from './kanji' // Kanji + readings + meanings
// export * from './vocabulary' // Vocabulary + vocab-kanji links

// Reference data modules
// export * from './classification' // Classification types (kanji etymology) + junction
// export * from './position' // Position types (component placement)
