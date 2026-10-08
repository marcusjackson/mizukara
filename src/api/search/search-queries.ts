/**
 * Search Query Functions
 *
 * Combined text + tag search over entries. A distinct SQL shape is used per
 * combination of filters present — tags-only, text-only, both, or neither —
 * rather than one query with optional joins, since each combination's own
 * WHERE/JOIN/HAVING needs differ enough that conditionally-included joins
 * would obscure more than they'd save. See docs/units/search/atlas.md for
 * this unit's cross-file rationale (FTS/WASM, capping, tag-intersection
 * duplication).
 *
 * All branches filter is_deleted = 0 and order by assigned_day DESC, id ASC;
 * the id tiebreak (absent from findEntriesByTags's own ordering) is what makes
 * a capped and an uncapped run of the same filters agree on which entries land
 * in the first CAPPED_LIMIT.
 */

import { queryResultToEntries } from '@/api/entries/entry-helpers'

import { addMonths } from '@/shared/utils/date-utils'

import type { DayCount, SearchFilters } from './search-types'
import type { Entry } from '@/shared/types/entry-types'
import type { Database } from 'sql.js'

/** How many matches the list view shows unless "Show all results" is on */
export const CAPPED_LIMIT = 20

const ENTRY_COLUMNS = `e.id, e.content, e.created_at, e.updated_at,
            e.assigned_day, e.order_position, e.is_deleted`

/**
 * Search entries by free-text query and/or tag intersection
 *
 * Returns [] immediately, without querying, when neither a query nor tagIds
 * is provided. Combining both filters is AND: an entry must match the text
 * query and carry every selected tag.
 *
 * @param db - SQLite database instance
 * @param filters - query text and/or tagIds to filter by
 * @param options.capped - when true, limits results to the CAPPED_LIMIT most
 *   recent matches; when false, returns every match
 * @returns Array of Entry objects ordered by assigned_day DESC, id ASC
 */
export function search(
  db: Database,
  filters: SearchFilters,
  options: { capped: boolean }
): Entry[] {
  const tagIds = [...new Set(filters.tagIds ?? [])]
  const matchQuery = buildFtsMatchQuery(filters.query ?? '')
  const hasTags = tagIds.length > 0
  const limitClause = options.capped ? ` LIMIT ${String(CAPPED_LIMIT)}` : ''

  if (matchQuery !== null) {
    return hasTags
      ? searchByTagsAndText(db, tagIds, matchQuery, limitClause)
      : searchByText(db, matchQuery, limitClause)
  }

  if (hasTags) {
    return searchByTags(db, tagIds, limitClause)
  }

  return []
}

/**
 * Build an FTS4 MATCH expression from raw user input.
 *
 * FTS4's query syntax reads unescaped `"`, unbalanced parens, and the bare
 * words AND/OR/NOT/NEAR as query operators rather than literal text — an
 * unsanitized user query containing any of these throws a "malformed MATCH
 * expression" error out of db.exec(). Splitting on whitespace and wrapping
 * each term in double quotes forces every term to be matched as a literal
 * token (a single-word phrase) rather than parsed as an operator; embedded
 * double-quotes are stripped first since a token can never legitimately
 * contain one (the tokenizer treats punctuation as a separator anyway).
 * Space-separated quoted terms still combine with FTS4's default implicit
 * AND, so multi-word queries keep their current all-terms-must-match
 * behavior.
 *
 * @returns The MATCH-ready expression, or null if the input has no terms
 *   left after sanitization (e.g. empty, whitespace-only, or punctuation-only)
 */
function buildFtsMatchQuery(rawQuery: string): string | null {
  const terms = rawQuery
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/"/g, ''))
    // A term with no letter/number content (e.g. "()", "--") can never match
    // porter-tokenized content anyway, so drop it rather than issue a query
    // for an empty phrase.
    .filter((term) => /[\p{L}\p{N}]/u.test(term))

  if (terms.length === 0) return null

  return terms.map((term) => `"${term}"`).join(' ')
}

function searchByTags(
  db: Database,
  tagIds: string[],
  limitClause: string
): Entry[] {
  const placeholders = tagIds.map(() => '?').join(', ')

  const result = db.exec(
    `SELECT ${ENTRY_COLUMNS}
     FROM entries e
     INNER JOIN entry_tags et ON et.entry_id = e.id AND et.is_deleted = 0
     WHERE e.is_deleted = 0
       AND et.tag_id IN (${placeholders})
     GROUP BY e.id
     HAVING COUNT(DISTINCT et.tag_id) = ?
     ORDER BY e.assigned_day DESC, e.id ASC${limitClause}`,
    [...tagIds, tagIds.length]
  )

  if (!result[0]) return []
  return queryResultToEntries(result[0])
}

function searchByText(
  db: Database,
  matchQuery: string,
  limitClause: string
): Entry[] {
  const result = db.exec(
    `SELECT ${ENTRY_COLUMNS}
     FROM entries e
     INNER JOIN entries_fts f ON f.id = e.id
     WHERE e.is_deleted = 0
       AND f.content MATCH ?
     GROUP BY e.id
     ORDER BY e.assigned_day DESC, e.id ASC${limitClause}`,
    [matchQuery]
  )

  if (!result[0]) return []
  return queryResultToEntries(result[0])
}

