import { EntityNotFoundError, RepositoryError } from '@/api/types'

/**
 * Thrown when tag input fails validation (e.g. empty name, duplicate name).
 * Caught by mutation composables and surfaced as inline field errors.
 *
 * Extends RepositoryError like `EntryValidationError` does, but keeps the
 * message exactly as given: it is shown to the person as written.
 */
export class TagValidationError extends RepositoryError {
  /** The input field that failed validation; tag input has only a name */
  readonly field = 'name'

  constructor(message: string) {
    super(message, 'validate', 'Tag')
    this.name = 'TagValidationError'
    // Restore prototype chain for instanceof checks in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Thrown when a tag ID is not found (or is soft-deleted) during rename or delete.
 * Caught by mutation composables and surfaced as an error toast.
 */
export class TagNotFoundError extends EntityNotFoundError {
  /** The tag ID that was not found */
  readonly tagId: string

  constructor(tagId: string) {
    super('Tag', tagId)
    this.name = 'TagNotFoundError'
    this.tagId = tagId
    // Restore prototype chain for instanceof checks in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
