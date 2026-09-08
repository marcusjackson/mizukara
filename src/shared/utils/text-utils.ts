/**
 * Text Utility Functions
 *
 * Small pure-function helpers for presenting text content.
 */

/** Default snippet length used by truncateSnippet. */
export const SNIPPET_MAX_LENGTH = 200

/**
 * Truncate content to a snippet of at most maxLength characters.
 *
 * Cuts at maxLength, then trims back to the nearest preceding word boundary
 * (whitespace) so a word is never split mid-word. If no word boundary exists
 * within that span (e.g. a long unbroken run of non-whitespace-delimited
 * characters), falls back to the hard maxLength cut with no trim-back.
 * A trailing ellipsis is appended whenever content is longer than maxLength;
 * content at or under maxLength is returned unchanged.
 *
 * @param content - Full text to snippet
 * @param maxLength - Maximum snippet length before trim-back (default 200)
 * @returns The (possibly truncated) snippet
 *
 * @example
 * truncateSnippet('Had a great day exploring the city', 20)
 * // 'Had a great day…'
 * @example
 * truncateSnippet('short content')
 * // 'short content'
 */
export function truncateSnippet(
  content: string,
  maxLength: number = SNIPPET_MAX_LENGTH
): string {
  if (content.length <= maxLength) return content

  const slice = content.slice(0, maxLength)
  const boundaryMatch = /\s+\S*$/.exec(slice)
  const cut = boundaryMatch ? slice.slice(0, boundaryMatch.index) : slice

  return `${cut}…`
}
