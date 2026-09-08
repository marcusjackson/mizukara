-- Migration: 004-create-entries-fts.sql
-- Description: Create an FTS4 virtual table mirroring entries.content for full-text
-- search, kept in sync by triggers on the entries table.
--
-- notindexed=id excludes the id column from the full-text index while still
-- storing it (FTS4 syntax; FTS5's inline UNINDEXED keyword is not available in
-- this repo's sql.js build).
--
-- The triggers mirror every row, including soft-deleted ones — is_deleted is
-- not consulted at trigger time. Soft-deleted entries are excluded from search
-- results at the query layer instead, the same place findEntriesByTags already
-- filters is_deleted.

CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts4(
  id,
  content,
  tokenize=porter,
  notindexed=id
);

CREATE TRIGGER IF NOT EXISTS trg_entries_fts_insert
AFTER INSERT ON entries
BEGIN
  INSERT INTO entries_fts (id, content) VALUES (new.id, new.content);
END;

CREATE TRIGGER IF NOT EXISTS trg_entries_fts_update
AFTER UPDATE OF content ON entries
BEGIN
  UPDATE entries_fts SET content = new.content WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_entries_fts_delete
AFTER DELETE ON entries
BEGIN
  DELETE FROM entries_fts WHERE id = old.id;
END;

-- Backfill existing rows (no-op on a fresh database with no entries yet)
INSERT INTO entries_fts (id, content)
SELECT id, content FROM entries;

PRAGMA user_version = 4;
