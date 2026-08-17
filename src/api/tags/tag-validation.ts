/**
 * Thrown when tag input fails validation (e.g. empty name, duplicate name).
 * Caught by mutation composables and surfaced as inline field errors.
 */
export class TagValidationError extends Error {
  override name = 'TagValidationError'

  constructor(message: string) {
    super(message)
    // Restore prototype chain for instanceof checks in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Thrown when a tag ID is not found (or is soft-deleted) during rename or delete.
 * Caught by mutation composables and surfaced as an error toast.
 */
export class TagNotFoundError extends Error {
  override name = 'TagNotFoundError'
  /** The tag ID that was not found */
  readonly tagId: string

  constructor(tagId: string) {
    super(`Tag not found: ${tagId}`)
    this.tagId = tagId
    // Restore prototype chain for instanceof checks in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
