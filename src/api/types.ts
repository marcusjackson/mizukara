/**
 * API Layer Types
 *
 * Core interfaces and error classes for the repository pattern.
 * All repositories should implement these interfaces for consistency.
 */

// ============================================================================
// Repository Interfaces
// ============================================================================

/**
 * Base repository interface for all entities
 */
export interface Repository<
  T,
  CreateInput,
  UpdateInput = Partial<CreateInput>
> {
  /** Get entity by ID, returns null if not found */
  getById(id: number): T | null

  /** Get all entities */
  getAll(): T[]

  /** Create new entity */
  create(input: CreateInput): T

  /** Update entity by ID */
  update(id: number, input: UpdateInput): T

  /** Delete entity by ID */
  remove(id: number): void
}

/**
 * Extension for entities with display ordering
 */
export interface Orderable {
  reorder(ids: number[]): void
}

/**
 * Extension for child entities that belong to a parent
 */
export interface ChildRepository<
  T,
  CreateInput,
  UpdateInput
> extends Repository<T, CreateInput, UpdateInput> {
  /** Get all by parent ID */
  getByParentId(parentId: number): T[]
}

/**
 * Extension for entities that support field-level updates
 */
export interface FieldUpdatable<T> {
  /** Generic field update method */
  updateField<K extends UpdatableField<T>>(id: number, field: K, value: T[K]): T
}

/**
 * Fields that can be updated (excludes id, timestamps)
 */
export type UpdatableField<T> = Exclude<
  keyof T,
  'id' | 'createdAt' | 'updatedAt'
>

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Base error for repository operations
 */
export class RepositoryError extends Error {
  public override readonly cause?: unknown
  constructor(
    message: string,
    public readonly operation: string,
    public readonly entity: string,
    cause?: unknown
  ) {
    super(message)
    this.name = 'RepositoryError'
    this.cause = cause
  }
}

/**
 * Error when entity is not found
 */
export class EntityNotFoundError extends RepositoryError {
  constructor(entity: string, id: number) {
    super(`${entity} with id ${String(id)} not found`, 'get', entity)
    this.name = 'EntityNotFoundError'
  }
}

/**
 * Error when creating entity fails
 */
export class CreateError extends RepositoryError {
  constructor(entity: string, cause?: unknown) {
    super(`Failed to create ${entity}`, 'create', entity, cause)
    this.name = 'CreateError'
  }
}

/**
 * Error when updating entity fails
 */
export class UpdateError extends RepositoryError {
  constructor(entity: string, id: number, cause?: unknown) {
    super(
      `Failed to update ${entity} with id ${String(id)}`,
      'update',
      entity,
      cause
    )
    this.name = 'UpdateError'
  }
}

/**
 * Error when deleting entity fails
 */
export class DeleteError extends RepositoryError {
  constructor(entity: string, id: number, cause?: unknown) {
    super(
      `Failed to delete ${entity} with id ${String(id)}`,
      'delete',
      entity,
      cause
    )
    this.name = 'DeleteError'
  }
}

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Result from sql.js query execution
 */
export interface QueryResult {
  columns: string[]
  values: unknown[][]
}
