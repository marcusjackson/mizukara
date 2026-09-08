/**
 * Search filter input
 *
 * Both fields are optional and independent; `search()` combines them with AND
 * semantics when both are present.
 */
export interface SearchFilters {
  /** Free-text query matched against entries_fts (porter-tokenized content) */
  query?: string
  /** Entry must carry every one of these tag IDs (intersection, not union) */
  tagIds?: string[]
}

/** Per-day match count for the calendar view, scoped to a single month */
export interface DayCount {
  /** ISO date string (YYYY-MM-DD) */
  assignedDay: string
  /** Number of matching, non-deleted entries assigned to that day */
  count: number
}
