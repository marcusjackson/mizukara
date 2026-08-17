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
