/**
 * API Layer Types
 *
 * Error classes shared by the repository functions.
 */

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
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'get', entity)
    this.name = 'EntityNotFoundError'
  }
}