function searchByTagsAndText(
  db: Database,
  tagIds: string[],
  matchQuery: string,
  limitClause: string
): Entry[] {
  const placeholders = tagIds.map(() => '?').join(', ')

  const result = db.exec(
    `SELECT ${ENTRY_COLUMNS}
     FROM entries e
     INNER JOIN entry_tags et ON et.entry_id = e.id AND et.is_deleted = 0
     INNER JOIN entries_fts f ON f.id = e.id
     WHERE e.is_deleted = 0
       AND et.tag_id IN (${placeholders})
       AND f.content MATCH ?
     GROUP BY e.id
     HAVING COUNT(DISTINCT et.tag_id) = ?
     ORDER BY e.assigned_day DESC, e.id ASC${limitClause}`,
    [...tagIds, matchQuery, tagIds.length]
  )

  if (!result[0]) return []
  return queryResultToEntries(result[0])
}

/**
 * Find per-day match counts for the calendar view, scoped to a single month
 *
 * Unlike search(), the neither-filter-present case is meaningful here: it
 * queries unconditionally and returns the month's unfiltered per-day counts
 * (a bounded, cheap aggregate — at most one row per day in the month), since
 * an unfiltered list-view result would be the entire non-deleted corpus. Each
 * filtered branch computes the entry-level AND-intersection first (the same
 * shape search() uses), then aggregates COUNT(*) GROUP BY assigned_day over
 * that result — grouping directly by assigned_day while keeping the tags
 * HAVING clause would count distinct tags matched by any entry that day
 * rather than by one entry, breaking AND semantics across same-day entries.
 *
 * @param db - SQLite database instance
 * @param filters - query text and/or tagIds to filter by
 * @param month - Month to scope counts to, as a YYYY-MM string
 * @returns Array of { assignedDay, count }, one entry per day with at least
 *   one match, ordered by assignedDay ascending
 */
export function findDayCounts(
  db: Database,
  filters: SearchFilters,
  month: string
): DayCount[] {
  const tagIds = [...new Set(filters.tagIds ?? [])]
  const matchQuery = buildFtsMatchQuery(filters.query ?? '')
  const hasTags = tagIds.length > 0
  const { end, start } = getMonthBounds(month)

  if (matchQuery !== null) {
    return hasTags
      ? dayCountsByTagsAndText(db, tagIds, matchQuery, start, end)
      : dayCountsByText(db, matchQuery, start, end)
  }

  if (hasTags) {
    return dayCountsByTags(db, tagIds, start, end)
  }

  return dayCountsUnfiltered(db, start, end)
}

/**
 * Compute the [start, end) assigned_day bounds for a YYYY-MM month string.
 * `end` is the first day of the following month, for a half-open range.
 */
function getMonthBounds(month: string): { start: string; end: string } {
  return { start: `${month}-01`, end: `${addMonths(month, 1)}-01` }
}

function queryResultToDayCounts(
  result: ReturnType<Database['exec']>
): DayCount[] {
  if (!result[0]) return []
  return result[0].values.map((row) => ({
    assignedDay: row[0] as string,
    count: row[1] as number
  }))
}

function dayCountsByTags(
  db: Database,
  tagIds: string[],
  start: string,
  end: string
): DayCount[] {
  const placeholders = tagIds.map(() => '?').join(', ')

  const result = db.exec(
    `SELECT assigned_day, COUNT(*) AS count FROM (
       SELECT e.id, e.assigned_day
       FROM entries e
       INNER JOIN entry_tags et ON et.entry_id = e.id AND et.is_deleted = 0
       WHERE e.is_deleted = 0
         AND et.tag_id IN (${placeholders})
         AND e.assigned_day >= ? AND e.assigned_day < ?
       GROUP BY e.id
       HAVING COUNT(DISTINCT et.tag_id) = ?
     ) matched
     GROUP BY assigned_day
     ORDER BY assigned_day`,
    [...tagIds, start, end, tagIds.length]
  )

  return queryResultToDayCounts(result)
}

function dayCountsByText(
  db: Database,
  matchQuery: string,
  start: string,
  end: string
): DayCount[] {
  const result = db.exec(
    `SELECT assigned_day, COUNT(*) AS count FROM (
       SELECT e.id, e.assigned_day
       FROM entries e
       INNER JOIN entries_fts f ON f.id = e.id
       WHERE e.is_deleted = 0
         AND f.content MATCH ?
         AND e.assigned_day >= ? AND e.assigned_day < ?
       GROUP BY e.id
     ) matched
     GROUP BY assigned_day
     ORDER BY assigned_day`,
    [matchQuery, start, end]
  )

  return queryResultToDayCounts(result)
}

function dayCountsByTagsAndText(
  db: Database,
  tagIds: string[],
  matchQuery: string,
  start: string,
  end: string
): DayCount[] {
  const placeholders = tagIds.map(() => '?').join(', ')

  const result = db.exec(
    `SELECT assigned_day, COUNT(*) AS count FROM (
       SELECT e.id, e.assigned_day
       FROM entries e
       INNER JOIN entry_tags et ON et.entry_id = e.id AND et.is_deleted = 0
       INNER JOIN entries_fts f ON f.id = e.id
       WHERE e.is_deleted = 0
         AND et.tag_id IN (${placeholders})
         AND f.content MATCH ?
         AND e.assigned_day >= ? AND e.assigned_day < ?
       GROUP BY e.id
       HAVING COUNT(DISTINCT et.tag_id) = ?
     ) matched
     GROUP BY assigned_day
     ORDER BY assigned_day`,
    [...tagIds, matchQuery, start, end, tagIds.length]
  )

  return queryResultToDayCounts(result)
}

function dayCountsUnfiltered(
  db: Database,
  start: string,
  end: string
): DayCount[] {
  const result = db.exec(
    `SELECT assigned_day, COUNT(*) AS count
     FROM entries
     WHERE is_deleted = 0
       AND assigned_day >= ? AND assigned_day < ?
     GROUP BY assigned_day
     ORDER BY assigned_day`,
    [start, end]
  )

  return queryResultToDayCounts(result)
}
